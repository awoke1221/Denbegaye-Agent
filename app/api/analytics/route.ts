import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { UsageAnalytics, PerformanceMetric, DatabaseResponse } from '@/types/database';

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

export interface AnalyticsEvent {
  event_type: string;
  count: number;
  last_event: string;
}

export interface AnalyticsSummary {
  total_events: number;
  unique_event_types: number;
  events_by_type: AnalyticsEvent[];
  date_range: {
    start: string;
    end: string;
  };
}

/**
 * GET /api/analytics
 * Fetch user analytics data
 * Query params:
 *   - days: number (default: 7, max: 90) - days of history to fetch
 *   - event_type: string (optional) - filter by event type
 *   - limit: number (default: 50, max: 100)
 *   - offset: number (default: 0)
 * Returns: AnalyticsSummary with event details
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
    const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '7'), 1), 90);
    const eventType = url.searchParams.get('event_type');
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50'), 1), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    let query = supabase
      .from('usage_analytics')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Filter by event type if provided
    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    // Order by created_at
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Analytics fetch error:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch analytics',
          message: error.message,
        },
        { status: 500 }
      );
    }

    // Aggregate events by type
    const eventTypeMap = new Map<string, { count: number; last_event: string }>();
    (data || []).forEach((event: UsageAnalytics) => {
      const type = event.event_type;
      if (!eventTypeMap.has(type)) {
        eventTypeMap.set(type, { count: 0, last_event: event.created_at || '' });
      }
      const existing = eventTypeMap.get(type)!;
      existing.count++;
      if (new Date(event.created_at || 0) > new Date(existing.last_event)) {
        existing.last_event = event.created_at || '';
      }
    });

    const eventsByType: AnalyticsEvent[] = Array.from(eventTypeMap.entries()).map(
      ([type, data]) => ({
        event_type: type,
        ...data,
      })
    );

    const summary: AnalyticsSummary = {
      total_events: count || 0,
      unique_event_types: eventsByType.length,
      events_by_type: eventsByType,
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };

    return NextResponse.json(
      {
        data: summary,
        raw_events: data || [],
      } as any,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching analytics:', error);
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
 * Helper to track an event
 */
export async function trackEvent(
  userId: string,
  eventType: string,
  eventData: Record<string, any> = {},
  sessionId?: string
): Promise<void> {
  try {
    await supabase.from('usage_analytics').insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
      session_id: sessionId || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    // Non-critical error - don't throw
  }
}

/**
 * Helper to record performance metric
 */
export async function recordMetric(
  userId: string,
  agentId: string | undefined,
  metricType: 'execution_time' | 'token_usage' | 'api_latency' | 'error_rate',
  value: number,
  unit?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('performance_metrics').insert({
      user_id: userId,
      agent_id: agentId || null,
      metric_type: metricType,
      value,
      unit: unit || null,
      metadata: metadata || {},
      recorded_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error recording metric:', error);
    // Non-critical error - don't throw
  }
}

/**
 * GET /api/agents/[id]/metrics
 * Get performance metrics for an agent
 */
export async function getAgentMetrics(
  agentId: string,
  userId: string,
  days: number = 7
): Promise<PerformanceMetric[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from('performance_metrics')
    .select('*')
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: false });

  return data || [];
}
