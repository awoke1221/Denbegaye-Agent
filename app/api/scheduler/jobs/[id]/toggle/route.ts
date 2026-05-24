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

// POST /api/scheduler/jobs/[id]/toggle - Toggle job active status
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

    // Get current job
    const { data: job, error: getError } = await supabase
      .from('scheduled_jobs')
      .select('is_active')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (getError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Toggle the status
    const { data, error } = await supabase
      .from('scheduled_jobs')
      .update({
        is_active: !job.is_active,
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
    console.error('Error toggling scheduled job:', error);
    return NextResponse.json({ error: 'Failed to toggle scheduled job' }, { status: 500 });
  }
}
