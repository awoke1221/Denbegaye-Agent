import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend, getQueryParams } from '@/lib/backendProxy';

/**
 * POST /api/langgraph/validate
 * Validate a LangGraph workflow
 * Forwards to backend: POST /api/langgraph/validate
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json();

    // Forward to backend
    return await forwardToBackend(
      '/api/langgraph/validate',
      {
        method: 'POST',
        body,
      },
      request
    );
  } catch (error) {
    console.error('LangGraph validate proxy error:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate LangGraph workflow',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
