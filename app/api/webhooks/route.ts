import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import crypto from 'crypto';

// Helper function to get auth token
async function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Helper function to verify user
async function verifyUser(token: string) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  return user;
}

// GET /api/webhooks - List all webhooks
export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get webhooks from Supabase
    const { data, error } = await supabase
      .from('webhookTriggers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      webhooks: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

// POST /api/webhooks - Create a new webhook
export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { name, url, event_type, agent_id, headers, is_active } = body;

    if (!name || !url || !event_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('hex');

    // Create webhook in Supabase
    const { data, error } = await supabase
      .from('webhookTriggers')
      .insert({
        user_id: user.id,
        name,
        url,
        event_type,
        agent_id,
        headers: headers || {},
        secret,
        is_active: is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}
