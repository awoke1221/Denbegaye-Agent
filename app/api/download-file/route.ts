import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getOfficeIntelligenceUser } from '@/lib/office-intelligence-auth';
import { getOfficeIntelligenceServiceToken } from '@/lib/office-intelligence-service-auth';

export const runtime = 'nodejs';

const officeIntelligenceUrl = process.env.OFFICE_INTELLIGENCE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const user = await getOfficeIntelligenceUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const filePath = new URL(request.url).searchParams.get('file_path');
  if (!filePath) {
    return NextResponse.json({ ok: false, error: 'file_path is required.' }, { status: 400 });
  }

  const requestId = request.headers.get('x-request-id') || randomUUID();

  try {
    const backendUrl = new URL('/download-file', `${officeIntelligenceUrl.replace(/\/$/, '')}/`);
    backendUrl.searchParams.set('file_path', filePath);
    const serviceToken = getOfficeIntelligenceServiceToken();

    const response = await fetch(backendUrl, {
      headers: {
        'x-request-id': requestId,
        authorization: `Bearer ${serviceToken}`,
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : { detail: await response.text() };

      return NextResponse.json(
        {
          ok: false,
          error: payload?.detail || payload?.error || 'Office Intelligence download failed.',
          request_id: requestId,
          details: payload,
        },
        { status: response.status }
      );
    }

    const headers = new Headers();
    for (const name of ['content-type', 'content-disposition', 'content-length']) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    headers.set('x-request-id', requestId);

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('Office Intelligence download failed:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Office Intelligence download service is unavailable.',
        request_id: requestId,
        details: error instanceof Error ? error.message : 'Unknown connection error',
      },
      { status: 502, headers: { 'x-request-id': requestId } }
    );
  }
}
