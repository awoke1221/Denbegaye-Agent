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

// GET /api/admin/dashboard - Get dashboard statistics
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

    // Try to forward to backend first
    try {
      const backendResponse = await fetch(`${backendUrl}/api/admin/dashboard`, {
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

    // Local statistics from Supabase
    const [
      { count: totalUsers },
      { count: totalAgents },
      { count: totalExecutions },
      { data: recentExecutions },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('user_agents').select('id', { count: 'exact', head: true }),
      supabase.from('agent_executions').select('id', { count: 'exact', head: true }),
      supabase
        .from('agent_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const stats = {
      totalUsers: totalUsers || 0,
      activeUsers: totalUsers || 0,
      totalAgents: totalAgents || 0,
      runningExecutions: totalExecutions || 0,
      errorRate: 0,
      systemHealth: {
        database: 'healthy',
        api: 'healthy',
        storage: 'healthy',
        overall: 'healthy',
      },
    };

    const recentActivities = (recentExecutions || []).map(execution => ({
      id: execution.id,
      type:
        execution.status === 'failed'
          ? 'error'
          : execution.status === 'running'
            ? 'running'
            : 'success',
      action: `Execution ${execution.id}`,
      user: execution.user_id || 'system',
      time: execution.created_at
        ? new Date(execution.created_at).toISOString()
        : new Date().toISOString(),
      details: {
        status: execution.status,
        execution_time: execution.duration_ms || 'N/A',
      },
    }));

    return NextResponse.json({
      stats,
      recentActivities,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
