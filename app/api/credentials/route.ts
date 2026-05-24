import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabase } from '@/lib/supabaseClient';

async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.substring(7);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: 'Invalid token', status: 401 };
  }

  return { user, error: null };
}

// GET /api/credentials - Get all credentials for the current user
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyToken(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const userId = auth.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('id, provider, label, is_active, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase credentials fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      credentials: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}

// POST /api/credentials - Create a new credential
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const userId = auth.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, label, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and apiKey are required' }, { status: 400 });
    }

    const encryptedKey = Buffer.from(apiKey).toString('base64');
    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: userId,
        provider,
        label: label || provider,
        encrypted_key: encryptedKey,
        key_hash: keyHash,
        is_active: true,
      })
      .select();

    if (error) {
      console.error('Supabase credentials insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      credential: {
        id: data?.[0]?.id,
        provider,
        label,
      },
    });
  } catch (error) {
    console.error('Error creating credential:', error);
    return NextResponse.json({ error: 'Failed to create credential' }, { status: 500 });
  }
}

// DELETE /api/credentials/:id - Delete a credential
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyToken(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const userId = auth.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credentialId = request.nextUrl.searchParams.get('id');

    if (!credentialId) {
      return NextResponse.json({ error: 'Credential ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', credentialId)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase credential delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return NextResponse.json({ error: 'Failed to delete credential' }, { status: 500 });
  }
}
