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

// POST /api/admin/templates/bulk-update - Bulk update templates
export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin using server-side admin client when available
    const client = supabaseAdmin || supabase;
    if (!supabaseAdmin) {
      console.warn(
        'supabaseAdmin not configured; set SUPABASE_SERVICE_ROLE_KEY for reliable admin verification on server routes.'
      );
    }
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!profile || profile.role !== 'admin') {
      console.error('User is not admin:', profile?.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Forward request to backend
    const backendResponse = await fetch(`${backendUrl}/api/admin/templates/bulk-update`, {
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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in template bulk update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
