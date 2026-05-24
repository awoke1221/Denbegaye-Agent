# API Integration Guide

**Last Updated:** May 10, 2026  
**Status:** ✅ Complete - Database fully aligned

This guide documents all API endpoints for the Denbegaye Agent platform, organized by functionality.

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Profile Management](#user-profile-management)
3. [Agent Management](#agent-management)
4. [Execution Management](#execution-management)
5. [Memory Management](#memory-management)
6. [Workflow Management](#workflow-management)
7. [Data Sources](#data-sources)
8. [Usage & Quotas](#usage--quotas)
9. [Analytics](#analytics)
10. [Billing](#billing)
11. [Error Handling](#error-handling)

---

## Authentication

All API endpoints require a valid Bearer token in the Authorization header.

### Header Format

```
Authorization: Bearer <supabase_jwt_token>
```

### Getting a Token

```bash
# Token obtained from Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
const token = data.session?.access_token;
```

---

## User Profile Management

### GET /api/profile

**Description:** Fetch current user's profile

**Request:**

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**

```json
{
  "data": {
    "id": "uuid-1234",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "AI enthusiast",
    "timezone": "UTC",
    "preferences": { "theme": "dark" },
    "subscription_tier": "pro",
    "credits_remaining": 500,
    "role": "user",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-05-10T00:00:00Z"
  }
}
```

### PATCH /api/profile

**Description:** Update current user's profile

**Request:**

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Doe",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "timezone": "EST",
    "preferences": { "theme": "light", "notifications": true }
  }'
```

**Allowed Fields:**

- `full_name`: string
- `avatar_url`: string
- `bio`: string
- `timezone`: string
- `preferences`: Record<string, any>

**Response (200 OK):**

```json
{
  "data": {
    /* updated profile */
  }
}
```

---

## Agent Management

### GET /api/agents

**Description:** List all agents for current user

**Request:**

```bash
curl -X GET "http://localhost:3000/api/agents?limit=10&offset=0" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**

```json
{
  "agents": [
    /* array of agents */
  ],
  "count": 5
}
```

### POST /api/agents

**Description:** Create a new agent

**Request:**

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Bot",
    "description": "Handles customer inquiries",
    "config": {
      "nodes": [ /* agent nodes */ ],
      "edges": [ /* connections */ ]
    }
  }'
```

**Response (201 Created):**

```json
{
  "id": "agent-uuid",
  "user_id": "user-uuid",
  "name": "Customer Support Bot",
  "status": "draft",
  "created_at": "2026-05-10T12:00:00Z"
}
```

### GET /api/agents/[id]

**Description:** Get a specific agent

### PUT /api/agents/[id]

**Description:** Update agent configuration

### DELETE /api/agents/[id]

**Description:** Delete an agent

---

## Execution Management

### GET /api/agents/[id]/executions

**Description:** Get execution history for an agent

**Query Parameters:**

- `limit`: 1-100 (default: 50)
- `offset`: integer (default: 0)
- `status`: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
- `sort`: 'newest' | 'oldest' | 'duration' (default: 'newest')

**Request:**

```bash
curl -X GET "http://localhost:3000/api/agents/agent-id/executions?status=completed&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "exec-uuid",
      "agent_id": "agent-uuid",
      "user_id": "user-uuid",
      "status": "completed",
      "input_data": { "query": "Hello" },
      "output_data": { "response": "Hi there!" },
      "execution_time_ms": 1250,
      "tokens_used": 150,
      "cost_cents": 12,
      "created_at": "2026-05-10T12:00:00Z",
      "completed_at": "2026-05-10T12:00:01Z"
    }
  ],
  "count": 1
}
```

### POST /api/agents/[id]/executions

**Description:** Execute an agent

**Request:**

```bash
curl -X POST http://localhost:3000/api/agents/agent-id/executions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "input_data": { "query": "What is AI?" },
    "idempotency_key": "optional-dedup-key"
  }'
```

**Response (201 Created):**

```json
{
  "data": {
    "id": "exec-uuid",
    "status": "queued",
    "created_at": "2026-05-10T12:00:00Z"
  }
}
```

---

## Memory Management

### GET /api/agents/[id]/memories

**Description:** Get agent memories

**Query Parameters:**

- `limit`: 1-100 (default: 50)
- `offset`: integer (default: 0)
- `type`: 'conversation' | 'fact' | 'procedure' | 'context'
- `search`: string (search in content)
- `sort`: 'newest' | 'oldest' | 'important' | 'accessed'

**Request:**

```bash
curl -X GET "http://localhost:3000/api/agents/agent-id/memories?type=fact&search=customer" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "memory-uuid",
      "agent_id": "agent-uuid",
      "content": "Customer prefers email communication",
      "memory_type": "fact",
      "importance_score": 0.9,
      "access_count": 5,
      "created_at": "2026-05-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### POST /api/agents/[id]/memories

**Description:** Add a new memory

**Request:**

```bash
curl -X POST http://localhost:3000/api/agents/agent-id/memories \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "User likes detailed explanations",
    "memory_type": "fact",
    "importance_score": 0.8,
    "metadata": { "source": "conversation" }
  }'
```

**Response (201 Created):**

```json
{
  "data": {
    "id": "memory-uuid",
    "content": "User likes detailed explanations",
    "memory_type": "fact",
    "importance_score": 0.8,
    "created_at": "2026-05-10T12:00:00Z"
  }
}
```

---

## Workflow Management

### GET /api/workflows

**Description:** List all workflows

**Query Parameters:**

- `agent_id`: string (optional, filter by agent)
- `limit`: 1-100 (default: 50)
- `offset`: integer (default: 0)
- `sort`: 'newest' | 'oldest' | 'name'

**Request:**

```bash
curl -X GET "http://localhost:3000/api/workflows?agent_id=agent-id" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "workflow-uuid",
      "user_id": "user-uuid",
      "agent_id": "agent-uuid",
      "name": "Customer Support Flow",
      "description": "Multi-step support workflow",
      "definition": {
        /* workflow definition */
      },
      "version": 1,
      "is_active": true,
      "tags": ["support", "automated"],
      "created_at": "2026-05-10T12:00:00Z"
    }
  ],
  "count": 1
}
```

### POST /api/workflows

**Description:** Create a new workflow

**Request:**

```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Workflow",
    "description": "Workflow description",
    "agent_id": "agent-uuid",
    "definition": { "nodes": [], "edges": [] },
    "tags": ["tag1", "tag2"]
  }'
```

---

## Data Sources

### GET /api/data-sources

**Description:** List all data sources

**Request:**

```bash
curl -X GET "http://localhost:3000/api/data-sources?limit=50" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "source-uuid",
      "user_id": "user-uuid",
      "name": "Customer Email List",
      "type": "email_list",
      "config": { "importer": "mailchimp" },
      "record_count": 5000,
      "is_active": true,
      "last_sync_at": "2026-05-10T10:00:00Z",
      "created_at": "2026-05-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### POST /api/data-sources

**Description:** Create a new data source

**Request:**

```bash
curl -X POST http://localhost:3000/api/data-sources \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Email List",
    "type": "email_list",
    "config": { "provider": "mailchimp", "api_key": "..." }
  }'
```

---

## Usage & Quotas

### GET /api/usage/quotas

**Description:** Get current usage quotas and remaining limits

**Request:**

```bash
curl -X GET http://localhost:3000/api/usage/quotas \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**

```json
{
  "data": {
    "agent_creations": {
      "used": 3,
      "limit": 50,
      "remaining": 47,
      "percentage": 6
    },
    "executions": {
      "used": 150,
      "limit": 10000,
      "remaining": 9850,
      "percentage": 2
    },
    "api_calls": {
      "used": 500,
      "limit": 100000,
      "remaining": 99500,
      "percentage": 1
    },
    "storage_mb": {
      "used": 50,
      "limit": 1000,
      "remaining": 950,
      "percentage": 5
    },
    "credits_remaining": 500,
    "subscription_tier": "pro",
    "period_start": "2026-05-01T00:00:00Z",
    "period_end": "2026-05-31T23:59:59Z",
    "reset_date": "2026-06-01T00:00:00Z"
  }
}
```

### Quota Tiers

**Free Plan:**

- 5 agent creations
- 100 executions
- 1,000 API calls
- 100 MB storage
- 1 concurrent agent

**Pro Plan:**

- 50 agent creations
- 10,000 executions
- 100,000 API calls
- 1,000 MB storage
- 5 concurrent agents

**Enterprise Plan:**

- Unlimited

---

## Analytics

### GET /api/analytics

**Description:** Get user analytics and event data

**Query Parameters:**

- `days`: 1-90 (default: 7)
- `event_type`: string (optional)
- `limit`: 1-100 (default: 50)
- `offset`: integer (default: 0)

**Request:**

```bash
curl -X GET "http://localhost:3000/api/analytics?days=30&event_type=agent_execution" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**

```json
{
  "data": {
    "total_events": 150,
    "unique_event_types": 5,
    "events_by_type": [
      {
        "event_type": "agent_execution",
        "count": 100,
        "last_event": "2026-05-10T12:00:00Z"
      },
      {
        "event_type": "agent_creation",
        "count": 50,
        "last_event": "2026-05-10T11:00:00Z"
      }
    ],
    "date_range": {
      "start": "2026-04-10T00:00:00Z",
      "end": "2026-05-10T23:59:59Z"
    }
  },
  "raw_events": [
    /* detailed events */
  ]
}
```

### GET /api/agents/[id]/metrics

**Description:** Get performance metrics for an agent

Metrics include:

- `execution_time`: ms per execution
- `token_usage`: tokens consumed
- `api_latency`: response time
- `error_rate`: percentage of failed executions

---

## Billing

### GET /api/billing/history

**Description:** Get payment and billing history

**Query Parameters:**

- `limit`: 1-100 (default: 50)
- `offset`: integer (default: 0)
- `status`: 'succeeded' | 'failed' | 'pending' | 'canceled'
- `sort`: 'newest' | 'oldest'

**Request:**

```bash
curl -X GET "http://localhost:3000/api/billing/history?status=succeeded" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "payment-uuid",
      "user_id": "user-uuid",
      "subscription_id": "sub-uuid",
      "stripe_payment_intent_id": "pi_xxx",
      "amount": 9.99,
      "currency": "usd",
      "status": "succeeded",
      "description": "Pro Plan - Monthly",
      "created_at": "2026-05-01T00:00:00Z"
    }
  ],
  "count": 12,
  "summary": {
    "totalSpent": 119.88,
    "totalTransactions": 12,
    "currency": "usd"
  }
}
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized**

```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authorization token"
}
```

**400 Bad Request**

```json
{
  "error": "Validation error",
  "message": "Field 'name' is required and must be a non-empty string"
}
```

**404 Not Found**

```json
{
  "error": "Agent not found or access denied",
  "message": "You do not have access to this agent"
}
```

**429 Too Many Requests**

```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded your quota for this period"
}
```

**500 Internal Server Error**

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

### Error Codes

| Code | Status                | Description                   |
| ---- | --------------------- | ----------------------------- |
| 200  | OK                    | Request successful            |
| 201  | Created               | Resource created successfully |
| 400  | Bad Request           | Invalid request parameters    |
| 401  | Unauthorized          | Missing or invalid token      |
| 404  | Not Found             | Resource not found            |
| 405  | Method Not Allowed    | HTTP method not allowed       |
| 429  | Too Many Requests     | Rate limit exceeded           |
| 500  | Internal Server Error | Server error                  |

---

## API Response Format

All successful responses follow this format:

```json
{
  "data": {
    /* response data */
  },
  "count": 1,
  "message": "Optional success message"
}
```

All error responses include:

```json
{
  "error": "Error category",
  "message": "Human-readable error description"
}
```

---

## Rate Limiting

Rate limits are applied per subscription tier:

**Free:** 100 requests/minute, 10,000/day
**Pro:** 1,000 requests/minute, 100,000/day
**Enterprise:** Custom limits

Headers returned with each response:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1620000000
```

---

## Pagination

For list endpoints, use `limit` and `offset`:

```bash
# Get first 10 items
?limit=10&offset=0

# Get next 10 items
?limit=10&offset=10
```

Maximum limit is 100 items per request.

---

## TypeScript Usage

```typescript
import { supabase } from '@/lib/supabaseClient';
import type { UserAgent, AgentExecution, QuotaInfo } from '@/types/database';

// Get profile
const { data: profile } = await supabase.from('profiles').select('*').single();

// Create agent
const { data: agent } = await supabase
  .from('user_agents')
  .insert({
    /* agent data */
  })
  .select()
  .single();

// Execute agent
const response = await fetch('/api/agents/[id]/executions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    input_data: {
      /* input */
    },
  }),
});

const { data: execution } = await response.json();
```

---

## Webhooks

Webhooks are triggered for key events:

- `agent.created` - Agent created
- `agent.executed` - Agent execution started
- `agent.completed` - Agent execution completed
- `agent.failed` - Agent execution failed
- `workflow.triggered` - Workflow triggered
- `subscription.updated` - Subscription changed

Configure webhooks in `/api/webhooks`

---

**End of API Integration Guide**
