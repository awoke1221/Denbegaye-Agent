# Office Intelligence Deployment

## Request flow

The Office Intelligence page does not call Render directly from the browser:

```text
Browser -> Next.js /api/agent -> Render /agent/run
Browser -> Next.js /api/upload-file -> Render /upload-file
```

This keeps the shared service secret server-side.

## Required production variables

Configure these variables in the frontend hosting provider for Production:

```text
OFFICE_INTELLIGENCE_URL=https://office-intelegence-workers-agent.onrender.com
OFFICE_INTELLIGENCE_MOCK=false
OFFICE_INTELLIGENCE_SHARED_SECRET=<same value configured on Render>
```

The `OFFICE_INTELLIGENCE_SHARED_SECRET` value must be identical in the Render service and the Next.js deployment. Generate a new long random value; never commit it or expose it as a `NEXT_PUBLIC_*` variable.

## Render variables

Configure these values in Render:

```text
LLM_PROVIDER=mock
OFFICE_INTELLIGENCE_SHARED_SECRET=<same value configured in Next.js>
OFFICE_INTELLIGENCE_ALLOWED_ORIGINS=https://www.denbegnayeaiagent.com,https://denbegnayeaiagent.com
```

## Verification

1. Open `https://office-intelegence-workers-agent.onrender.com/health` and confirm `{"status":"ok"}`.
2. Sign in at `https://www.denbegnayeaiagent.com`.
3. Open `/office-intelligence`.
4. Send a request through an agent.
5. In the Next.js logs, confirm `/api/agent` returns a successful response rather than `502` or `401`.

## Credential rotation

The previously used local environment file contains credentials. Rotate any exposed provider, database, payment, email, and service-secret credentials before treating the production deployment as secure.
