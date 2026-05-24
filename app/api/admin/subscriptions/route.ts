import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { sendEmailNotification } from '@/lib/notifications/email';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Helper function to get auth token
async function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Helper function to verify user is admin
async function verifyAdmin(token: string) {
  // Use admin client if available for server-side verification
  const client = supabaseAdmin || supabase;

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser(token);
  if (authError || !user) {
    console.error('Auth error:', authError);
    return null;
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Profile query error:', profileError);
    return null;
  }

  if (!profile || profile.role !== 'admin') {
    console.error('User is not admin:', profile?.role);
    return null;
  }

  return user;
}

// GET /api/admin/subscriptions - List all subscriptions
export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyAdmin(token);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Try to forward to backend
    try {
      const url = new URL(request.url);
      const backendResponse = await fetch(
        `${backendUrl}/api/admin/subscriptions?${url.searchParams}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.warn('Backend not available, using local data:', backendError);
    }

    const url = new URL(request.url);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10), 1), 100);
    const offset = (page - 1) * limit;
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status');

    let query = supabase
      .from('user_subscriptions')
      .select(
        `id, user_id, status, billing_cycle, current_period_end, cancel_at_period_end, created_at, updated_at, profiles(id, email, full_name), pricing_plans(id, name, tier, price_monthly, price_yearly, limits)`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('profiles.email', `%${search}%`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      subscriptions: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 1,
      },
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

// POST /api/admin/subscriptions - Create or update subscription
export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyAdmin(token);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, subscription_tier } = body;

    if (!user_id || !subscription_tier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Try to forward to backend
    try {
      const backendResponse = await fetch(`${backendUrl}/api/admin/subscriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.warn('Backend not available, updating locally:', backendError);
    }

    // Update subscription tier in Supabase
    const { data, error } = await supabase
      .from('profiles')
      .update({
        subscription_tier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json({ error: 'Failed to manage subscription' }, { status: 500 });
  }
}

// PATCH /api/admin/subscriptions - Manage subscription status and limits
export async function PATCH(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyAdmin(token);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { subscriptionId, action, status, limits, notifyUser = true } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Try backend first
    try {
      const backendResponse = await fetch(`${backendUrl}/api/admin/subscriptions`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.warn('Backend not available, updating locally:', backendError);
    }

    if (action === 'cancel') {
      const { error: cancelError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (cancelError) {
        return NextResponse.json({ error: cancelError.message }, { status: 500 });
      }

      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('user_id, pricing_plans(name), profiles(email, full_name)')
        .eq('id', subscriptionId)
        .single();

      let notificationSent = false;

      if (subscriptionError) {
        console.error('Failed to read subscription user data:', subscriptionError);
      } else if (notifyUser) {
        const maybeProfiles = subscriptionData?.profiles;
        const profile = Array.isArray(maybeProfiles) ? maybeProfiles[0] : maybeProfiles;
        const userEmail = profile?.email;
        if (userEmail) {
          const emailResult = await sendEmailNotification({
            to: userEmail,
            subject: 'Subscription canceled',
            text: `Hello ${profile?.full_name || 'Customer'},\n\nYour subscription has been canceled by the admin. If you have questions, please contact support.`,
            html: `<p>Hello ${profile?.full_name || 'Customer'},</p><p>Your subscription has been <strong>canceled</strong> by the administrator. If you have questions, please contact support.</p>`,
          });
          notificationSent = emailResult.success;
          if (!emailResult.success) {
            console.warn('Email notification failed:', emailResult.error);
          }
        }
      }

      return NextResponse.json({
        success: true,
        action: 'canceled',
        notificationSent,
      });
    }

    if (action === 'reactivate') {
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_id, pricing_plans(name), profiles(email, full_name)')
        .eq('id', subscriptionId)
        .single();

      if (subscriptionError || !subscriptionData) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
      }

      const { error: reactivateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (reactivateError) {
        return NextResponse.json({ error: reactivateError.message }, { status: 500 });
      }

      const { data: planData, error: planError } = await supabase
        .from('pricing_plans')
        .select('tier')
        .eq('id', subscriptionData.plan_id)
        .single();

      if (planError) {
        console.error('Failed to read plan tier:', planError);
      }

      const userUpdate = await supabase
        .from('profiles')
        .update({
          subscription_tier: planData?.tier || 'pro',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionData.user_id);

      if (userUpdate.error) {
        console.error('Failed to update profile tier on reactivate:', userUpdate.error);
      }

      let notificationSent = false;
      if (notifyUser) {
        const maybeProfiles = subscriptionData?.profiles;
        const profile = Array.isArray(maybeProfiles) ? maybeProfiles[0] : maybeProfiles;
        if (profile?.email) {
          const emailResult = await sendEmailNotification({
            to: profile.email,
            subject: 'Subscription reactivated',
            text: `Hello ${profile?.full_name || 'Customer'},\n\nYour subscription has been reactivated and is now active again. Thank you!`,
            html: `<p>Hello ${profile?.full_name || 'Customer'},</p><p>Your subscription has been <strong>reactivated</strong> and is now active again. Thank you!</p>`,
          });
          notificationSent = emailResult.success;
          if (!emailResult.success) {
            console.warn('Email notification failed:', emailResult.error);
          }
        }
      }

      return NextResponse.json({
        success: true,
        action: 'reactivated',
        notificationSent,
      });
    }

    if (action === 'update_limits') {
      if (!limits || typeof limits !== 'object') {
        return NextResponse.json({ error: 'Missing or invalid limits payload' }, { status: 400 });
      }

      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('plan_id')
        .eq('id', subscriptionId)
        .single();

      if (subscriptionError || !subscriptionData) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
      }

      const { error: planUpdateError } = await supabase
        .from('pricing_plans')
        .update({ limits })
        .eq('id', subscriptionData.plan_id);

      if (planUpdateError) {
        return NextResponse.json({ error: planUpdateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: 'limits_updated' });
    }

    if (status) {
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', subscriptionId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, action: 'status_updated' });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
