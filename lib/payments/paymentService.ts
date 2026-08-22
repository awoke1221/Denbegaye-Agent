/**
 * Advanced Payment Service
 * Abstraction layer supporting multiple payment gateways
 * Currently: LakiPay
 * Can be extended: Paypal, Stripe, etc.
 */

import { supabase, supabaseAdmin } from '../supabaseClient';
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
import {
  createPayPalSubscription,
  getPayPalPlanId,
  getPayPalSubscription,
  cancelPayPalSubscription,
} from './paypal';

const paymentDatabase = supabaseAdmin || supabase;

export type PaymentGateway = 'lakipay' | 'stripe' | 'paypal';

export interface PaymentSessionRequest {
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency?: Currency;
  description?: string;
  paymentMethods?: PaymentMethod[];
  gateway?: PaymentGateway;
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
  gateway?: PaymentGateway;
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
    const gateway = request.gateway || 'paypal';

    const { data: plan, error: planError } = await paymentDatabase
      .from('pricing_plans')
      .select('*')
      .eq('id', request.planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return {
        success: false,
        error: {
          code: 'PLAN_NOT_FOUND',
          message: 'Pricing plan not found',
        },
      };
    }

    const { data: user, error: userError } = await paymentDatabase
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

    const amount = request.billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    if (gateway === 'paypal') {
      const paypalPlanId = getPayPalPlanId(request.billingCycle);
      if (!paypalPlanId) {
        return {
          success: false,
          error: {
            code: 'PAYPAL_PLAN_NOT_CONFIGURED',
            message: `PayPal ${request.billingCycle} billing plan is not configured.`,
          },
        };
      }

      const paypalSubscription = await createPayPalSubscription({
        planId: paypalPlanId,
        customId: `${request.userId}|${request.planId}|${request.billingCycle}`,
        subscriberEmail: user.email,
        returnUrl: `${baseUrl}/payment-result?success=true&gateway=paypal&planId=${request.planId}`,
        cancelUrl: `${baseUrl}/payment-result?failed=true&gateway=paypal&planId=${request.planId}`,
      });

      if (!paypalSubscription.success || !paypalSubscription.subscriptionId) {
        return {
          success: false,
          error: paypalSubscription.error || {
            code: 'PAYPAL_ERROR',
            message: 'Unable to create recurring PayPal subscription.',
          },
        };
      }

      const { error: txError } = await paymentDatabase.from('pending_transactions').insert({
        user_id: request.userId,
        plan_id: request.planId,
        lakipay_transaction_id: paypalSubscription.subscriptionId,
        reference: paypalSubscription.subscriptionId,
        amount: amount,
        currency: (request.currency || 'USD').toUpperCase(),
        billing_cycle: request.billingCycle,
        status: 'pending',
        metadata: {
          payment_gateway: 'paypal',
          paypal_subscription_id: paypalSubscription.subscriptionId,
          plan_name: plan.name,
          billing_cycle: request.billingCycle,
        },
        created_at: new Date().toISOString(),
      });

      if (txError) {
        console.error('Failed to store pending PayPal transaction:', txError);
      }

      return {
        success: true,
        data: {
          sessionUrl: paypalSubscription.approvalUrl || '',
          transactionId: paypalSubscription.subscriptionId,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      };
    }

    const reference = generateSubscriptionReference(request.userId, request.planId);
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

    const { error: txError } = await paymentDatabase.from('pending_transactions').insert({
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
    const { data: pending } = await paymentDatabase
      .from('pending_transactions')
      .select('*')
      .or(
        `lakipay_transaction_id.eq.${request.transactionId},reference.eq.${request.transactionId}`
      )
      .maybeSingle();

    const gateway = request.gateway || pending?.metadata?.payment_gateway || 'lakipay';

    if (gateway === 'paypal') {
      const paypalSubscription = await getPayPalSubscription(request.transactionId);

      if (paypalSubscription.status !== 'ACTIVE') {
        return {
          success: false,
          status: 'FAILED',
          message: `PayPal subscription status: ${paypalSubscription.status || 'UNKNOWN'}`,
        };
      }

      const { data: plan } = await paymentDatabase
        .from('pricing_plans')
        .select('tier, name, price_monthly, price_yearly')
        .eq('id', request.planId)
        .single();

      const billingCycle = pending?.billing_cycle || 'monthly';
      const now = new Date();
      const periodEnd = new Date(
        now.getTime() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
      );

      const { data: subscription, error: subError } = await paymentDatabase
        .from('user_subscriptions')
        .upsert(
          {
            user_id: request.userId,
            plan_id: request.planId,
            lakipay_transaction_id: request.transactionId,
            paypal_subscription_id: request.transactionId,
            status: 'active',
            billing_cycle: billingCycle,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            cancel_at_period_end: false,
            updated_at: now.toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select('id')
        .single();

      if (subError) {
        console.error('Failed to create PayPal subscription:', subError);
        return {
          success: false,
          status: 'ERROR',
          message: 'Failed to activate subscription',
        };
      }

      const { error: profileError } = await paymentDatabase
        .from('profiles')
        .update({
          subscription_tier: plan?.tier || 'pro',
          updated_at: now.toISOString(),
        })
        .eq('id', request.userId);

      if (profileError) {
        console.error('Failed to update PayPal profile tier:', profileError);
      }

      const { error: paymentError } = await paymentDatabase.from('payment_history').insert({
        user_id: request.userId,
        subscription_id: subscription?.id,
        lakipay_transaction_id: request.transactionId,
        amount:
          billingCycle === 'yearly'
            ? Number(plan?.price_yearly || 0)
            : Number(plan?.price_monthly || 0),
        currency: 'usd',
        status: 'succeeded',
        description: `PayPal subscription payment for ${plan?.tier || 'plan'}`,
        metadata: {
          payment_gateway: 'paypal',
          paypal_subscription_id: request.transactionId,
          plan_id: request.planId,
          billing_cycle: billingCycle,
        },
        created_at: now.toISOString(),
      });

      if (paymentError) {
        console.error('Failed to log PayPal payment:', paymentError);
      }

      await paymentDatabase
        .from('pending_transactions')
        .update({ status: 'completed', updated_at: now.toISOString() })
        .eq('lakipay_transaction_id', request.transactionId);

      return {
        success: true,
        status: 'COMPLETED',
        message: 'PayPal payment verified and subscription activated',
        data: {
          transactionId: request.transactionId,
          userId: request.userId,
          planId: request.planId,
          amount:
            billingCycle === 'yearly'
              ? Number(plan?.price_yearly || 0)
              : Number(plan?.price_monthly || 0),
          currency: 'USD',
          paymentMethod: 'ALL' as PaymentMethod,
          completedAt: now.toISOString(),
        },
      };
    }

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

    const { data: plan } = await paymentDatabase
      .from('pricing_plans')
      .select('tier')
      .eq('id', request.planId)
      .single();

    const billingCycle = pending?.billing_cycle || 'monthly';
    const now = new Date();
    const periodEnd = new Date(
      now.getTime() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
    );

    const { data: subscription, error: subError } = await paymentDatabase
      .from('user_subscriptions')
      .upsert(
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
      )
      .select('id')
      .single();

    if (subError) {
      console.error('Failed to create subscription:', subError);
      return {
        success: false,
        status: 'ERROR',
        message: 'Failed to activate subscription',
      };
    }

    const { error: profileError } = await paymentDatabase
      .from('profiles')
      .update({
        subscription_tier: plan?.tier || 'pro',
        updated_at: now.toISOString(),
      })
      .eq('id', request.userId);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
    }

    const { error: paymentError } = await paymentDatabase.from('payment_history').insert({
      user_id: request.userId,
      subscription_id: subscription?.id,
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

    const { error: markError } = await paymentDatabase
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

export async function cancelSubscription(userId: string, reason = 'Canceled by customer') {
  const { data: subscription, error: subscriptionError } = await paymentDatabase
    .from('user_subscriptions')
    .select('id, plan_id, paypal_subscription_id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (subscriptionError) throw subscriptionError;
  if (!subscription) throw new Error('No active subscription found.');
  if (!subscription.paypal_subscription_id) {
    throw new Error('This subscription cannot be canceled through PayPal.');
  }

  await cancelPayPalSubscription(subscription.paypal_subscription_id, reason);
  const now = new Date().toISOString();

  const { error: updateError } = await paymentDatabase
    .from('user_subscriptions')
    .update({ status: 'canceled', cancel_at_period_end: true, updated_at: now })
    .eq('id', subscription.id);
  if (updateError) throw updateError;

  const { error: profileError } = await paymentDatabase
    .from('profiles')
    .update({ subscription_tier: 'free', updated_at: now })
    .eq('id', userId);
  if (profileError) throw profileError;

  return { success: true, message: 'Recurring PayPal payments canceled.' };
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
    const { data: pending } = await paymentDatabase
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
      const { error } = await paymentDatabase
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
      await paymentDatabase.from('payment_history').insert({
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
