# Verification & Deployment Guide

**Status:** ✅ Ready for verification  
**Date:** May 10, 2026

---

## 📋 Complete File Manifest

### New Files Created

```
✅ types/database.ts
   - 20 TypeScript interfaces for all Supabase tables
   - Utility types for API responses
   - Aggregate types for complex queries
   - ~500 lines, fully documented

✅ app/api/profile/route.ts
   - GET: Fetch user profile
   - PATCH: Update user settings
   - ~100 lines with full validation

✅ app/api/agents/[id]/executions/route.ts
   - GET: List execution history with filtering
   - POST: Trigger agent execution
   - Idempotency key support for deduplication
   - ~200 lines with comprehensive error handling

✅ app/api/agents/[id]/memories/route.ts
   - GET: List memories with search & filtering
   - POST: Create new memory
   - Memory type classification (conversation/fact/procedure/context)
   - Importance scoring
   - ~200 lines

✅ app/api/workflows/route.ts
   - GET: List user workflows
   - POST: Create new workflow
   - Agent association support
   - Tag management
   - ~150 lines

✅ app/api/data-sources/route.ts
   - GET: List data sources
   - POST: Create new data source
   - Type validation (email_list/phone_list/csv_upload/api_integration)
   - Record counting
   - ~150 lines

✅ app/api/usage/quotas/route.ts
   - GET: Check remaining quotas
   - Per-tier limit enforcement
   - Period tracking with auto-reset
   - Credit balance display
   - ~250 lines with quota logic

✅ app/api/analytics/route.ts
   - GET: User event analytics
   - Event type aggregation
   - Date range filtering
   - Performance metrics helper
   - ~200 lines

✅ app/api/billing/history/route.ts
   - GET: Payment & billing history
   - Status filtering
   - Total spending calculation
   - Transaction summary
   - ~150 lines

✅ DATABASE_ALIGNMENT_AUDIT.md
   - Comprehensive gap analysis
   - Before/after comparison
   - Table-by-table breakdown
   - Security audit
   - Roadmap with priorities
   - ~2,000 lines

✅ API_INTEGRATION_GUIDE.md
   - Complete API reference
   - Request/response examples
   - Query parameters documentation
   - Error codes and handling
   - TypeScript usage examples
   - Webhook documentation
   - ~2,500 lines

✅ DATABASE_AND_API_ALIGNMENT_SUMMARY.md
   - High-level overview
   - Results and metrics
   - Technical implementation details
   - Testing strategy
   - Deployment checklist
   - ~1,500 lines
```

---

## 🧪 Testing Checklist

### Unit Tests (Test Each Endpoint)

```bash
# Test 1: Profile endpoint
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

Expected: 200 OK with profile data

# Test 2: Invalid token
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer invalid_token"

Expected: 401 Unauthorized

# Test 3: Create execution
curl -X POST http://localhost:3000/api/agents/AGENT_ID/executions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input_data":{"query":"test"}}'

Expected: 201 Created with execution record

# Test 4: Check quotas
curl -X GET http://localhost:3000/api/usage/quotas \
  -H "Authorization: Bearer YOUR_TOKEN"

Expected: 200 OK with quota usage

# Test 5: List executions with filter
curl -X GET "http://localhost:3000/api/agents/AGENT_ID/executions?status=completed&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

Expected: 200 OK with filtered list
```

### Integration Tests

```typescript
// Verify user isolation
1. Create agent as User A
2. Try to access as User B using admin token
3. Confirm User B cannot access User A's agent
4. Verify only User A can see it

// Verify quota system
1. Create agent (counts toward quota)
2. Execute agent (counts toward quota)
3. Call /api/usage/quotas
4. Confirm usage incremented

// Verify pagination
1. Create 50+ agents
2. Call with limit=10
3. Verify exactly 10 returned
4. Call with offset=10
5. Verify different 10 items returned
```

### Security Tests

```bash
# Test 1: SQL Injection attempt
curl -X GET "http://localhost:3000/api/agents?agent_id='; DROP TABLE agents; --" \
  -H "Authorization: Bearer YOUR_TOKEN"

Expected: No SQL execution, validation error

# Test 2: Cross-user access
1. Get User A's agent ID
2. As User B, try to access it
3. Confirm 404 or empty result

# Test 3: Privilege escalation
1. As regular user, try to call /api/admin/jobs
2. Confirm access denied
```

---

## ✅ Code Review Checklist

When reviewing files, verify:

### All Route Files (`app/api/*/route.ts`)

- [ ] Bearer token verification in getAuthToken()
- [ ] User verification in verifyUser()
- [ ] User-scoped queries (WHERE user_id = user.id)
- [ ] Proper HTTP status codes (200, 201, 400, 401, 404, 500)
- [ ] Consistent error response format
- [ ] JSDoc comments for endpoints
- [ ] Input validation (required fields, types)
- [ ] Pagination for list endpoints (limit, offset)
- [ ] Try/catch error handling
- [ ] No console.log in production (use proper logging)

### Type Definition File (`types/database.ts`)

- [ ] All 20 tables represented as interfaces
- [ ] Optional fields marked with ?
- [ ] Default values documented
- [ ] Foreign key relationships noted in comments
- [ ] CHECK constraints documented
- [ ] UNIQUE constraints documented
- [ ] Enum values listed
- [ ] No circular dependencies
- [ ] Utility types provided (Response, Error, Pagination)

### Documentation Files

- [ ] All endpoints listed
- [ ] Request/response examples included
- [ ] Query parameters documented
- [ ] Error codes explained
- [ ] Authentication method clear
- [ ] Rate limiting mentioned
- [ ] Examples are copy-paste ready
- [ ] No outdated information

---

## 🚀 Deployment Steps

### Pre-Deployment

1. **Run TypeScript compiler**

   ```bash
   tsc --noEmit
   ```

   Expected: No errors

2. **Run linter**

   ```bash
   next lint
   ```

   Expected: No errors or warnings

3. **Test build**
   ```bash
   next build
   ```
   Expected: Build completes successfully

### Staging Deployment

1. Deploy to staging environment
2. Run full test suite
3. Load test at 2x expected traffic
4. Verify database backups work
5. Test authentication flow
6. Monitor error rates

### Production Deployment

1. **Backup database**

   ```bash
   supabase db backup create
   ```

2. **Deploy to production**

   ```bash
   vercel deploy --prod
   ```

3. **Monitor metrics**
   - Response times
   - Error rates
   - CPU/memory usage
   - Database connections

4. **Verify endpoints**
   - Run test suite against production
   - Spot-check a few endpoints manually

---

## 📊 Performance Targets

### API Response Times

| Endpoint        | Expected | Max    |
| --------------- | -------- | ------ |
| GET profile     | 50ms     | 200ms  |
| GET agents list | 100ms    | 500ms  |
| POST agent      | 150ms    | 500ms  |
| GET executions  | 100ms    | 500ms  |
| POST execution  | 200ms    | 1000ms |
| GET quotas      | 75ms     | 300ms  |

### Database Targets

| Operation            | Expected | Max   |
| -------------------- | -------- | ----- |
| User verification    | 10ms     | 50ms  |
| User isolation check | 5ms      | 25ms  |
| List with count      | 75ms     | 300ms |
| Write operation      | 50ms     | 200ms |

---

## 🔍 Monitoring & Debugging

### Enable Debug Logging

```typescript
// Add to route handlers
if (process.env.DEBUG) {
  console.log(`[${new Date().toISOString()}] ${method} ${endpoint}`);
  console.log('User:', user);
  console.log('Params:', params);
  console.log('Response:', data);
}
```

### Monitor Key Metrics

```typescript
// Track slow requests
const start = Date.now();
// ... operation ...
const duration = Date.now() - start;
if (duration > 500) {
  console.warn(`Slow ${endpoint}: ${duration}ms`);
}

// Track errors
try {
  // ... operation ...
} catch (error) {
  captureException(error, {
    context: { endpoint, method, user_id },
    extra: { request: params, response: data },
  });
}
```

---

## 📝 Documentation Updates Needed

After deployment, update:

1. **README.md** - Link to API guide
2. **Developer Docs** - Usage examples
3. **Architecture Diagram** - Show API layer
4. **Postman Collection** - Import all endpoints
5. **OpenAPI Spec** (optional) - Auto-generate from code

---

## 🎓 Developer Training

New developers should review:

1. **Read files in this order:**
   - [ ] DATABASE_ALIGNMENT_AUDIT.md (understand the scope)
   - [ ] types/database.ts (see what data we have)
   - [ ] API_INTEGRATION_GUIDE.md (understand endpoints)
   - [ ] One app/api/\*/route.ts file (see implementation pattern)

2. **Key concepts to understand:**
   - [ ] User isolation via user_id filtering
   - [ ] Bearer token authentication
   - [ ] Pagination pattern (limit/offset)
   - [ ] Error response format
   - [ ] Type safety with TypeScript

3. **Common tasks:**
   - [ ] Add new endpoint (copy existing route file)
   - [ ] Add new field to type (edit types/database.ts)
   - [ ] Test endpoint (use curl commands above)

---

## 🚨 Troubleshooting

### Problem: "Unauthorized" on all endpoints

**Solution:**

1. Verify token format: `Bearer <jwt>`
2. Check token is from same Supabase project
3. Verify NEXT_PUBLIC_SUPABASE_URL is correct
4. Check token hasn't expired

### Problem: 404 on agent endpoints

**Solution:**

1. Verify agent_id is valid UUID format
2. Confirm agent exists in database
3. Confirm you own the agent (user_id matches)
4. Check query syntax if filtering

### Problem: Quota exceeded immediately

**Solution:**

1. Check user subscription tier
2. Verify period_start/period_end are correct
3. Check usage_tracking records
4. Confirm calculation is correct

### Problem: Slow response times

**Solution:**

1. Check database indexes exist
2. Monitor active connections
3. Check for N+1 query problems
4. Consider adding caching

---

## 📞 Support Contacts

**Questions about:**

- API design → Review API_INTEGRATION_GUIDE.md
- Database schema → Review DATABASE_ALIGNMENT_AUDIT.md
- Type definitions → Review types/database.ts
- Implementation → Review specific route file

---

## 🎉 Success Criteria

✅ Deployment is successful when:

- [ ] All 8 route files load without errors
- [ ] Bearer token validation works
- [ ] User isolation is enforced
- [ ] Pagination works correctly
- [ ] Error responses follow standard format
- [ ] Database queries complete in <500ms
- [ ] All tests pass
- [ ] Documentation is accessible
- [ ] No security issues in audit
- [ ] Load test passes at 2x expected traffic

---

**Next:** Run `npm run build` and verify all files compile successfully.

---

_Created: May 10, 2026_  
_Version: 1.0.0_  
_Status: Ready for Verification_
