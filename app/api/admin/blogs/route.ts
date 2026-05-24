import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend, getQueryParams, createAuthHeaders } from '@/lib/backendProxy';

export async function GET(request: NextRequest) {
  return forwardToBackend(
    '/api/admin/blogs',
    {
      method: 'GET',
      query: getQueryParams(request),
      headers: createAuthHeaders(request.headers.get('authorization') ?? undefined),
    },
    request
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  return forwardToBackend(
    '/api/admin/blogs',
    {
      method: 'POST',
      headers: createAuthHeaders(request.headers.get('authorization') ?? undefined),
      body,
    },
    request
  );
}
