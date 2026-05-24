import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { Workflow, DatabaseResponse } from '@/types/database';

/**
 * Helper function to get auth token from request
 */
async function getAuthToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Helper function to verify user token
 */
async function verifyUser(token: string): Promise<{ id: string; email: string } | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  return { id: user.id, email: user.email || '' };
}

/**
 * GET /api/workflows
 * List all workflows for the current user
 * Query params:
 *   - agent_id: string (filter by agent)
 *   - limit: number (default: 50, max: 100)
 *   - offset: number (default: 0)
 *   - sort: 'newest' | 'oldest' | 'name' (default: 'newest')
 * Returns: Array of Workflow objects with count
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    const user = await verifyUser(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Token verification failed' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const agentId = url.searchParams.get('agent_id');
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50'), 1), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
    const sort = url.searchParams.get('sort') || 'newest';

    // Build query
    let query = supabase.from('workflows').select('*', { count: 'exact' }).eq('user_id', user.id);

    // Filter by agent if provided
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    // Apply sorting
    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'name') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Workflow fetch error:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch workflows',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: data || [],
        count: count || 0,
      } as DatabaseResponse<Workflow[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows
 * Create a new workflow
 * Body: {
 *   name: string (required),
 *   description?: string,
 *   agent_id?: string,
 *   definition: Record<string, any> (required),
 *   tags?: string[],
 *   is_active?: boolean (default: true)
 * }
 * Returns: Created Workflow object
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    const user = await verifyUser(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Token verification failed' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, agent_id, definition, tags = [], is_active = true } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!definition || typeof definition !== 'object') {
      return NextResponse.json(
        { error: 'Validation error', message: 'definition is required and must be an object' },
        { status: 400 }
      );
    }

    // If agent_id provided, verify user owns it
    if (agent_id) {
      const { data: agent, error: agentError } = await supabase
        .from('user_agents')
        .select('id')
        .eq('id', agent_id)
        .eq('user_id', user.id)
        .single();

      if (agentError || !agent) {
        return NextResponse.json(
          {
            error: 'Agent not found',
            message: 'The specified agent does not exist or is not accessible',
          },
          { status: 404 }
        );
      }
    }

    // Create workflow
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        user_id: user.id,
        agent_id: agent_id || null,
        name: name.trim(),
        description: description || null,
        definition,
        tags: tags.filter((t: any) => typeof t === 'string'),
        is_active,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Workflow creation error:', error);
      return NextResponse.json(
        {
          error: 'Failed to create workflow',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data,
      } as DatabaseResponse<Workflow>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating workflow:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflows/[id]
 * Get a specific workflow
 */
export async function getWorkflow(workflowId: string, userId: string): Promise<Workflow | null> {
  const { data } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .eq('user_id', userId)
    .single();

  return data || null;
}

/**
 * PUT/PATCH helper for updating workflow
 */
export async function updateWorkflow(
  workflowId: string,
  userId: string,
  updates: Partial<Workflow>
): Promise<Workflow | null> {
  const { data, error } = await supabase
    .from('workflows')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workflowId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Workflow update error:', error);
    return null;
  }

  return data;
}

/**
 * DELETE helper for deleting workflow
 */
export async function deleteWorkflow(workflowId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', workflowId)
    .eq('user_id', userId);

  return !error;
}
