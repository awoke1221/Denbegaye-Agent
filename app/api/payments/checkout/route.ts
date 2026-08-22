import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { createPaymentSession } from '@/lib/payments/paymentService';

/**
 * POST /api/payments/checkout
 * Create a payment session for subscription
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
    const { planId, billingCycle, paymentMethod, paymentGateway } = await request.json();

    if (!planId || !billingCycle) {
      return NextResponse.json({ error: 'Missing planId or billingCycle' }, { status: 400 });
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle. Must be "monthly" or "yearly"' },
        { status: 400 }
      );
    }

    // 4. Get plan details
    const paymentDatabase = supabaseAdmin || supabase;
    const { data: plan, error: planError } = await paymentDatabase
      .from('pricing_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Pricing plan not found' }, { status: 404 });
    }

    // 5. Get amount based on billing cycle
    const amount = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

    if (amount <= 0) {
      return NextResponse.json({ error: 'Invalid plan price' }, { status: 400 });
    }

    const gateway = paymentGateway || (paymentMethod === 'PAYPAL' ? 'paypal' : 'paypal');

    const paymentMethods = paymentMethod ? [paymentMethod] : undefined;

    const sessionResponse = await createPaymentSession({
      userId: user.id,
      planId: planId,
      billingCycle: billingCycle,
      amount: amount,
      currency: gateway === 'paypal' ? 'USD' : 'ETB',
      paymentMethods: paymentMethods,
      gateway,
    });

    if (!sessionResponse.success) {
      return NextResponse.json(
        {
          error: sessionResponse.error?.message || 'Failed to create payment session',
          code: sessionResponse.error?.code,
        },
        { status: 500 }
      );
    }

    // 7. Return checkout URL
    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: sessionResponse.data?.sessionUrl,
        transactionId: sessionResponse.data?.transactionId,
        expiresAt: sessionResponse.data?.expiresAt,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
