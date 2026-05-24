import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend, getQueryParams } from '@/lib/backendProxy';

/**
 * GET /api/langgraph/status/[executionId]
 * Get execution status
 * Forwards to backend: GET /api/langgraph/status/[executionId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
): Promise<NextResponse> {
  try {
    const { executionId } = await params;

    // Forward to backend
    return await forwardToBackend(
      `/api/langgraph/status/${executionId}`,
      {
        method: 'GET',
      },
      request
    );
  } catch (error) {
    console.error('LangGraph status proxy error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get execution status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
