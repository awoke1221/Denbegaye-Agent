import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { DataSource, DataRecord, DatabaseResponse } from '@/types/database';

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
 * GET /api/data-sources
 * List all data sources for current user
 * Returns: Array of DataSource objects with count
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
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50'), 1), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    // Fetch data sources
    const { data, error, count } = await supabase
      .from('data_sources')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Data source fetch error:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch data sources',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: data || [],
        count: count || 0,
      } as DatabaseResponse<DataSource[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching data sources:', error);
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
 * POST /api/data-sources
 * Create a new data source
 * Body: {
 *   name: string (required),
 *   type: 'email_list' | 'phone_list' | 'contact_list' | 'csv_upload' | 'api_integration' (required),
 *   config: Record<string, any> (required),
 *   record_count?: number
 * }
 * Returns: Created DataSource object
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
    const { name, type, config, record_count = 0 } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const validTypes = [
      'email_list',
      'phone_list',
      'contact_list',
      'csv_upload',
      'api_integration',
    ];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: `type must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Validation error', message: 'config is required and must be an object' },
        { status: 400 }
      );
    }

    // Create data source
    const { data, error } = await supabase
      .from('data_sources')
      .insert({
        user_id: user.id,
        name: name.trim(),
        type,
        config,
        record_count,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Data source creation error:', error);
      return NextResponse.json(
        {
          error: 'Failed to create data source',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data,
      } as DatabaseResponse<DataSource>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating data source:', error);
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
 * GET /api/data-sources/[id]/records
 * Get records from a data source
 */
export async function getDataRecords(
  dataSourceId: string,
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ data: DataRecord[] | null; count: number; error: any }> {
  // First verify user owns this data source
  const { data: dataSource, error: dsError } = await supabase
    .from('data_sources')
    .select('id')
    .eq('id', dataSourceId)
    .eq('user_id', userId)
    .single();

  if (dsError || !dataSource) {
    return { data: null, count: 0, error: 'Data source not found or access denied' };
  }

  // Fetch records
  const { data, error, count } = await supabase
    .from('data_records')
    .select('*', { count: 'exact' })
    .eq('data_source_id', dataSourceId)
    .range(offset, offset + limit - 1);

  return { data: data || [], count: count || 0, error };
}

/**
 * POST /api/data-sources/[id]/records
 * Add records to a data source
 */
export async function addDataRecord(
  dataSourceId: string,
  userId: string,
  recordData: Record<string, any>,
  externalId?: string
): Promise<DataRecord | null> {
  // Verify user owns this data source
  const { data: dataSource } = await supabase
    .from('data_sources')
    .select('id, record_count')
    .eq('id', dataSourceId)
    .eq('user_id', userId)
    .single();

  if (!dataSource) {
    return null;
  }

  // Create record
  const { data, error } = await supabase
    .from('data_records')
    .insert({
      data_source_id: dataSourceId,
      external_id: externalId || null,
      data: recordData,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Data record creation error:', error);
    return null;
  }

  // Update record count
  await supabase
    .from('data_sources')
    .update({
      record_count: (dataSource.record_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dataSourceId);

  return data;
}

/**
 * Helper to update data source
 */
export async function updateDataSource(
  dataSourceId: string,
  userId: string,
  updates: Partial<DataSource>
): Promise<DataSource | null> {
  const { data, error } = await supabase
    .from('data_sources')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dataSourceId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Data source update error:', error);
    return null;
  }

  return data;
}
