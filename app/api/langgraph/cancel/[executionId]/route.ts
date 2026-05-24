import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend, getQueryParams } from '@/lib/backendProxy';

/**
 * POST /api/langgraph/cancel/[executionId]
 * Cancel an execution
 * Forwards to backend: POST /api/langgraph/cancel/[executionId]
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
): Promise<NextResponse> {
  try {
    const { executionId } = await params;

    // Parse request body (if any)
    let body;
    try {
      body = await request.json();
    } catch {
      // No body is fine for cancel requests
    }

    // Forward to backend
    return await forwardToBackend(
      `/api/langgraph/cancel/${executionId}`,
      {
        method: 'POST',
        body,
      },
      request
    );
  } catch (error) {
    console.error('LangGraph cancel proxy error:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel execution',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
