const checks = [
  {
    name: 'Node Agent Workers',
    baseUrl: process.env.WORKERS_URL,
    path: '/health',
  },
  {
    name: 'Office Intelligence liveness',
    baseUrl: process.env.OFFICE_INTELLIGENCE_URL,
    path: '/health/live',
  },
  {
    name: 'Office Intelligence readiness',
    baseUrl: process.env.OFFICE_INTELLIGENCE_URL,
    path: '/health/ready',
  },
];

async function check({ name, baseUrl, path }) {
  if (!baseUrl) {
    return { name, ok: false, detail: 'URL is not configured.' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
      signal: controller.signal,
    });
    const body = await response.text();
    return {
      name,
      ok: response.ok,
      detail: `${response.status} ${body.slice(0, 240)}`,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

const results = await Promise.all(checks.map(check));
for (const result of results) {
  console.log(`${result.ok ? 'OK' : 'FAIL'}  ${result.name}: ${result.detail}`);
}

if (results.some(result => !result.ok)) {
  process.exitCode = 1;
}
