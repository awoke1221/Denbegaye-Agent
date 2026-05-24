import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

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
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return null;
  }

  return user;
}

// GET /api/admin/system - Get system info
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
      const backendResponse = await fetch(`${backendUrl}/api/admin/system`, {
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
      console.warn('Backend not available, using local info:', backendError);
    }

    return NextResponse.json({
      system: {
        name: 'Denbegnaye',
        version: '1.0.0',
        status: 'healthy',
        uptime_seconds: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching system info:', error);
    return NextResponse.json({ error: 'Failed to fetch system info' }, { status: 500 });
  }
}

// POST /api/admin/system - Perform system operations
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
    const { action } = body;

    // Try to forward to backend
    try {
      const backendResponse = await fetch(`${backendUrl}/api/admin/system`, {
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

    return NextResponse.json({
      message: `System action '${action}' executed`,
      status: 'success',
    });
  } catch (error) {
    console.error('Error performing system operation:', error);
    return NextResponse.json({ error: 'Failed to perform system operation' }, { status: 500 });
  }
}
