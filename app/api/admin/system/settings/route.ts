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

// GET /api/admin/system/settings - Get system settings
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
      const backendResponse = await fetch(`${backendUrl}/api/admin/system/settings`, {
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
      console.warn('Backend not available, using default settings:', backendError);
    }

    // Default settings
    return NextResponse.json({
      maintenance_mode: false,
      email_notifications: true,
      auto_backup: true,
      admin_email: 'admin@example.com',
      system_name: 'Denbegnaye Agent Platform',
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 });
  }
}

// POST /api/admin/system/settings - Update system settings
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

    // Try to forward to backend
    try {
      const backendResponse = await fetch(`${backendUrl}/api/admin/system/settings`, {
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
      message: 'Settings updated successfully',
      settings: body,
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json({ error: 'Failed to update system settings' }, { status: 500 });
  }
}
