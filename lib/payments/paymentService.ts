/**
 * Advanced Payment Service
 * Abstraction layer supporting multiple payment gateways
 * Currently: LakiPay
 * Can be extended: Paypal, Stripe, etc.
 */

import { supabase } from '../supabaseClient';
import {
  createCheckoutSession,
  getTransactionStatus,
  generateSubscriptionReference,
  generatePaymentReference,
  formatAmount,
  type LakiPayCheckoutRequest,
  type Currency,
  type PaymentMethod,
} from './lakipay';

export type PaymentGateway = 'lakipay' | 'stripe' | 'paypal';

export interface PaymentSessionRequest {
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency?: Currency;
  description?: string;
  paymentMethods?: PaymentMethod[];
}

export interface PaymentSessionResponse {
  success: boolean;
  data?: {
    sessionUrl: string;
    transactionId: string;
    expiresAt?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface PaymentVerificationRequest {
  transactionId: string;
  userId: string;
  planId: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  status?: string;
  message?: string;
  data?: {
    transactionId: string;
    userId: string;
    planId: string;
    amount: number;
    currency: Currency;
    paymentMethod: PaymentMethod;
    completedAt?: string;
  };
}

/**
 * Create payment session for subscription
 */
export async function createPaymentSession(
  request: PaymentSessionRequest
): Promise<PaymentSessionResponse> {
  try {
    console.log('createPaymentSession called with', JSON.stringify(request));
    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('id', request.planId)
      .eq('is_active', true)
      .single();

    console.log('createPaymentSession: plan query result', { plan, planError });

    if (planError || !plan) {
      return {
        success: false,
        error: {
          code: 'PLAN_NOT_FOUND',
          message: 'Pricing plan not found',
        },
      };
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', request.userId)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      };
    }

    // Generate reference ID for this subscription
    const reference = generateSubscriptionReference(request.userId, request.planId);

    // Determine amount based on billing cycle
    const amount = request.billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

    // Get callback URLs
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    // Create LakiPay checkout session
    const checkoutResponse = await createCheckoutSession({
      amount: formatAmount(amount),
      currency: request.currency || 'ETB',
      reference: reference,
      description: `${plan.name} - ${request.billingCycle} subscription`,
      customer_email: user.email,
      customer_name: user.full_name || user.email,
      supported_mediums: request.paymentMethods || [
        'TELEBIRR',
        'MPESA',
        'CBE',
        'AWASH',
        'KACHA',
        'CARD',
      ],
      callback_url: `${baseUrl}/api/payments/lakipay/webhook`,
      redirects: {
        success: `${baseUrl}/payment-result?success=true&tx=${reference}&planId=${request.planId}`,
        failed: `${baseUrl}/payment-result?failed=true&tx=${reference}&planId=${request.planId}`,
      },
      metadata: {
        userId: request.userId,
        planId: request.planId,
        billingCycle: request.billingCycle,
        type: 'subscription',
      },
    });

    if (!checkoutResponse.success) {
      return {
        success: false,
        error: checkoutResponse.error,
      };
    }

    // Store pending transaction
    const { error: txError } = await supabase.from('pending_transactions').insert({
      user_id: request.userId,
      plan_id: request.planId,
      lakipay_transaction_id: checkoutResponse.data?.lakipay_transaction_id,
      reference: reference,
      amount: amount,
      currency: request.currency || 'ETB',
      billing_cycle: request.billingCycle,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: checkoutResponse.data?.expires_at,
    });

    if (txError) {
      console.error('Failed to store pending transaction:', txError);
    }

    return {
      success: true,
      data: {
        sessionUrl: checkoutResponse.data?.payment_url || '',
        transactionId: checkoutResponse.data?.lakipay_transaction_id || '',
        expiresAt: checkoutResponse.data?.expires_at,
      },
    };
  } catch (error) {
    console.error('Payment session creation error:', error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error instanceof Error ? error.message : 'Failed to create payment session',
      },
    };
  }
}

/**
 * Verify payment completion
 */
export async function verifyPayment(
  request: PaymentVerificationRequest
): Promise<PaymentVerificationResponse> {
  try {
    // Get transaction status from LakiPay
    const transaction = await getTransactionStatus(request.transactionId);

    if (!transaction) {
      return {
        success: false,
        status: 'NOT_FOUND',
        message: 'Transaction not found',
      };
    }

    if (transaction.status !== 'COMPLETED') {
      return {
        success: false,
        status: transaction.status,
        message: `Payment status: ${transaction.status}`,
      };
    }

    // Payment is successful - update subscription in database
    const { data: plan } = await supabase
      .from('pricing_plans')
      .select('tier')
      .eq('id', request.planId)
      .single();

    // Get billing cycle from metadata
    const { data: pending } = await supabase
      .from('pending_transactions')
      .select('billing_cycle')
      .eq('lakipay_transaction_id', request.transactionId)
      .single();

    const billingCycle = pending?.billing_cycle || 'monthly';

    // Create/update subscription
    const now = new Date();
    const periodEnd = new Date(
      now.getTime() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
    );

    const { error: subError } = await supabase.from('user_subscriptions').upsert(
      {
        user_id: request.userId,
        plan_id: request.planId,
        lakipay_transaction_id: request.transactionId,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (subError) {
      console.error('Failed to create subscription:', subError);
      return {
        success: false,
        status: 'ERROR',
        message: 'Failed to activate subscription',
      };
    }

    // Update user profile tier
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: plan?.tier || 'pro',
        updated_at: now.toISOString(),
      })
      .eq('id', request.userId);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
    }

    // Log payment
    const { error: paymentError } = await supabase.from('payment_history').insert({
      user_id: request.userId,
      subscription_id: request.planId,
      lakipay_transaction_id: request.transactionId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: 'succeeded',
      description: `Subscription payment for ${plan?.tier || 'plan'}`,
      metadata: transaction.metadata,
      created_at: now.toISOString(),
    });

    if (paymentError) {
      console.error('Failed to log payment:', paymentError);
    }

    // Mark pending transaction as completed
    const { error: markError } = await supabase
      .from('pending_transactions')
      .update({ status: 'completed', updated_at: now.toISOString() })
      .eq('lakipay_transaction_id', request.transactionId);

    if (markError) {
      console.error('Failed to mark transaction completed:', markError);
    }

    return {
      success: true,
      status: 'COMPLETED',
      message: 'Payment verified and subscription activated',
      data: {
        transactionId: request.transactionId,
        userId: request.userId,
        planId: request.planId,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentMethod: (transaction.payment_method as PaymentMethod) || 'ALL',
        completedAt: transaction.completed_at,
      },
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Failed to verify payment',
    };
  }
}

/**
 * Handle webhook from payment gateway
 */
export async function handlePaymentWebhook(
  transactionId: string,
  status: string,
  metadata?: Record<string, any>
) {
  try {
    // Get pending transaction
    const { data: pending } = await supabase
      .from('pending_transactions')
      .select('*')
      .eq('lakipay_transaction_id', transactionId)
      .single();

    if (!pending) {
      console.warn(`No pending transaction found for: ${transactionId}`);
      return;
    }

    if (status === 'COMPLETED') {
      // Verify and activate subscription
      await verifyPayment({
        transactionId,
        userId: pending.user_id,
        planId: pending.plan_id,
      });
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      // Mark as failed
      const { error } = await supabase
        .from('pending_transactions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('lakipay_transaction_id', transactionId);

      if (error) {
        console.error('Failed to mark transaction as failed:', error);
      }

      // Log failed payment
      await supabase.from('payment_history').insert({
        user_id: pending.user_id,
        lakipay_transaction_id: transactionId,
        amount: pending.amount,
        currency: pending.currency,
        status: 'failed',
        description: `Payment failed - ${status}`,
        created_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Webhook handling error:', error);
  }
}

/**
 * Check subscription status for user
 */
export async function getUserSubscription(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*, pricing_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId: string) {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Update user tier back to free
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
    }

    return true;
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return false;
  }
}
