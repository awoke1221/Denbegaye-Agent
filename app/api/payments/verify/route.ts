import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { verifyPayment } from '@/lib/payments/paymentService';

/**
 * POST /api/payments/verify
 * Verify payment status and activate subscription
 * Used after user is redirected from LakiPay checkout
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get authentication token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // 2. Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // 3. Parse request body
    const { transactionId, planId, gateway } = await request.json();

    if (!transactionId || !planId) {
      return NextResponse.json({ error: 'Missing transactionId or planId' }, { status: 400 });
    }

    const paymentDatabase = supabaseAdmin || supabase;
    const { data: pendingTransaction, error: pendingError } = await paymentDatabase
      .from('pending_transactions')
      .select('*')
      .or(`lakipay_transaction_id.eq.${transactionId},reference.eq.${transactionId}`)
      .single();

    if (pendingError || !pendingTransaction) {
      return NextResponse.json({ error: 'Pending transaction not found' }, { status: 404 });
    }

    const actualTransactionId =
      pendingTransaction.lakipay_transaction_id === transactionId
        ? transactionId
        : pendingTransaction.lakipay_transaction_id;

    // 4. Verify payment
    const verificationResponse = await verifyPayment({
      transactionId: actualTransactionId,
      userId: user.id,
      planId,
      gateway: gateway || pendingTransaction?.metadata?.payment_gateway || 'lakipay',
    });

    if (!verificationResponse.success) {
      return NextResponse.json(
        {
          success: false,
          status: verificationResponse.status,
          message: verificationResponse.message,
        },
        { status: 400 }
      );
    }

    // 5. Return success response
    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated',
      data: verificationResponse.data,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/payments/verify
 * Check payment status by transaction ID
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Get authentication token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // 2. Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // 3. Get transactionId from query params
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transactionId query parameter' }, { status: 400 });
    }

    // 4. Get transaction status from database
    const { data: transaction, error } = await supabase
      .from('pending_transactions')
      .select('*')
      .or(`lakipay_transaction_id.eq.${transactionId},reference.eq.${transactionId}`)
      .eq('user_id', user.id)
      .single();

    if (error || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // 5. Return transaction status
    return NextResponse.json({
      success: true,
      data: {
        transactionId,
        status: transaction.status,
        planId: transaction.plan_id,
        amount: transaction.amount,
        currency: transaction.currency,
        billingCycle: transaction.billing_cycle,
        createdAt: transaction.created_at,
        expiresAt: transaction.expires_at,
      },
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
