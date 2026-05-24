import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { AgentExecution, DatabaseResponse, QueryOptions } from '@/types/database';

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
 * GET /api/agents/[id]/executions
 * Fetch execution history for a specific agent
 * Query params:
 *   - limit: number (default: 50, max: 100)
 *   - offset: number (default: 0)
 *   - status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
 *   - sort: 'newest' | 'oldest' | 'duration' (default: 'newest')
 * Returns: Array of AgentExecution objects with count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    const agentId = (await params).id;

    // Validate agent_id format (UUID)
    if (
      !agentId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId)
    ) {
      return NextResponse.json(
        { error: 'Invalid agent ID', message: 'Agent ID must be a valid UUID' },
        { status: 400 }
      );
    }

    // Verify user owns this agent
    const { data: agent, error: agentError } = await supabase
      .from('user_agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        {
          error: 'Agent not found or access denied',
          message: 'You do not have access to this agent',
        },
        { status: 404 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50'), 1), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
    const status = url.searchParams.get('status');
    const sort = url.searchParams.get('sort') || 'newest';

    // Build query
    let query = supabase
      .from('agent_executions')
      .select('*', { count: 'exact' })
      .eq('agent_id', agentId)
      .eq('user_id', user.id);

    // Apply status filter if provided
    if (status && ['queued', 'running', 'completed', 'failed', 'cancelled'].includes(status)) {
      query = query.eq('status', status);
    }

    // Apply sorting
    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'duration') {
      query = query.order('execution_time_ms', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Execution fetch error:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch executions',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: data || [],
        count: count || 0,
      } as DatabaseResponse<AgentExecution[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching executions:', error);
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
 * POST /api/agents/[id]/executions
 * Execute an agent
 * Body: {
 *   input_data?: Record<string, any>,
 *   idempotency_key?: string (for deduplication)
 * }
 * Returns: AgentExecution object with execution started
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    const { id: agentId } = await params;

    // Validate agent_id format (UUID)
    if (
      !agentId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId)
    ) {
      return NextResponse.json(
        { error: 'Invalid agent ID', message: 'Agent ID must be a valid UUID' },
        { status: 400 }
      );
    }

    // Verify user owns this agent
    const { data: agent, error: agentError } = await supabase
      .from('user_agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        {
          error: 'Agent not found or access denied',
          message: 'You do not have access to this agent',
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { input_data, idempotency_key } = body;

    // Check if execution with same idempotency key already exists
    if (idempotency_key) {
      const { data: existingExecution } = await supabase
        .from('agent_executions')
        .select('*')
        .eq('idempotency_key', idempotency_key)
        .single();

      if (existingExecution) {
        return NextResponse.json(
          {
            data: existingExecution,
            message: 'Execution with this idempotency_key already exists',
          },
          { status: 200 }
        );
      }
    }

    // Create execution record
    const { data, error } = await supabase
      .from('agent_executions')
      .insert({
        agent_id: agentId,
        user_id: user.id,
        idempotency_key: idempotency_key || null,
        status: 'queued',
        input_data: input_data || {},
        metadata: {
          started_by: 'api',
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Execution creation error:', error);
      return NextResponse.json(
        {
          error: 'Failed to create execution',
          message: error.message,
        },
        { status: 500 }
      );
    }

    // TODO: Send execution to backend worker queue for processing
    // This should trigger the backend server at port 3001 to process the execution

    return NextResponse.json(
      {
        data,
      } as DatabaseResponse<AgentExecution>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating execution:', error);
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
 * GET /api/agents/[id]/executions/[executionId]
 * Fetch a specific execution
 */
export async function getExecution(
  agentId: string,
  executionId: string,
  userId: string
): Promise<AgentExecution | null> {
  const { data } = await supabase
    .from('agent_executions')
    .select('*')
    .eq('id', executionId)
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .single();

  return data || null;
}
