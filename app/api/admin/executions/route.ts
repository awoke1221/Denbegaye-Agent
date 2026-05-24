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

// GET /api/admin/executions - List all executions
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
        `${backendUrl}/api/admin/executions?${url.searchParams}`,
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

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status')?.split(',') || [];
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = supabase
      .from('agent_executions')
      .select(
        `
        *,
        user_agents:agent_id(name),
        profiles:user_id(id, email, full_name)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status.length > 0) {
      query = query.in('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to match component expectations
    const executions = (data || []).map(execution => ({
      id: execution.id,
      agent_id: execution.agent_id,
      agent_name: execution.user_agents?.name || 'Unknown Agent',
      user: {
        id: execution.profiles?.id || '',
        email: execution.profiles?.email || '',
        full_name: execution.profiles?.full_name || '',
      },
      status: execution.status,
      started_at: execution.created_at,
      completed_at: execution.completed_at,
      duration: execution.duration_ms,
      progress: execution.status === 'completed' ? 100 : execution.status === 'running' ? 50 : 0,
      error_message: execution.error_message,
    }));

    return NextResponse.json({
      executions,
      count: executions.length,
    });
  } catch (error) {
    console.error('Error fetching executions:', error);
    return NextResponse.json({ error: 'Failed to fetch executions' }, { status: 500 });
  }
}
