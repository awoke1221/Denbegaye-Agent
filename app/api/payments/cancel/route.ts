import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { cancelSubscription } from '@/lib/payments/paymentService';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.substring(7));
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const result = await cancelSubscription(user.id, body.reason || 'Canceled by customer');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to cancel subscription.' },
      { status: 400 }
    );
  }
}
