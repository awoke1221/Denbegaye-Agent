import { NextResponse, type NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest, context: any) {
  try {
    const maybeParams = context?.params;
    const params = typeof maybeParams?.then === 'function' ? await maybeParams : maybeParams;
    const { userId } = params || {};
    const backendUrl = `${BACKEND_URL}/api/admin/subscriptions/${userId}/limits`;
    const headers: Record<string, string> = {};
    const auth = request.headers.get('authorization');
    if (auth) headers['authorization'] = auth;

    const res = await fetch(backendUrl, { method: 'GET', headers });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Proxy error', detail: String(err) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  try {
    const maybeParams = context?.params;
    const params = typeof maybeParams?.then === 'function' ? await maybeParams : maybeParams;
    const { userId } = params || {};
    const backendUrl = `${BACKEND_URL}/api/admin/subscriptions/${userId}/limits`;
    const auth = request.headers.get('authorization');
    const bodyText = await request.text();

    const res = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'content-type': request.headers.get('content-type') || 'application/json',
        ...(auth ? { authorization: auth } : {}),
      },
      body: bodyText,
    });

    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Proxy error', detail: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: any) {
  try {
    const maybeParams = context?.params;
    const params = typeof maybeParams?.then === 'function' ? await maybeParams : maybeParams;
    const { userId } = params || {};
    const backendUrl = `${BACKEND_URL}/api/admin/subscriptions/${userId}/limits`;
    const auth = request.headers.get('authorization');

    const res = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        ...(auth ? { authorization: auth } : {}),
      },
    });

    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Proxy error', detail: String(err) }, { status: 500 });
  }
}
