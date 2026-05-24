import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend, getQueryParams, createAuthHeaders } from '@/lib/backendProxy';

// POST /api/agent-run - Execute an agent
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization');
  return forwardToBackend(
    '/api/agent-run',
    {
      method: 'POST',
      body: await request.json(),
      headers: createAuthHeaders(token ?? undefined),
    },
    request
  );
}

// GET /api/agent-run - Proxy support for health checks or diagnostics
export async function GET(request: NextRequest) {
  return forwardToBackend(
    '/api/agent-run',
    {
      method: 'GET',
      query: getQueryParams(request),
      headers: createAuthHeaders(request.headers.get('authorization') ?? undefined),
    },
    request
  );
}
