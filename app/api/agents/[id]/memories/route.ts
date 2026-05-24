import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { AgentMemory, DatabaseResponse } from '@/types/database';

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
 * GET /api/agents/[id]/memories
 * Fetch memory history for a specific agent
 * Query params:
 *   - limit: number (default: 50, max: 100)
 *   - offset: number (default: 0)
 *   - type: 'conversation' | 'fact' | 'procedure' | 'context'
 *   - search: string (search in content)
 *   - sort: 'newest' | 'oldest' | 'important' | 'accessed' (default: 'newest')
 * Returns: Array of AgentMemory objects with count
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
    const memoryType = url.searchParams.get('type');
    const search = url.searchParams.get('search');
    const sort = url.searchParams.get('sort') || 'newest';

    // Build query
    let query = supabase
      .from('agent_memories')
      .select('*', { count: 'exact' })
      .eq('agent_id', agentId)
      .eq('user_id', user.id);

    // Apply memory type filter if provided
    if (memoryType && ['conversation', 'fact', 'procedure', 'context'].includes(memoryType)) {
      query = query.eq('memory_type', memoryType);
    }

    // Apply sorting
    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'important') {
      query = query.order('importance_score', { ascending: false });
    } else if (sort === 'accessed') {
      query = query.order('last_accessed_at', { ascending: false, nullsFirst: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Memory fetch error:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch memories',
          message: error.message,
        },
        { status: 500 }
      );
    }

    // Filter by search text if provided (client-side to avoid issues with embedding search)
    let filteredData = data || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter((memory: AgentMemory) =>
        memory.content.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json(
      {
        data: filteredData,
        count: search ? filteredData.length : count || 0,
      } as DatabaseResponse<AgentMemory[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching memories:', error);
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
 * POST /api/agents/[id]/memories
 * Add a new memory to an agent
 * Body: {
 *   content: string (required),
 *   memory_type?: 'conversation' | 'fact' | 'procedure' | 'context' (default: 'conversation'),
 *   importance_score?: number (0-1, default: 0.5),
 *   metadata?: Record<string, any>
 * }
 * Returns: Created AgentMemory object
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

    const body = await request.json();
    const { content, memory_type = 'conversation', importance_score = 0.5, metadata = {} } = body;

    // Validate required fields
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'content is required and must be a non-empty string',
        },
        { status: 400 }
      );
    }

    // Validate memory_type
    const validMemoryTypes = ['conversation', 'fact', 'procedure', 'context'];
    if (!validMemoryTypes.includes(memory_type)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: `memory_type must be one of: ${validMemoryTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate importance_score
    if (importance_score < 0 || importance_score > 1) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'importance_score must be between 0 and 1',
        },
        { status: 400 }
      );
    }

    // Create memory record
    const { data, error } = await supabase
      .from('agent_memories')
      .insert({
        agent_id: agentId,
        user_id: user.id,
        content: content.trim(),
        memory_type,
        importance_score,
        metadata,
        access_count: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Memory creation error:', error);
      return NextResponse.json(
        {
          error: 'Failed to create memory',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data,
      } as DatabaseResponse<AgentMemory>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating memory:', error);
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
 * DELETE /api/agents/[id]/memories/[memoryId]
 * Delete a specific memory
 */
export async function deleteMemory(
  agentId: string,
  memoryId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('agent_memories')
      .delete()
      .eq('id', memoryId)
      .eq('agent_id', agentId)
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error deleting memory:', error);
    return false;
  }
}
