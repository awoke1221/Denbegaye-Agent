import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'nodejs';

type ServiceStatus = {
  status: 'ok' | 'error' | 'not_configured';
  statusCode?: number;
  detail?: string;
};

const nodeWorkersUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
const officeIntelligenceUrl = process.env.OFFICE_INTELLIGENCE_URL;

async function checkService(url: string | undefined, path: string): Promise<ServiceStatus> {
  if (!url) {
    return { status: 'not_configured', detail: 'Service URL is not configured.' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}${path}`, {
      cache: 'no-store',
      signal: controller.signal,
    });

    return response.ok
      ? { status: 'ok', statusCode: response.status }
      : {
          status: 'error',
          statusCode: response.status,
          detail: `Health check returned ${response.status}.`,
        };
  } catch (error) {
    return {
      status: 'error',
      detail:
        error instanceof Error && error.name === 'AbortError'
          ? 'Health check timed out.'
          : 'Service is unreachable.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const [nodeWorkers, officeIntelligence] = await Promise.all([
    checkService(nodeWorkersUrl, '/health'),
    checkService(officeIntelligenceUrl, '/health/ready'),
  ]);

  const services = {
    supabase: { status: 'ok' as const },
    nodeWorkers,
    officeIntelligence,
  };
  const healthy = Object.values(services).every(service => service.status === 'ok');

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      checked_at: new Date().toISOString(),
      user_id: user.id,
      services,
    },
    { status: healthy ? 200 : 503 }
  );
}
