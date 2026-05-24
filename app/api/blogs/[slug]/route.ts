import { NextRequest } from 'next/server';
import { forwardToBackend, createAuthHeaders } from '@/lib/backendProxy';

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const params = await context.params;

  return forwardToBackend(
    `/api/blogs/${encodeURIComponent(params.slug)}`,
    {
      method: 'GET',
      headers: createAuthHeaders(request.headers.get('authorization') ?? undefined),
    },
    request
  );
}
