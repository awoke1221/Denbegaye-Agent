import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.search || '';
    const backendUrl = `${BACKEND_URL}/api/admin/subscriptions/users${search}`;

    const headers: Record<string, string> = {};
    const auth = request.headers.get('authorization');
    if (auth) headers['authorization'] = auth;

    const res = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    const body = await res.text();
    const response = new Response(body, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/json',
      },
    });
    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Proxy error', detail: String(err) }, { status: 500 });
  }
}
