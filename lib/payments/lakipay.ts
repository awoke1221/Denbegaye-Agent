/**
 * LakiPay Payment Gateway Integration
 * Advanced implementation for Ethiopian payment processing
 * Supports recurring billing and multiple payment methods
 */

import crypto from 'crypto';

// LakiPay API Configuration
const LAKIPAY_API_BASE = 'https://api.lakipay.co/api/v2';
const LAKIPAY_API_KEY = process.env.LAKIPAY_API_KEY; // Format: PUBLICKEY:SECRETKEY
const LAKIPAY_WEBHOOK_SECRET = process.env.LAKIPAY_WEBHOOK_SECRET;

// Supported payment methods
export type PaymentMethod = 'TELEBIRR' | 'MPESA' | 'CBE' | 'AWASH' | 'KACHA' | 'CARD' | 'ALL';
export type Currency = 'ETB' | 'USD';
export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

// Type definitions
export interface LakiPayCheckoutRequest {
  amount: number;
  currency: Currency;
  reference: string; // Unique order/subscription ID
  description?: string;
  customer_email?: string;
  customer_name?: string;
  supported_mediums?: PaymentMethod[];
  callback_url?: string;
  redirects?: {
    success: string;
    failed: string;
  };
  metadata?: Record<string, any>;
}

export interface LakiPayCheckoutResponse {
  success: boolean;
  data?: {
    payment_url: string;
    lakipay_transaction_id: string;
    expires_at?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface LakiPayTransaction {
  lakipay_transaction_id: string;
  status: TransactionStatus;
  amount: number;
  currency: Currency;
  reference: string;
  payment_method?: PaymentMethod;
  created_at?: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface LakiPayWebhookPayload {
  event: string;
  data: {
    lakipay_transaction_id: string;
    status: TransactionStatus;
    amount: number;
    currency: Currency;
    reference: string;
    payment_method: PaymentMethod;
    provider_id?: string;
    completed_at?: string;
    metadata?: Record<string, any>;
  };
  timestamp: string;
  signature: string;
}

/**
 * Create a hosted checkout session with LakiPay
 */
export async function createCheckoutSession(
  request: LakiPayCheckoutRequest
): Promise<LakiPayCheckoutResponse> {
  try {
    if (!LAKIPAY_API_KEY) {
      throw new Error('LAKIPAY_API_KEY is not configured');
    }

    // Set default payment methods if not specified
    const supported_mediums = request.supported_mediums || [
      'TELEBIRR',
      'MPESA',
      'CBE',
      'AWASH',
      'KACHA',
      'CARD',
    ];

    const payload = {
      amount: request.amount,
      currency: request.currency,
      reference: request.reference,
      description: request.description || `Payment for subscription`,
      customer_email: request.customer_email,
      customer_name: request.customer_name,
      supported_mediums,
      callback_url: request.callback_url,
      redirects: request.redirects,
      metadata: request.metadata || {},
    };

    const response = await fetch(`${LAKIPAY_API_BASE}/payment/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': LAKIPAY_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('LakiPay checkout error:', error);
      return {
        success: false,
        error: {
          code: 'CHECKOUT_ERROR',
          message: error.message || 'Failed to create checkout session',
        },
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        payment_url: data.data?.payment_url,
        lakipay_transaction_id: data.data?.lakipay_transaction_id,
        expires_at: data.data?.expires_at,
      },
    };
  } catch (error) {
    console.error('LakiPay checkout exception:', error);
    return {
      success: false,
      error: {
        code: 'EXCEPTION',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Get transaction status from LakiPay
 */
export async function getTransactionStatus(
  transactionId: string
): Promise<LakiPayTransaction | null> {
  try {
    if (!LAKIPAY_API_KEY) {
      throw new Error('LAKIPAY_API_KEY is not configured');
    }

    const response = await fetch(`${LAKIPAY_API_BASE}/payment/transaction/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': LAKIPAY_API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`Transaction not found: ${transactionId}`);
      return null;
    }

    const data = await response.json();

    return {
      lakipay_transaction_id: data.data?.lakipay_transaction_id,
      status: data.data?.status,
      amount: data.data?.amount,
      currency: data.data?.currency,
      reference: data.data?.reference,
      payment_method: data.data?.payment_method,
      created_at: data.data?.created_at,
      completed_at: data.data?.completed_at,
      metadata: data.data?.metadata,
    };
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    return null;
  }
}

/**
 * Verify webhook signature from LakiPay
 * Uses HMAC-SHA256 for signature verification
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  try {
    if (!LAKIPAY_WEBHOOK_SECRET) {
      console.warn('LAKIPAY_WEBHOOK_SECRET is not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', LAKIPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Process LakiPay webhook event
 */
export function processWebhookEvent(webhook: LakiPayWebhookPayload) {
  return {
    transactionId: webhook.data.lakipay_transaction_id,
    status: webhook.data.status,
    reference: webhook.data.reference,
    amount: webhook.data.amount,
    currency: webhook.data.currency,
    paymentMethod: webhook.data.payment_method,
    completedAt: webhook.data.completed_at,
    metadata: webhook.data.metadata,
  };
}

/**
 * Generate subscription reference ID
 */
export function generateSubscriptionReference(userId: string, planId: string): string {
  return `SUB_${userId}_${planId}_${Date.now()}`;
}

/**
 * Generate payment reference ID
 */
export function generatePaymentReference(userId: string, type: string): string {
  return `PAY_${type}_${userId}_${Date.now()}`;
}

/**
 * Format currency amount for LakiPay API
 */
export function formatAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}
