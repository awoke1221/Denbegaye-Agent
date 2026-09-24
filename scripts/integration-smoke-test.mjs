const appUrl = (process.env.INTEGRATION_APP_URL || '').replace(/\/$/, '');
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!appUrl || !accessToken) {
  console.error('Set INTEGRATION_APP_URL and SUPABASE_ACCESS_TOKEN before running this test.');
  process.exit(1);
}

const authHeaders = {
  Authorization: `Bearer ${accessToken}`,
};

async function request(path, options = {}) {
  const response = await fetch(`${appUrl}${path}`, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

async function main() {
  const health = await request('/api/integration-health');
  console.log(`Integration health: ${health.status}`);

  const csv = ['customer,amount,status', 'Acme,1200,paid', 'Globex,800,pending'].join('\n');
  const form = new FormData();
  form.append('file', new Blob([csv], { type: 'text/csv' }), 'integration-smoke.csv');

  const upload = await request('/api/upload-file', {
    method: 'POST',
    body: form,
  });
  console.log(`Office upload: ${upload.file_path ? 'ok' : 'response received'}`);

  const officeResult = await request('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: 'csv-analyst',
      prompt: 'Summarize the uploaded CSV and total the amount column.',
      file_path: upload.file_path,
      mode: 'auto',
      use_langchain: true,
      top_k: 5,
    }),
  });
  console.log(`Office analysis: ${officeResult.answer ? 'ok' : 'response received'}`);

  const workerResult = await request('/api/agent-run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nodes: [{ id: 'calculator', type: 'tool-calculator', config: { expression: '1 + 2' } }],
      edges: [],
      input: { expression: '1 + 2' },
      apiKeys: {},
      isTemporary: true,
    }),
  });
  console.log(`Node worker submission: ${workerResult.executionId ? 'ok' : 'response received'}`);
}

main().catch(error => {
  console.error(`Integration smoke test failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
