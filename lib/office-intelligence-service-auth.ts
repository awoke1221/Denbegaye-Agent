import { createHmac } from 'crypto';

const TOKEN_TTL_SECONDS = 60;

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

export function getOfficeIntelligenceServiceToken(user?: {
  id?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}) {
  const secret = process.env.OFFICE_INTELLIGENCE_SHARED_SECRET;
  if (!secret) {
    throw new Error('OFFICE_INTELLIGENCE_SHARED_SECRET is not configured.');
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = encodeBase64Url(
    JSON.stringify({
      iss: 'denbegaye-nextjs',
      sub: user?.id || 'unknown-user',
      service: 'nextjs-api',
      tenant_id: user?.app_metadata?.tenant_id || user?.user_metadata?.tenant_id || 'default',
      aud: 'office-intelligence',
      iat: issuedAt,
      exp: issuedAt + TOKEN_TTL_SECONDS,
    })
  );
  const signingInput = `${header}.${payload}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');

  return `${signingInput}.${signature}`;
}
