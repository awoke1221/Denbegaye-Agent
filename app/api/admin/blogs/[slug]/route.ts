import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend, createAuthHeaders } from '@/lib/backendProxy';

export async function PUT(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const body = await request.json();
  const params = await context.params;

  return forwardToBackend(
    `/api/admin/blogs/${encodeURIComponent(params.slug)}`,
    {
      method: 'PUT',
      headers: createAuthHeaders(request.headers.get('authorization') ?? undefined),
      body,
    },
    request
  );
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const params = await context.params;

  return forwardToBackend(
    `/api/admin/blogs/${encodeURIComponent(params.slug)}`,
    {
      method: 'DELETE',
      headers: createAuthHeaders(request.headers.get('authorization') ?? undefined),
    },
    request
  );
}

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const params = await context.params;

  return forwardToBackend(
    `/api/admin/blogs/${encodeURIComponent(params.slug)}`,
    {
      method: 'GET',
      headers: createAuthHeaders(request.headers.get('authorization') ?? undefined),
    },
    request
  );
}
