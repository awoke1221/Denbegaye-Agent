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

// GET /api/admin/system/api-keys - Get API keys
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
      const backendResponse = await fetch(`${backendUrl}/api/admin/system/api-keys`, {
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
      console.warn('Backend not available:', backendError);
    }

    // Local API keys (mock data since we don't store real API keys)
    return NextResponse.json({
      apiKeys: [
        {
          id: 'supabase',
          name: 'Supabase',
          key_preview: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'sb-****' : 'Not configured',
          created_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
          permissions: ['read', 'write'],
          status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'active' : 'inactive',
        },
        {
          id: 'gemini',
          name: 'Google Gemini',
          key_preview: process.env.NEXT_PUBLIC_GEMINI_API_KEY ? '****' : 'Not configured',
          created_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
          permissions: ['ai'],
          status: process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'active' : 'inactive',
        },
        {
          id: 'openai',
          name: 'OpenAI',
          key_preview: process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'sk-****' : 'Not configured',
          created_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
          permissions: ['ai'],
          status: process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'active' : 'inactive',
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}
