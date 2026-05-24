import { NextRequest } from 'next/server';
import { forwardToBackend, getQueryParams, createAuthHeaders } from '@/lib/backendProxy';

export async function GET(request: NextRequest) {
  return forwardToBackend(
    '/api/blogs',
    {
      method: 'GET',
      query: getQueryParams(request),
      headers: createAuthHeaders(request.headers.get('authorization') ?? undefined),
    },
    request
  );
}
