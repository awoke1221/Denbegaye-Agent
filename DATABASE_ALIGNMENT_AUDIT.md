# Database Alignment Audit Report

**Generated:** May 10, 2026  
**Status:** ⚠️ MISALIGNED - Multiple critical gaps identified

---

## Executive Summary

Your Supabase database schema contains **20 tables**, but the application only implements APIs for **7 tables** with partial coverage. **13 core tables have ZERO API exposure**, creating significant gaps in functionality.

### Critical Findings:

- ❌ **13 tables completely unexposed** (workflows, agent_memories, data_sources, etc.)
- ⚠️ **7 tables with partial CRUD** (read-only or missing operations)
- ✅ **3 tables with complete CRUD** (user_agents, webhookTriggers, scheduled_jobs)
- 🔧 **Backend workers** only handle execution, not data management
- 📦 **No TypeScript types** for most database tables
- 🔐 **No auth enforcement** on several backend endpoints

---

## Detailed Table Alignment

### 1. ✅ FULLY ALIGNED TABLES

#### **user_agents**

- **Status:** Complete ✓
- **API:** `/api/agents/[id]` (GET, POST, PUT, DELETE)
- **TypeScript Type:** ✓ `UserAgent` exists in `types/agent.ts`
- **Backend:** ✓ Implemented in Express
- **Missing:** None

#### **webhookTriggers & webhookEvents**

- **Status:** Complete ✓
- **API:** `/api/webhooks/[id]` (GET, POST, PUT, DELETE)
- **TypeScript Type:** Partial - Event types exist, trigger structure incomplete
- **Backend:** ✓ Implemented with Socket.io
- **Missing:** Rate limiting on webhook triggers

#### **user_api_keys**

- **Status:** Partial ✓
- **API:** `/api/credentials` (GET, POST, DELETE only)
- **TypeScript Type:** Missing
- **Backend:** ✓ Encryption/hashing implemented
- **Missing:** UPDATE endpoint, key rotation

---

### 2. ⚠️ PARTIALLY ALIGNED TABLES

#### **profiles**

- **DB Fields:** 12 columns (email, full_name, avatar_url, bio, timezone, preferences, subscription_tier, credits_remaining, role, etc.)
- **API Coverage:** READ ONLY (`/api/admin/users`)
- **Missing Operations:**
  - ❌ User profile UPDATE endpoint
  - ❌ Settings update endpoint
  - ❌ Preference management endpoint
- **TypeScript Type:** ❌ No type definition
- **Recommendation:** Create `/api/profile/[id]` with PUT/PATCH for self-service updates

#### **agent_templates**

- **DB Fields:** 10 columns (name, description, category, config, ui_schema, is_public, etc.)
- **API Coverage:** Read via backend proxy, admin CRUD via `/api/admin/templates`
- **Missing Operations:**
  - ❌ Public template search/discovery
  - ❌ User template creation
  - ❌ Template versioning endpoints
- **TypeScript Type:** Partial in store
- **Recommendation:** Add `/api/templates/[id]` for user templates

#### **agent_executions**

- **DB Fields:** 20 columns (status, input_data, output_data, tokens_used, cost_cents, etc.)
- **API Coverage:** READ ONLY (`/api/admin/executions`)
- **Missing Operations:**
  - ❌ User execution history endpoint
  - ❌ Execution retry endpoint
  - ❌ Execution cancellation
- **TypeScript Type:** ❌ No type definition
- **Recommendation:** Create `/api/agents/[id]/executions` for user-scoped access

#### **user_subscriptions**

- **DB Fields:** 10 columns (plan_id, stripe_subscription_id, status, billing_cycle, etc.)
- **API Coverage:** Admin only (`/api/admin/subscriptions`)
- **Missing Operations:**
  - ❌ User subscription status endpoint
  - ❌ Plan upgrade/downgrade endpoint
  - ❌ Billing history endpoint
- **TypeScript Type:** ❌ No type definition
- **Recommendation:** Create `/api/subscription/status`

---

### 3. ❌ COMPLETELY UNEXPOSED TABLES

#### **agent_memories**

- **DB Fields:** 8 columns (agent_id, user_id, content, embedding, metadata, memory_type, importance_score, access_count, etc.)
- **Current:** ⚠️ Table defined but ZERO API access
- **Use Case:** Store conversation history, facts, procedures
- **Action Required:**
  - Create TypeScript types
  - Implement `/api/agents/[id]/memories` (GET, POST, PUT, DELETE)
  - Add memory search endpoint with embedding support

#### **workflows**

- **DB Fields:** 10 columns (user_id, agent_id, name, definition, version, is_active, etc.)
- **Current:** ⚠️ Table defined but NOT EXPOSED to users
- **Use Case:** Store workflow definitions separate from agent configs
- **Action Required:**
  - Create TypeScript types
  - Implement `/api/workflows/[id]` (GET, POST, PUT, DELETE)
  - Sync with agent config structure

#### **data_sources**

- **DB Fields:** 9 columns (user_id, name, type, config, record_count, last_sync_at, etc.)
- **Current:** ⚠️ Completely unused
- **Use Case:** Manage integrations (email, CSV, API)
- **Action Required:**
  - Create TypeScript types
  - Implement `/api/data-sources/[id]` (GET, POST, PUT, DELETE)
  - Add data-records sub-endpoint

#### **data_records**

- **DB Fields:** 6 columns (data_source_id, external_id, data, metadata, status, etc.)
- **Current:** ⚠️ Dependent on data_sources, completely unused
- **Action Required:** Implement after data_sources

#### **usage_analytics**

- **DB Fields:** 9 columns (user_id, event_type, session_id, user_agent, ip_address, etc.)
- **Current:** ⚠️ Tracking table, no read API
- **Use Case:** Analytics for user behavior
- **Action Required:**
  - Create `/api/analytics` (GET only, user-scoped)
  - Add time-range filtering

#### **usage_tracking**

- **DB Fields:** 7 columns (user_id, metric_type, count, period_start, period_end, etc.)
- **Current:** ⚠️ Quota tracking, no user access
- **Use Case:** Show remaining credits/quotas
- **Action Required:**
  - Create `/api/usage/quotas` (GET only)
  - Show agent_creations, executions, api_calls, storage_mb limits

#### **performance_metrics**

- **DB Fields:** 7 columns (user_id, agent_id, metric_type, value, unit, etc.)
- **Current:** ⚠️ Metrics table, no read API
- **Use Case:** Track execution performance
- **Action Required:**
  - Create `/api/agents/[id]/metrics` (GET only)

#### **payment_history**

- **DB Fields:** 10 columns (user_id, subscription_id, stripe_payment_intent_id, amount, status, etc.)
- **Current:** ⚠️ Payments tracked but no user API
- **Use Case:** Invoice/receipt history
- **Action Required:**
  - Create `/api/billing/history` (GET only, user-scoped)

#### **pricing_plans**

- **DB Fields:** 10 columns (name, tier, price*monthly, price_yearly, features, limits, stripe_price_id*\*, etc.)
- **Current:** ⚠️ Defined but no public API
- **Use Case:** Show plan options on pricing page
- **Action Required:**
  - Create `/api/plans` (GET only, public)

#### **job_queue**

- **DB Fields:** 15 columns (job_type, payload, status, priority, max_attempts, etc.)
- **Current:** ⚠️ Queue defined but no admin API
- **Use Case:** Task queue management
- **Action Required:**
  - Create `/api/admin/jobs/[id]` (GET, DELETE for failed jobs)

#### **memory_relationships**

- **DB Fields:** 5 columns (source_memory_id, target_memory_id, relationship_type, strength, etc.)
- **Current:** ⚠️ Depends on agent_memories, unexposed
- **Action Required:** Implement after agent_memories

#### **performance_metrics**

- **DB Fields:** 7 columns (user_id, agent_id, metric_type, value, unit, etc.)
- **Current:** ⚠️ Metrics table, no read API
- **Action Required:** Implement metrics dashboard

---

## Type Definition Gaps

### Missing TypeScript Types

```typescript
// ❌ Not defined:
-AgentExecution -
  AgentMemory -
  Workflow -
  DataSource -
  DataRecord -
  UsageAnalytics -
  UsageTracking -
  PerformanceMetric -
  PaymentRecord -
  PricingPlan -
  JobQueueItem -
  MemoryRelationship -
  UserSubscription -
  WebhookTrigger -
  WebhookEvent;
```

### Type Definition Locations

- **Current:** `types/agent.ts` (only agent-related)
- **Recommendation:** Split into:
  - `types/database.ts` - All table types (auto-generated)
  - `types/api.ts` - Request/response types
  - `types/domain.ts` - Business logic types

---

## API Route Gaps

### Routes That Should Exist

```typescript
// CRITICAL (missing entirely)
[POST] /
  api /
  agents /
  [id] /
  executions[GET] / // Execute agent
  api /
  agents /
  [id] /
  executions[GET] / // Get execution history
  api /
  agents /
  [id] /
  memories[POST] / // Get agent memories
  api /
  agents /
  [id] /
  memories[GET] / // Add memory
  api /
  workflows /
  [id][GET] / // Manage workflows
  api /
  data -
  sources /
    [id][GET] / // Manage data sources
    api /
    profile[PATCH] / // Get current user profile
    api /
    profile[GET] / // Update profile
    api /
    subscription /
    status[GET] / // Check subscription
    api /
    usage /
    quotas[GET] / // Check remaining credits
    api /
    billing /
    // IMPORTANT (missing but less critical)
    history[GET] / // Payment history
    api /
    analytics[GET] / // Usage analytics
    api /
    agents /
    [id] /
    metrics[DELETE] / // Execution metrics
    api /
    admin /
    jobs /
    [id][GET] / // Cancel/retry jobs
    api /
    plans; // Public pricing plans
```

---

## Backend Issues

### Server.js Gaps

1. **No database persistence** - Executions stored in-memory only

   ```typescript
   // Current:
   const executions = new Map();  // ❌ Lost on restart

   // Should be:
   await supabaseAdmin.from('agent_executions').insert({...});
   ```

2. **No transaction support** - Multi-step operations could fail mid-way
3. **No queue system** - Using in-memory Map instead of job_queue table
4. **No rate limiting** - No enforcement of per-user quotas
5. **Missing error tracking** - Should write to performance_metrics
6. **No memory management** - agent_memories never used

### Missing Backend Features

- ❌ Memory relationship tracking
- ❌ Usage quota enforcement
- ❌ Cost calculation and billing
- ❌ Data source sync scheduling
- ❌ Performance metric collection
- ❌ Payment webhook handling

---

## Environment & Config Issues

### Current Configuration

```typescript
// Backend connects to Supabase
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

// But no configuration for:
- Job queue preferences (Inngest vs Upstash vs Temporal)
- Stripe integration
- Email provider settings
- Rate limits per tier
```

---

## Recommended Action Plan

### Phase 1: Foundation (Week 1)

1. **Create TypeScript types** for all 20 tables
   - Auto-generate from Supabase schema if possible
   - Add to `types/database.ts`

2. **Create database service layer**
   - `lib/database/profiles.ts`
   - `lib/database/executions.ts`
   - `lib/database/memories.ts`
   - `lib/database/workflows.ts`
   - etc.

3. **Add missing core API routes** (Priority order):
   - `/api/profile` (GET, PATCH)
   - `/api/agents/[id]/executions` (GET, POST)
   - `/api/usage/quotas` (GET)

### Phase 2: Memory & Workflows (Week 2)

4. **Implement agent memories**
   - `/api/agents/[id]/memories` (GET, POST, DELETE)
   - Add embedding support for search

5. **Implement workflows**
   - `/api/workflows/[id]` (GET, POST, PUT, DELETE)
   - Sync with agent configs

### Phase 3: Data Management (Week 3)

6. **Implement data sources**
   - `/api/data-sources/[id]` (GET, POST, PUT, DELETE)
   - `/api/data-sources/[id]/records` (GET, POST)

7. **Implement analytics**
   - `/api/analytics` (GET with filtering)
   - `/api/billing/history` (GET)

### Phase 4: Backend Sync (Week 4)

8. **Update backend to use Supabase**
   - Persist executions to database
   - Track performance metrics
   - Update usage quotas

9. **Add queue persistence**
   - Use job_queue table instead of in-memory Map
   - Add retry logic

### Phase 5: Billing & Quotas (Week 5)

10. **Implement cost tracking**
    - Calculate tokens_used and cost_cents
    - Update credits_remaining in profiles
    - Write to usage_tracking

---

## Quick Wins (High Priority, Low Effort)

1. ✅ Create `/api/profile` (GET, PATCH) - **2 hours**
   - Just read/update profiles table
2. ✅ Create user-scoped `/api/agents/[id]/executions` (GET) - **2 hours**
   - Filter agent_executions by user_id
3. ✅ Create `/api/usage/quotas` (GET) - **1 hour**
   - Read usage_tracking and credits from profiles

4. ✅ Export database types - **1 hour**
   - Create `types/database.ts` with all 20 tables

5. ✅ Add webhookTrigger & webhookEvent types - **1 hour**
   - Move existing partial types to unified location

---

## Risks & Constraints

### Data Integrity

- ❌ Executions not persisted (restart = data loss)
- ⚠️ No transaction support across services
- ⚠️ Backend service role key exposed if .env leaked

### Performance

- ⚠️ agent_memories without embedding index = slow search
- ⚠️ No pagination on analytics queries
- ⚠️ No caching for pricing_plans

### Security

- ⚠️ Webhook secrets stored in plaintext (should be hashed)
- ⚠️ User can execute any agent they own (no tier limits enforced)
- ⚠️ No audit logging for admin actions

---

## Files to Update

1. **New Files to Create**

   ```
   types/database.ts           (all table types)
   types/api.ts                (request/response)
   lib/database/profiles.ts    (profile service)
   lib/database/executions.ts  (execution service)
   lib/database/memories.ts    (memory service)
   lib/database/workflows.ts   (workflow service)
   app/api/profile/route.ts
   app/api/usage/quotas/route.ts
   app/api/agents/[id]/executions/route.ts
   app/api/agents/[id]/memories/route.ts
   app/api/workflows/route.ts
   app/api/data-sources/route.ts
   app/api/billing/history/route.ts
   app/api/analytics/route.ts
   ```

2. **Files to Update**
   ```
   app/api/agents/[id]/route.ts      (add workflow support)
   app/api/admin/executions/route.ts (support filtering)
   lib/supabaseClient.ts             (no changes needed)
   server.js                         (persist to Supabase)
   ```

---

## Summary Table

| Table                | DB ✓ | API        | Type | Priority  |
| -------------------- | ---- | ---------- | ---- | --------- |
| profiles             | ✓    | ⚠️ Partial | ❌   | 🔴 High   |
| user_agents          | ✓    | ✅ Full    | ✅   | ✅ Done   |
| user_subscriptions   | ✓    | ❌ None    | ❌   | 🟠 Medium |
| agent_executions     | ✓    | ⚠️ Admin   | ❌   | 🔴 High   |
| agent_memories       | ✓    | ❌ None    | ❌   | 🔴 High   |
| workflows            | ✓    | ❌ None    | ❌   | 🔴 High   |
| user_api_keys        | ✓    | ⚠️ Partial | ❌   | 🟠 Medium |
| agent_templates      | ✓    | ⚠️ Admin   | ⚠️   | 🟠 Medium |
| webhooktriggers      | ✓    | ✅ Full    | ⚠️   | ✅ Done   |
| webhookevents        | ✓    | ✅ Full    | ⚠️   | ✅ Done   |
| data_sources         | ✓    | ❌ None    | ❌   | 🟠 Medium |
| data_records         | ✓    | ❌ None    | ❌   | 🟠 Medium |
| usage_analytics      | ✓    | ❌ None    | ❌   | 🟠 Medium |
| usage_tracking       | ✓    | ❌ None    | ❌   | 🔴 High   |
| performance_metrics  | ✓    | ❌ None    | ❌   | 🟠 Medium |
| payment_history      | ✓    | ❌ None    | ❌   | 🟠 Medium |
| pricing_plans        | ✓    | ❌ None    | ❌   | 🟠 Medium |
| job_queue            | ✓    | ❌ None    | ❌   | 🟠 Medium |
| memory_relationships | ✓    | ❌ None    | ❌   | 🟠 Medium |

---

**Next Step:** Review this audit and approve the action plan to proceed with implementation.
