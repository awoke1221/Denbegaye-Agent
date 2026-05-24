import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import cron from 'node-cron';

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

// GET /api/scheduler/jobs - List all scheduled jobs
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

    // Get jobs from Supabase
    const { data, error } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      jobs: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching scheduled jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled jobs' }, { status: 500 });
  }
}

// POST /api/scheduler/jobs - Create a new scheduled job
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
    const { name, agent_id, cron_expression, config, is_active } = body;

    if (!name || !agent_id || !cron_expression) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate cron expression
    if (!cron.validate(cron_expression)) {
      return NextResponse.json({ error: 'Invalid cron expression' }, { status: 400 });
    }

    // Create job in Supabase
    const { data, error } = await supabase
      .from('scheduled_jobs')
      .insert({
        user_id: user.id,
        name,
        agent_id,
        cron_expression,
        config: config || {},
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
    console.error('Error creating scheduled job:', error);
    return NextResponse.json({ error: 'Failed to create scheduled job' }, { status: 500 });
  }
}
