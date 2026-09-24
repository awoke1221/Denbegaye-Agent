# Three-Project Deployment Runbook

This platform deploys as three services plus one shared Supabase project:

1. Supabase database and authentication
2. Python Office Intelligence API on Render
3. Node Agent Workers on Render
4. Next.js frontend on Vercel

## 1. Apply Supabase migration

Apply `supabase/migrations/20260916_create_execution_audit_logs.sql` to the target Supabase project before enabling the worker audit path.

Verify that `execution_audit_logs` exists and that RLS is enabled.

## 2. Deploy Python Office Intelligence API

Use the Python project `render.yaml`.

Required Render variables:

- `OFFICE_INTELLIGENCE_ALLOWED_ORIGINS`: deployed frontend origin
- `OFFICE_INTELLIGENCE_SHARED_SECRET`: long random secret shared with Vercel
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `LLM_PROVIDER`
- provider API key required by the selected LLM

Confirm:

- `/health/live` returns HTTP 200
- `/health/ready` reports configured dependencies
- `/agent/run` rejects requests without a valid service token

## 3. Deploy Node Agent Workers

Use the worker project `render.yaml`.

Required Render variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `REDIS_URL`
- `WORKERS_ALLOWED_ORIGIN`: deployed frontend origin
- `EXECUTION_WORKER_CONCURRENCY`
- `EXECUTION_MAX_RETRIES`
- `EXECUTION_RETRY_DELAY_MS`

Confirm:

- `/health` returns HTTP 200
- `/metrics` is reachable only according to the deployed access policy
- Redis queue processing is active
- Socket.IO accepts the deployed frontend origin

## 4. Deploy Next.js frontend

Deploy the frontend project to Vercel.

Required Vercel variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_BACKEND_URL=https://denbegaye-agent-workers.onrender.com`
- `NEXT_PUBLIC_WORKERS_URL=https://denbegaye-agent-workers.onrender.com`
- `OFFICE_INTELLIGENCE_URL=https://office-intelegence-workers-agent.onrender.com`
- `OFFICE_INTELLIGENCE_SHARED_SECRET`: same value as Python Render
- `OFFICE_INTELLIGENCE_MOCK=false`
- `NEXT_PUBLIC_APP_URL`: deployed Vercel origin

After deployment, verify that `/api/agent` forwards requests to the Python service and that the returned `execution_id` matches the browser execution record.

## Deployment order

1. Apply Supabase migration.
2. Deploy Python API.
3. Deploy Node workers and configure Redis.
4. Configure and deploy Vercel frontend.
5. Run authenticated smoke tests for upload, agent execution, status, cancellation, and audit logging.

Never commit `.env`, service-role keys, Redis URLs, provider keys, or the shared service secret.
