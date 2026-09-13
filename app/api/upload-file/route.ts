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

  return NextResponse.json({
    ok: true,
    message: 'Office Intelligence upload proxy is active.',
    backend: officeIntelligenceUrl,
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getOfficeIntelligenceUser(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data;')) {
      return NextResponse.json(
        { ok: false, error: 'A multipart/form-data upload is required.' },
        { status: 400 }
      );
    }

    const requestId = request.headers.get('x-request-id') || randomUUID();
    const serviceToken = getOfficeIntelligenceServiceToken();
    const response = await fetch(`${officeIntelligenceUrl.replace(/\/$/, '')}/upload-file`, {
      method: 'POST',
      headers: {
        'content-type': contentType,
        'x-request-id': requestId,
        ...(request.headers.get('content-length')
          ? { 'content-length': request.headers.get('content-length')! }
          : {}),
        authorization: `Bearer ${serviceToken}`,
      },
      body: request.body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' });

    const responseContentType = response.headers.get('content-type') || '';
    const payload = responseContentType.includes('application/json')
      ? await response.json()
      : { detail: await response.text() };

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: payload?.detail || payload?.error || 'Office Intelligence upload failed.',
          request_id: requestId,
          details: payload,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(payload, {
      headers: { 'x-request-id': requestId },
    });
  } catch (error) {
    console.error('Office Intelligence upload failed:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Office Intelligence upload service is unavailable.',
        details: error instanceof Error ? error.message : 'Unknown upload error',
      },
      { status: 502 }
    );
  }
}
