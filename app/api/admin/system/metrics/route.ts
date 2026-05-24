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

// GET /api/admin/system/metrics - Get system metrics
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
      const backendResponse = await fetch(`${backendUrl}/api/admin/system/metrics`, {
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
      console.warn('Backend not available, using local metrics:', backendError);
    }

    // Local metrics
    const [
      { count: totalUsers },
      { count: totalAgents },
      { count: totalExecutions },
      { count: successfulExecutions },
      { count: failedExecutions },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('user_agents').select('id', { count: 'exact', head: true }),
      supabase.from('agent_executions').select('id', { count: 'exact', head: true }),
      supabase
        .from('agent_executions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),
      supabase
        .from('agent_executions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed'),
    ]);

    const errorRate =
      (totalExecutions || 0) > 0 ? ((failedExecutions || 0) / (totalExecutions || 0)) * 100 : 0;

    return NextResponse.json({
      metrics: {
        database: {
          status: 'healthy',
          connections: 10, // Mock data
          queries_per_second: 50, // Mock data
          storage_used_gb: 2.5, // Mock data
          storage_total_gb: 100, // Mock data
          uptime: '7 days', // Mock data
        },
        api: {
          status: 'healthy',
          requests_per_minute: 120, // Mock data
          avg_response_time_ms: 150, // Mock data
          error_rate_percent: errorRate,
          uptime: '7 days', // Mock data
        },
        storage: {
          status: 'healthy',
          files_count: totalAgents || 0,
          total_size_gb: 1.2, // Mock data
          backup_status: 'completed', // Mock data
        },
        server: {
          status: 'healthy',
          cpu_usage_percent: 25, // Mock data
          memory_usage_percent: 40, // Mock data
          disk_usage_percent: 30, // Mock data
          network_in_mbps: 50, // Mock data
          network_out_mbps: 30, // Mock data
        },
        queue: {
          queued: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          dead_letter: 0,
          delayed_retry: 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch system metrics' }, { status: 500 });
  }
}
