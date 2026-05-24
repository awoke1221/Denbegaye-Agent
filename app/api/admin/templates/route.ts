import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

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

// GET /api/admin/templates - Get all templates
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);

    const user = await verifyAdmin(token);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Forward request to backend
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const backendResponse = await fetch(`${backendUrl}/api/admin/templates?${searchParams}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in templates API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);

    const user = await verifyAdmin(token);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Basic input validation to prevent malformed templates (lightweight)
    const errors: string[] = [];
    if (!body || typeof body !== 'object') errors.push('Body must be a JSON object');
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0)
      errors.push('Template name is required');
    const templateNodes = Array.isArray(body.config?.nodes)
      ? body.config.nodes
      : Array.isArray(body.nodes)
        ? body.nodes
        : null;
    const templateEdges = Array.isArray(body.config?.edges)
      ? body.config.edges
      : Array.isArray(body.edges)
        ? body.edges
        : null;

    if (!templateNodes || templateNodes.length === 0) {
      errors.push('Template must include at least one node');
    }
    if (templateEdges === null) {
      errors.push('Template edges must be an array');
    }
    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    // Forward request to backend
    const backendResponse = await fetch(`${backendUrl}/api/admin/templates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in templates API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
