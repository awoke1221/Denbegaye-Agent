import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

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

// GET /api/webhooks/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('webhookTriggers')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json({ error: 'Failed to fetch webhook' }, { status: 500 });
  }
}

// PUT /api/webhooks/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const { data, error } = await supabase
      .from('webhookTriggers')
      .update({
        name,
        url,
        event_type,
        agent_id,
        headers: headers || {},
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
  }
}

// DELETE /api/webhooks/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { error } = await supabase
      .from('webhookTriggers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }
}

// POST /api/webhooks/[id] - Trigger webhook
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get webhook
    const { data: webhook, error: webhookError } = await supabase
      .from('webhookTriggers')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (webhookError || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const body = await request.json();

    // Log the event
    const { data: event, error: eventError } = await supabase
      .from('webhookEvents')
      .insert({
        webhook_id: id,
        user_id: user.id,
        payload: body,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    // Try to send webhook
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers,
        },
        body: JSON.stringify(body),
      });

      await supabase
        .from('webhookEvents')
        .update({
          status: response.ok ? 'success' : 'failed',
          response_status: response.status,
        })
        .eq('id', event.id);
    } catch (error) {
      await supabase
        .from('webhookEvents')
        .update({
          status: 'failed',
          error: (error as Error).message,
        })
        .eq('id', event.id);
    }

    return NextResponse.json({ message: 'Webhook triggered', event_id: event.id });
  } catch (error) {
    console.error('Error triggering webhook:', error);
    return NextResponse.json({ error: 'Failed to trigger webhook' }, { status: 500 });
  }
}
