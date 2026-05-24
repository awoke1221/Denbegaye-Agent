import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { PaymentHistory, DatabaseResponse } from '@/types/database';

/**
 * Helper function to get auth token from request
 */
async function getAuthToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Helper function to verify user token
 */
async function verifyUser(token: string): Promise<{ id: string; email: string } | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  return { id: user.id, email: user.email || '' };
}

/**
 * GET /api/billing/history
 * Fetch payment history for current user
 * Query params:
 *   - limit: number (default: 50, max: 100)
 *   - offset: number (default: 0)
 *   - status: 'succeeded' | 'failed' | 'pending' | 'canceled'
 *   - sort: 'newest' | 'oldest' (default: 'newest')
 * Returns: Array of PaymentHistory objects with count
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    const user = await verifyUser(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Token verification failed' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50'), 1), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
    const status = url.searchParams.get('status');
    const sort = url.searchParams.get('sort') || 'newest';

    // Build query
    let query = supabase
      .from('payment_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply status filter if provided
    if (status && ['succeeded', 'failed', 'pending', 'canceled'].includes(status)) {
      query = query.eq('status', status);
    }

    // Apply sorting
    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Payment history fetch error:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch payment history',
          message: error.message,
        },
        { status: 500 }
      );
    }

    // Calculate totals
    const allPayments = data || [];
    const succeededPayments = allPayments.filter((p: PaymentHistory) => p.status === 'succeeded');
    const totalSpent = succeededPayments.reduce(
      (sum: number, p: PaymentHistory) => sum + (p.amount || 0),
      0
    );

    return NextResponse.json(
      {
        data: allPayments,
        count: count || 0,
        summary: {
          totalSpent,
          totalTransactions: succeededPayments.length,
          currency: allPayments[0]?.currency || 'usd',
        },
      } as DatabaseResponse<PaymentHistory[]> & { summary?: any },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper to create a payment record
 */
export async function recordPayment(
  userId: string,
  subscriptionId: string,
  paymentData: {
    stripe_payment_intent_id: string;
    amount: number;
    currency?: string;
    status: 'succeeded' | 'failed' | 'pending' | 'canceled';
    description?: string;
    metadata?: Record<string, any>;
  }
): Promise<PaymentHistory | null> {
  try {
    const { data, error } = await supabase
      .from('payment_history')
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        stripe_payment_intent_id: paymentData.stripe_payment_intent_id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'usd',
        status: paymentData.status,
        description: paymentData.description || null,
        metadata: paymentData.metadata || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Payment record creation error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error recording payment:', error);
    return null;
  }
}
