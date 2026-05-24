import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';

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

// GET /api/admin/users - List all users
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
      const backendResponse = await fetch(`${backendUrl}/api/admin/users?${url.searchParams}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.warn('Backend not available, using local data:', backendError);
    }

    // Local data from Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at, updated_at, subscription_tier')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get counts separately
    const userIds = (data || []).map(user => user.id);
    const [agentsCount, executionsCount] = await Promise.all([
      supabase
        .from('user_agents')
        .select('id', { count: 'exact', head: true })
        .in('user_id', userIds),
      supabase
        .from('agent_executions')
        .select('id', { count: 'exact', head: true })
        .in('user_id', userIds),
    ]);

    // Transform data to match component expectations
    const users = (data || []).map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name || '',
      avatar_url: null,
      role: user.role || 'user',
      created_at: user.created_at,
      updated_at: user.updated_at,
      stats: {
        agents_count: 0, // Would need per-user count
        executions_count: 0, // Would need per-user count
        subscription: user.subscription_tier || 'free',
      },
    }));

    return NextResponse.json({
      users,
      pagination: {
        page: 1,
        limit: 50,
        total: users.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/admin/users - Create or update user
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

    // Try to forward to backend
    try {
      const body = await request.json();
      const backendResponse = await fetch(`${backendUrl}/api/admin/users`, {
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
      console.warn('Backend not available:', backendError);
    }

    return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
  } catch (error) {
    console.error('Error managing user:', error);
    return NextResponse.json({ error: 'Failed to manage user' }, { status: 500 });
  }
}

// PATCH /api/admin/users - Update user role
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
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    // Try to forward to backend
    try {
      const backendResponse = await fetch(`${backendUrl}/api/admin/users`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role }),
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.warn('Backend not available, using local update:', backendError);
    }

    // Local update
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
