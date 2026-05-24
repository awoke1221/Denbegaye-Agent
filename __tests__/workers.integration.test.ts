/** @jest-environment node */

import crypto from 'crypto';

if (typeof (global as any).setImmediate === 'undefined') {
  (global as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) =>
    setTimeout(fn, 0, ...args);
}

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'test-secret';
process.env.WORKERS_TEST_IMPORT = '1';
process.env.WORKERS_TEST_AUTH_BYPASS = '1';

const WORKERS_PORT = 3101;
const WORKERS_BASE_URL = `http://localhost:${WORKERS_PORT}`;

const { executeWorkflow, server } = (() => {
  process.env.WORKERS_TEST_IMPORT = '1';
  const mod = require('C:/Users/hp/Documents/Denbegaye Agent Workers/server.js');
  delete process.env.WORKERS_TEST_IMPORT;
  return mod;
})();

function waitForServer(url: string, timeout = 10000) {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    (function ping() {
      fetch(url)
        .then(res => {
          if (res.ok) return resolve();
          if (Date.now() - start > timeout) return reject(new Error('timeout'));
          setTimeout(ping, 200);
        })
        .catch(() => {
          if (Date.now() - start > timeout) return reject(new Error('timeout'));
          setTimeout(ping, 200);
        });
    })();
  });
}

describe('Workers integration', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.listen(WORKERS_PORT, (err?: Error) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }, 30000);

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err?: Error) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  it('returns sample outputs for ai-gemini', async () => {
    const res = await fetch(`${WORKERS_BASE_URL}/api/sample-outputs?nodeType=ai-gemini`);
    expect(res.status).toBe(200);
    const data = await res.json();
    // Expect at least an examples array or object with keys
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
  });

  it('returns sample outputs for http-request', async () => {
    const res = await fetch(`${WORKERS_BASE_URL}/api/sample-outputs?nodeType=http-request`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toBeDefined();
  });

  it('executes a simple workflow in-process and returns node outputs', async () => {
    const nodes = [
      {
        id: 'n1',
        type: 'tool-calculator',
        config: { expression: '1 + 2' },
      },
    ];
    const edges: any[] = [];
    const fakeIo = { emit: jest.fn() };

    const result = await executeWorkflow(
      nodes,
      edges,
      { expression: '1 + 2' },
      {},
      'test-exec-1',
      fakeIo,
      'workflow'
    );

    expect(result).toBeDefined();
    expect(result.n1).toBeDefined();
    expect(result.n1.result).toBe(3);
    expect(fakeIo.emit).toHaveBeenCalled();
  });

  it('executes a simple workflow and returns node outputs', async () => {
    // Prepare a simple workflow with a single calculator tool node
    const nodes = [
      {
        id: 'n1',
        type: 'tool-calculator',
        config: { expression: '1 + 2' },
      },
    ];

    const edges: any[] = [];

    // Create a fake JWT-like token with payload { sub: 'test-user', email: 'test@example.com' }
    const base64UrlEncode = (str: string) =>
      Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = base64UrlEncode(
      JSON.stringify({ sub: 'test-user', email: 'test@example.com' })
    );
    const signature = base64UrlEncode(
      crypto
        .createHmac('sha256', process.env.SUPABASE_JWT_SECRET as string)
        .update(`${header}.${payload}`)
        .digest()
    );
    const fakeToken = `${header}.${payload}.${signature}`;

    const startRes = await fetch(`${WORKERS_BASE_URL}/api/langgraph/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fakeToken}`,
      },
      body: JSON.stringify({ nodes, edges, input: { expression: '1 + 2' } }),
    });

    expect(startRes.status).toBe(200);
    const startJson = await startRes.json();
    expect(startJson.executionId).toBeDefined();
    const executionId = startJson.executionId;

    // Poll for completion
    const start = Date.now();
    let statusJson: any = null;
    while (Date.now() - start < 10000) {
      const sres = await fetch(`${WORKERS_BASE_URL}/api/langgraph/status/${executionId}`, {
        headers: { Authorization: `Bearer ${fakeToken}` },
      });
      statusJson = await sres.json();
      if (statusJson.status === 'completed') break;
      await new Promise(r => setTimeout(r, 200));
    }

    expect(statusJson).toBeDefined();
    if (statusJson.status !== 'completed') {
      throw new Error(`Execution failed or timed out: ${JSON.stringify(statusJson)}`);
    }
    expect(statusJson.result).toBeDefined();
    // result should contain node output for n1
    expect(statusJson.result.n1).toBeDefined();
    // tool-calculator returns { result, expression, type }
    expect(statusJson.result.n1.result).toBe(3);
  }, 20000);
});
