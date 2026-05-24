import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { createPaymentSession } from '@/lib/payments/paymentService';
import { createCheckoutSession } from '@/lib/payments/lakipay';

// Temporary dev-only endpoint to exercise the payment flow using service role
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'No supabaseAdmin configured' }, { status: 500 });
    }

    // Pick a sample plan (prefer active)
    let { data: plan } = await supabaseAdmin
      .from('pricing_plans')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!plan) {
      const { data: anyPlan } = await supabaseAdmin
        .from('pricing_plans')
        .select('*')
        .limit(1)
        .single();
      plan = anyPlan;
    }

    if (!plan) {
      return NextResponse.json({ error: 'No active pricing plan found' }, { status: 404 });
    }

    // Pick a sample user (first profile)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id,email,full_name')
      .limit(1)
      .single();
    if (!profile) {
      return NextResponse.json({ error: 'No user profile found' }, { status: 404 });
    }

    const billingCycle = 'monthly';
    const amount = plan.price_monthly;

    console.log('Test checkout using plan:', JSON.stringify(plan));
    console.log('Test checkout using profile:', JSON.stringify(profile));

    // Create a direct checkout session via LakiPay for testing (bypass createPaymentSession DB lookup)
    const checkout = await createCheckoutSession({
      amount: amount,
      currency: 'ETB',
      reference: `TEST_${profile.id}_${plan.id}_${Date.now()}`,
      description: `${plan.name} - ${billingCycle} test checkout`,
      customer_email: profile.email,
      customer_name: profile.full_name || profile.email,
      supported_mediums: ['TELEBIRR', 'MPESA', 'CBE', 'AWASH', 'KACHA', 'CARD'],
      callback_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/payments/lakipay/webhook`,
      redirects: {
        success: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/payment-result?success=true`,
        failed: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/payment-result?failed=true`,
      },
      metadata: { test: true, userId: profile.id, planId: plan.id },
    });

    return NextResponse.json({ checkout }, { status: checkout.success ? 200 : 500 });
  } catch (error) {
    console.error('Test checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
