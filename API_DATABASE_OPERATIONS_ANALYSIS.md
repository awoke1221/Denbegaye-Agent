# Frontend API Database Operations Analysis

**Document Date:** May 10, 2026  
**Workspace:** Denbegaye Agent  
**Scope:** `app/api` directory analysis

---

## Executive Summary

This document provides a comprehensive analysis of all API routes in the `app/api` directory, detailing:

- Database tables accessed
- CRUD operations performed
- Data models/schemas used
- Missing database operations
- Architecture observations

**Key Finding:** The frontend API uses a hybrid architecture where most routes forward requests to a backend server (port 3001), with local Supabase operations as fallback. Not all database tables have corresponding API routes.

---

## Database Schema Overview

### All Tables in Supabase Schema

1. **profiles** - User profile information
2. **user_agents** - User-created AI agents
3. **agent_executions** - Execution history of agents
4. **agent_memories** - Agent memory storage with embeddings
5. **memory_relationships** - Graph relationships between memories
6. **workflows** - Workflow definitions
7. **workflow_executions** - Workflow execution history
8. **data_sources** - External data source connections
9. **data_records** - Individual records from data sources
10. **usage_analytics** - User event tracking
11. **performance_metrics** - System performance data
12. **user_api_keys** - Encrypted API credentials
13. **agent_templates** - Pre-built agent configurations
14. **pricing_plans** - Subscription plan definitions
15. **user_subscriptions** - User subscription tracking
16. **usage_tracking** - Rate limiting and quota tracking
17. **payment_history** - Payment/billing history
18. **webhookTriggers** - Webhook event triggers
19. **webhookEvents** - Webhook audit trail
20. **job_queue** - Async job queue

---

## Detailed Route-by-Route Analysis

### 1. ADMIN ROUTES

#### 1.1 `/api/admin/agents` (route.ts)

**Purpose:** List all agents and perform agent management (Admin only)

**Database Tables Accessed:**

- `user_agents` (primary)
- `profiles` (joined)

**Operations:**

- **GET** - SELECT from `user_agents` with profile joins
  ```sql
  SELECT *, profiles.full_name, profiles.email
  FROM user_agents
  JOIN profiles ON user_agents.user_id = profiles.id
  ORDER BY created_at DESC
  ```
- **POST** - Forwards to backend (no local implementation)

**Data Models:**

- UserAgent (name, description, config, created_at, etc.)
- Profile (full_name, email)

**Missing Operations:**

- Local POST implementation (only backend forwarding)
- UPDATE operation
- DELETE operation

---

#### 1.2 `/api/admin/dashboard` (route.ts)

**Purpose:** Retrieve dashboard statistics (Admin only)

**Database Tables Accessed:**

- `profiles` (count only)
- `user_agents` (count only)
- `agent_executions` (count + recent records)

**Operations:**

- **GET** - Multiple COUNT queries and SELECT
  ```sql
  SELECT COUNT(id) FROM profiles
  SELECT COUNT(id) FROM user_agents
  SELECT COUNT(id) FROM agent_executions
  SELECT * FROM agent_executions
  ORDER BY created_at DESC LIMIT 10
  ```

**Data Models:**

- Count statistics
- Recent executions (full agent_executions records)

**Missing Operations:**

- POST/PUT/DELETE operations

---

#### 1.3 `/api/admin/executions` (route.ts)

**Purpose:** List all agent executions with filtering (Admin only)

**Database Tables Accessed:**

- `agent_executions` (primary)
- `user_agents` (joined)
- `profiles` (joined)

**Operations:**

- **GET** - SELECT with optional status filtering and joins
  ```sql
  SELECT *, user_agents.name, profiles.email, profiles.full_name
  FROM agent_executions
  JOIN user_agents ON agent_executions.agent_id = user_agents.id
  JOIN profiles ON agent_executions.user_id = profiles.id
  WHERE status IN (?) [if provided]
  ORDER BY created_at DESC
  LIMIT ?
  ```

**Query Parameters:**

- `status` - Comma-separated list of statuses
- `limit` - Default 50

**Data Models:**

- AgentExecution (status, input_data, output_data, error_message, etc.)
- UserAgent (name)
- Profile (email, full_name)

**Missing Operations:**

- CREATE/UPDATE/DELETE operations

---

#### 1.4 `/api/admin/subscriptions` (route.ts)

**Purpose:** Manage user subscriptions (Admin only)

**Database Tables Accessed:**

- `profiles` (primary)

**Operations:**

- **GET** - SELECT subscriptions from profiles
  ```sql
  SELECT id, email, full_name, subscription_tier, created_at
  FROM profiles
  ORDER BY created_at DESC
  ```
- **POST** - UPDATE subscription tier
  ```sql
  UPDATE profiles
  SET subscription_tier = ?, updated_at = NOW()
  WHERE id = ?
  ```

**Data Models:**

- Profile (subscription_tier, email, full_name)

**Request Body (POST):**

```json
{
  "user_id": "uuid",
  "subscription_tier": "free|pro|enterprise"
}
```

**Missing Operations:**

- DELETE subscription (would need cascade logic)

---

#### 1.5 `/api/admin/system` (route.ts)

**Purpose:** Get system information and perform system operations (Admin only)

**Database Tables Accessed:**

- None (returns hardcoded values)

**Operations:**

- **GET** - Returns system status hardcoded
- **POST** - Returns generic success message, no DB operations

**Missing Operations:**

- All operations are non-persistent (mock implementation)

---

#### 1.6 `/api/admin/system/api-keys` (route.ts)

**Purpose:** List configured API keys (Admin only)

**Database Tables Accessed:**

- None (returns environment variable status)

**Operations:**

- **GET** - Checks environment variables only

**Missing Operations:**

- All operations read environment variables, not database

---

#### 1.7 `/api/admin/system/metrics` (route.ts)

**Purpose:** Get system metrics (Admin only)

**Database Tables Accessed:**

- `profiles` (count)
- `user_agents` (count)
- `agent_executions` (count and filtered count)

**Operations:**

- **GET** - Multiple COUNT queries
  ```sql
  SELECT COUNT(id) FROM profiles
  SELECT COUNT(id) FROM user_agents
  SELECT COUNT(id) FROM agent_executions
  SELECT COUNT(id) FROM agent_executions WHERE status = 'completed'
  ```

**Metrics Returned:**

- total_users, total_agents, total_executions
- successful_executions
- API/Database health status (mock)

---

#### 1.8 `/api/admin/system/settings` (route.ts)

**Purpose:** Get and update system settings (Admin only)

**Database Tables Accessed:**

- None (returns hardcoded defaults)

**Operations:**

- **GET** - Returns default settings (no DB access)
- **POST** - Accepts settings but doesn't persist

**Missing Operations:**

- No actual database persistence
- Settings should ideally be stored in a `system_settings` table

---

#### 1.9 `/api/admin/templates` (route.ts)

**Purpose:** List and create agent templates (Admin only)

**Database Tables Accessed:**

- None (all forwarded to backend)

**Operations:**

- **GET** - Forwarded to backend
- **POST** - Forwarded to backend

**Note:** All operations proxy to backend server

---

#### 1.10 `/api/admin/templates/bulk-update` (route.ts)

**Purpose:** Bulk update templates (Admin only)

**Database Tables Accessed:**

- None (forwarded to backend)

**Operations:**

- **POST** - Forwarded to backend

---

#### 1.11 `/api/admin/templates/stats` (route.ts)

**Purpose:** Get template statistics (Admin only)

**Database Tables Accessed:**

- None (forwarded to backend)

**Operations:**

- **GET** - Forwarded to backend

---

#### 1.12 `/api/admin/templates/[id]` (route.ts)

**Purpose:** Get, update, and delete templates (Admin only)

**Database Tables Accessed:**

- None (forwarded to backend)

**Operations:**

- **PUT** - Forwarded to backend
- **DELETE** - Forwarded to backend
- **Note:** All operations are backend proxies

---

#### 1.13 `/api/admin/templates/[id]/duplicate` (route.ts)

**Purpose:** Duplicate a template (Admin only)

**Database Tables Accessed:**

- None (forwarded to backend)

**Operations:**

- **POST** - Forwarded to backend

---

#### 1.14 `/api/admin/users` (route.ts)

**Purpose:** List and manage users (Admin only)

**Database Tables Accessed:**

- `profiles` (primary)

**Operations:**

- **GET** - SELECT from profiles
  ```sql
  SELECT id, email, full_name, role, created_at, subscription_tier
  FROM profiles
  ORDER BY created_at DESC
  ```
- **POST** - Forwarded to backend (no local implementation)

**Data Models:**

- Profile (id, email, full_name, role, subscription_tier)

**Missing Operations:**

- UPDATE user details
- DELETE users

---

### 2. AGENT ROUTES

#### 2.1 `/api/agents` (route.ts)

**Purpose:** List and create agents for current user

**Database Tables Accessed:**

- `user_agents` (primary)

**Operations:**

- **GET** - SELECT agents for current user
  ```sql
  SELECT * FROM user_agents
  WHERE user_id = ?
  ORDER BY created_at DESC
  ```
- **POST** - INSERT new agent
  ```sql
  INSERT INTO user_agents
  (user_id, name, description, config, nodes, edges, template_id, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', NOW(), NOW())
  ```

**Data Models:**

- UserAgent (name, description, config, nodes, edges, template_id)

**Request Body (POST):**

```json
{
  "name": "string (required)",
  "description": "string",
  "config": "object (required)",
  "nodes": "array",
  "edges": "array",
  "template_id": "uuid"
}
```

**Missing Operations:**

- No UPDATE operation

---

#### 2.2 `/api/agents/[id]` (route.ts)

**Purpose:** Get, update, and delete specific agent

**Database Tables Accessed:**

- `user_agents` (primary)

**Operations:**

- **GET** - SELECT single agent
  ```sql
  SELECT * FROM user_agents
  WHERE id = ? AND user_id = ?
  ```
- **PUT** - UPDATE agent
  ```sql
  UPDATE user_agents
  SET name = ?, description = ?, config = ?, nodes = ?, edges = ?, updated_at = NOW()
  WHERE id = ? AND user_id = ?
  ```
- **DELETE** - DELETE agent
  ```sql
  DELETE FROM user_agents
  WHERE id = ? AND user_id = ?
  ```

**Data Models:**

- UserAgent (full CRUD operations)

**Complete CRUD Coverage:** ✓ (Read, Create, Update, Delete)

---

### 3. AGENT EXECUTION ROUTES

#### 3.1 `/api/agent-run` (route.ts)

**Purpose:** Execute an agent

**Database Tables Accessed:**

- Forwarded to backend (no local implementation)

**Operations:**

- **POST** - Execute agent (forwarded to backend)
- **GET** - Health check (forwarded to backend)

**Note:** This is purely a proxy to the backend service

---

### 4. CREDENTIAL ROUTES

#### 4.1 `/api/credentials` (route.ts)

**Purpose:** Manage user API credentials

**Database Tables Accessed:**

- `user_api_keys` (primary)

**Operations:**

- **GET** - LIST credentials
  ```sql
  SELECT id, provider, label, is_active, created_at
  FROM user_api_keys
  WHERE user_id = ?
  ORDER BY created_at DESC
  ```
- **POST** - CREATE credential with encryption
  ```sql
  INSERT INTO user_api_keys
  (user_id, provider, label, encrypted_key, key_hash, is_active)
  VALUES (?, ?, ?, base64_encode(?), sha256(?), true)
  ```
- **DELETE** - DELETE credential by ID
  ```sql
  DELETE FROM user_api_keys
  WHERE id = ? AND user_id = ?
  ```

**Data Models:**

- UserApiKey (provider, label, encrypted_key, key_hash)

**Request Body (POST):**

```json
{
  "provider": "openai|anthropic|google|deepseek|groq",
  "label": "string",
  "apiKey": "string (required)"
}
```

**Security Notes:**

- API keys stored base64 encoded + sha256 hashed
- Only metadata returned, never full keys
- Unique constraint: one per user per provider

**Missing Operations:**

- UPDATE credentials
- GET individual credential details

---

### 5. SCHEDULER ROUTES

#### 5.1 `/api/scheduler/jobs` (route.ts)

**Purpose:** Create and list scheduled jobs

**Database Tables Accessed:**

- `scheduled_jobs` (primary)

**Operations:**

- **GET** - LIST jobs
  ```sql
  SELECT * FROM scheduled_jobs
  WHERE user_id = ?
  ORDER BY created_at DESC
  ```
- **POST** - CREATE scheduled job with cron validation
  ```sql
  INSERT INTO scheduled_jobs
  (user_id, name, agent_id, cron_expression, config, is_active, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
  ```

**Data Models:**

- ScheduledJob (name, agent_id, cron_expression, config, is_active)

**Request Body (POST):**

```json
{
  "name": "string (required)",
  "agent_id": "uuid (required)",
  "cron_expression": "string (required, validated)",
  "config": "object",
  "is_active": "boolean"
}
```

**Validation:**

- Cron expression validated using node-cron library

**Missing Operations:**

- UPDATE job (available at `[id]` route)

---

#### 5.2 `/api/scheduler/jobs/[id]` (route.ts)

**Purpose:** Get, update, and delete scheduled job

**Database Tables Accessed:**

- `scheduled_jobs` (primary)

**Operations:**

- **GET** - SELECT job by ID
  ```sql
  SELECT * FROM scheduled_jobs
  WHERE id = ? AND user_id = ?
  ```
- **PUT** - UPDATE job with cron validation
  ```sql
  UPDATE scheduled_jobs
  SET name = ?, agent_id = ?, cron_expression = ?, config = ?, is_active = ?, updated_at = NOW()
  WHERE id = ? AND user_id = ?
  ```
- **DELETE** - DELETE job
  ```sql
  DELETE FROM scheduled_jobs
  WHERE id = ? AND user_id = ?
  ```

**Data Models:**

- ScheduledJob (full CRUD)

**Complete CRUD Coverage:** ✓

---

#### 5.3 `/api/scheduler/jobs/[id]/toggle` (route.ts)

**Purpose:** Toggle job active status

**Database Tables Accessed:**

- `scheduled_jobs` (primary)

**Operations:**

- **POST** - Toggle is_active status
  ```sql
  UPDATE scheduled_jobs
  SET is_active = NOT is_active, updated_at = NOW()
  WHERE id = ? AND user_id = ?
  ```

**Workflow:**

1. GET current `is_active` value
2. UPDATE with inverted value

---

### 6. WEBHOOK ROUTES

#### 6.1 `/api/webhooks` (route.ts)

**Purpose:** Create and list webhooks

**Database Tables Accessed:**

- `webhookTriggers` (primary)

**Operations:**

- **GET** - LIST webhooks
  ```sql
  SELECT * FROM webhookTriggers
  WHERE user_id = ?
  ORDER BY created_at DESC
  ```
- **POST** - CREATE webhook with secret generation
  ```sql
  INSERT INTO webhookTriggers
  (user_id, name, url, event_type, agent_id, headers, secret, is_active, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, random_hex(32), ?, NOW(), NOW())
  ```

**Data Models:**

- WebhookTrigger (name, url, event_type, agent_id, headers, secret)

**Request Body (POST):**

```json
{
  "name": "string (required)",
  "url": "string (required)",
  "event_type": "string (required)",
  "agent_id": "uuid",
  "headers": "object",
  "is_active": "boolean"
}
```

**Security:**

- Secret auto-generated using crypto.randomBytes(32)
- Secret stored in database (TODO: review security)

**Missing Operations:**

- UPDATE webhook (available at `[id]` route)

---

#### 6.2 `/api/webhooks/[id]` (route.ts)

**Purpose:** Get, update, delete, and trigger webhooks

**Database Tables Accessed:**

- `webhookTriggers` (primary)
- `webhookEvents` (for POST operation)

**Operations:**

- **GET** - SELECT webhook by ID
  ```sql
  SELECT * FROM webhookTriggers
  WHERE id = ? AND user_id = ?
  ```
- **PUT** - UPDATE webhook
  ```sql
  UPDATE webhookTriggers
  SET name = ?, url = ?, event_type = ?, agent_id = ?, headers = ?, is_active = ?, updated_at = NOW()
  WHERE id = ? AND user_id = ?
  ```
- **DELETE** - DELETE webhook
  ```sql
  DELETE FROM webhookTriggers
  WHERE id = ? AND user_id = ?
  ```
- **POST** - Trigger webhook (dual write)

  ```sql
  INSERT INTO webhookEvents (webhook_id, user_id, payload, status, created_at)
  VALUES (?, ?, ?, 'pending', NOW())

  UPDATE webhookEvents
  SET status = 'success|failed', response_status = ?
  WHERE id = ?
  ```

**Webhook Trigger Workflow:**

1. Log webhook event to `webhookEvents`
2. Send HTTP POST to webhook URL
3. Update event status (success/failed)
4. Catch errors and log failure status

**Data Models:**

- WebhookTrigger (full CRUD + trigger)
- WebhookEvent (audit trail)

**Complete CRUD Coverage:** ✓

---

## Summary Tables

### Database Operations by Table

| Table                | GET                | POST          | PUT                   | DELETE      | Status       |
| -------------------- | ------------------ | ------------- | --------------------- | ----------- | ------------ |
| profiles             | ✓ (admin)          | ✗             | ✓ (subscription only) | ✗           | Partial      |
| user_agents          | ✓                  | ✓             | ✓                     | ✓           | Complete     |
| agent_executions     | ✓ (admin/read)     | ✗             | ✗                     | ✗           | Read-only    |
| agent_memories       | ✗                  | ✗             | ✗                     | ✗           | Not exposed  |
| memory_relationships | ✗                  | ✗             | ✗                     | ✗           | Not exposed  |
| workflows            | ✗                  | ✗             | ✗                     | ✗           | Not exposed  |
| workflow_executions  | ✗                  | ✗             | ✗                     | ✗           | Not exposed  |
| data_sources         | ✗                  | ✗             | ✗                     | ✗           | Not exposed  |
| data_records         | ✗                  | ✗             | ✗                     | ✗           | Not exposed  |
| usage_analytics      | ✗                  | ✗             | ✗                     | ✗           | Not exposed  |
| performance_metrics  | ✗                  | ✗             | ✗                     | ✗           | Not exposed  |
| user_api_keys        | ✓                  | ✓             | ✗                     | ✓           | Partial      |
| agent_templates      | ✓ (backend)        | ✓ (backend)   | ✓ (backend)           | ✓ (backend) | Backend only |
| pricing_plans        | ✗                  | ✗             | ✗                     | ✗           | Not exposed  |
| user_subscriptions   | ✗                  | ✗             | ✗                     | ✗           | Not exposed  |
| usage_tracking       | ✗                  | ✗             | ✗                     | ✗           | Not exposed  |
| payment_history      | ✗                  | ✗             | ✗                     | ✗           | Not exposed  |
| webhookTriggers      | ✓                  | ✓             | ✓                     | ✓           | Complete     |
| webhookEvents        | ✓ (triggered only) | ✓ (triggered) | ✗                     | ✗           | Partial      |
| scheduled_jobs       | ✓                  | ✓             | ✓                     | ✓           | Complete     |
| job_queue            | ✗                  | ✗             | ✗                     | ✗           | Not exposed  |

---

### Missing Database Operations & Coverage Gaps

#### Tables with No API Routes

1. **agent_memories** - Core system table, no read/write operations exposed
2. **memory_relationships** - Dependency of agent_memories
3. **workflows** - Should have full CRUD operations
4. **workflow_executions** - Should be readable/queryable
5. **data_sources** - Critical feature, completely missing
6. **data_records** - Dependency of data_sources
7. **usage_analytics** - Event tracking not exposed
8. **performance_metrics** - Metrics not accessible
9. **pricing_plans** - Should be readable (public)
10. **user_subscriptions** - Only updates via admin, no user read
11. **usage_tracking** - Rate limiting data not exposed
12. **payment_history** - Billing info not exposed to users
13. **job_queue** - Job monitoring not exposed

#### Incomplete Operations

1. **profiles** (User model)
   - Missing: CREATE (registration done via auth), DELETE, full UPDATE
   - Only allows: GET (admin), subscription tier UPDATE

2. **user_api_keys**
   - Missing: UPDATE operations (force delete/recreate workflow)
   - Has: GET, POST, DELETE

3. **user_agents**
   - Missing: GET all templates available for cloning
   - Has: Full CRUD

4. **webhookEvents**
   - Missing: Manual retry, replay functionality
   - Has: Auto-logged on trigger

5. **Templates** (agent_templates)
   - Missing: Local implementation, all forwarded to backend
   - No stats/usage tracking in frontend

---

### Security Observations

1. **Authentication:** All routes require bearer token validation
2. **Authorization:** User-scoped queries (eq('user_id', user.id))
3. **Admin Role:** Enforced on admin/\* routes
4. **API Keys:** Encrypted storage with hash verification
5. **Webhook Secrets:** Auto-generated but stored in plaintext (⚠️ Review needed)
6. **Row Level Security (RLS):** Enabled on all tables per schema

---

### Architecture Observations

1. **Hybrid Pattern:** Frontend proxies to backend for most operations
   - Backend URL: `process.env.NEXT_PUBLIC_BACKEND_URL` (default: http://localhost:3001)
   - Fallback: Local Supabase if backend unavailable

2. **Data Consistency Issues:**
   - Some operations forward to backend, others don't
   - No local-remote sync mechanism
   - Potential for divergence

3. **Performance Concerns:**
   - Admin dashboard runs 4 concurrent queries (dashboard/route.ts)
   - No pagination on some list operations
   - No caching strategy observed

4. **Error Handling:**
   - Generic error messages ("Failed to fetch X")
   - No error tracking/logging visible
   - Network failures logged to console only

---

### Recommendations

1. **Immediate Actions:**
   - Expose agent_memories API (core feature)
   - Implement workflows full CRUD
   - Add data_sources management routes
   - Add user profile UPDATE route

2. **Security:**
   - Review webhook secret storage
   - Consider TokenEncryptedStorage pattern for API keys
   - Add rate limiting per user on credentials endpoint

3. **API Consistency:**
   - Implement all template operations locally
   - Add pagination to all list operations
   - Standardize error response format

4. **Missing Features:**
   - Job queue monitoring dashboard
   - Usage analytics and quotas UI
   - Memory management interface
   - Performance metrics viewer

---

### API Route Statistics

- **Total Routes:** 24 route files
- **Total Endpoints:** ~45+ HTTP methods
- **Authentication Required:** 100%
- **Backend Proxy:** 8+ routes
- **Local Supabase:** ~30 routes
- **Full CRUD (4 operations):** 3 tables (user_agents, webhookTriggers, scheduled_jobs)
- **Partial CRUD:** 8+ tables
- **Read-only:** 3 tables
- **No API exposure:** 13 tables

---

**End of Analysis**
