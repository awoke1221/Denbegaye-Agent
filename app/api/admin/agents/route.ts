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

// GET /api/admin/agents - List all agents
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
      const backendResponse = await fetch(`${backendUrl}/api/admin/agents?${url.searchParams}`, {
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
      .from('user_agents')
      .select('*, profiles:user_id(id, email, full_name)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to match component expectations
    const agents = (data || []).map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description || '',
      status: agent.status || 'inactive',
      owner: {
        id: agent.profiles?.id || '',
        email: agent.profiles?.email || '',
        full_name: agent.profiles?.full_name || '',
      },
      stats: {
        executions_count: 0, // Would need separate query
        success_rate: 0,
        avg_execution_time: 0,
        last_execution: agent.updated_at,
      },
      created_at: agent.created_at,
      updated_at: agent.updated_at,
    }));

    return NextResponse.json({
      agents,
      pagination: {
        page: 1,
        limit: 50,
        total: agents.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

// POST /api/admin/agents - Create or manage agent
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
      const backendResponse = await fetch(`${backendUrl}/api/admin/agents`, {
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
    console.error('Error managing agent:', error);
    return NextResponse.json({ error: 'Failed to manage agent' }, { status: 500 });
  }
}
