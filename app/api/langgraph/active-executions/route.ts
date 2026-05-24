import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend, getQueryParams } from '@/lib/backendProxy';

/**
 * GET /api/langgraph/active-executions
 * Get all active executions
 * Forwards to backend: GET /api/langgraph/active-executions
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get query parameters
    const query = getQueryParams(request);

    // Forward to backend
    return await forwardToBackend(
      '/api/langgraph/active-executions',
      {
        method: 'GET',
        query,
      },
      request
    );
  } catch (error) {
    console.error('LangGraph active-executions proxy error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get active executions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
