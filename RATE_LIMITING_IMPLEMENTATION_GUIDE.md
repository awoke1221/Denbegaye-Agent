# Subscription-Based Rate Limiting Implementation Guide

## Overview

This document outlines the complete implementation of subscription-based rate limiting for Denbegaye Agent. The system enforces different rate limits based on user subscription tiers (Free, Pro, Enterprise) and allows admins to customize limits per user.

## Architecture

### 1. Backend Rate Limiting System (`server.js`)

#### Default Tier Limits

```javascript
FREE: {
  requests_per_minute: 10,
  requests_per_hour: 100,
  requests_per_day: 500,
  agents_limit: 5,
  executions_per_month: 100,
  api_calls_per_month: 1000,
  storage_mb: 1024
}

PRO: {
  requests_per_minute: 100,
  requests_per_hour: 1000,
  requests_per_day: 10000,
  agents_limit: 999,
  executions_per_month: 10000,
  api_calls_per_month: 100000,
  storage_mb: 102400
}

ENTERPRISE: {
  requests_per_minute: 1000,
  requests_per_hour: 10000,
  requests_per_day: 100000,
  agents_limit: 99999,
  executions_per_month: 999999,
  api_calls_per_month: 9999999,
  storage_mb: 1048576
}
```

#### Core Functions

**`getUserSubscriptionLimits(userId)`**

- Fetches user's subscription tier from `user_subscriptions` table
- Checks for custom overrides in memory store
- Returns limits with tier info

**`subscriptionRateLimiter()`**

- Express middleware that:
  1. Extracts user from JWT token
  2. Fetches subscription limits
  3. Increments usage counters for minute/hour/day windows
  4. Enforces limits by returning 429 errors
  5. Attaches usage info to request object
  6. Sends rate limit headers to client

**`incrementUsageCounter(userId, window, metricType)`**

- Uses Redis if available, falls back to in-memory store
- Sets TTL based on window type
- Returns current count

#### Custom Limits

Custom limits are stored in `customUserLimits` Map (in-memory) and can be made persistent by writing to database:

```javascript
customUserLimits.set(userId, {
  tier: 'custom',
  limits: {
    /* custom limits */
  },
  setBy: 'admin',
  setAt: new Date().toISOString(),
});
```

### 2. Admin API Endpoints

#### GET `/api/admin/subscriptions/users`

- Lists all users with subscription and usage data
- Supports pagination, tier filtering, email search
- Returns usage across minute/hour/day windows

```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "tier": "pro",
      "limits": {
        /* tier limits */
      },
      "customLimits": null,
      "usage": { "minute": 5, "hour": 45, "day": 320 }
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 250, "pages": 5 }
}
```

#### GET `/api/admin/subscriptions/:userId/limits`

- Returns current rate limits for specific user
- Shows tier defaults and any custom overrides

#### PUT `/api/admin/subscriptions/:userId/limits`

- Sets custom rate limits for a user
- Request body contains custom limit values
- Response: `{ success: true, customLimits: { ... } }`

#### DELETE `/api/admin/subscriptions/:userId/limits`

- Resets user to tier defaults
- Removes custom override

#### GET `/api/admin/rate-limit-tiers`

- Returns all available tier limit templates

### 3. User API Endpoints

#### GET `/api/user/usage`

- Returns current user's usage and limits
- Includes remaining quota and percentage used
- Auto-updating for warnings

```json
{
  "userId": "uuid",
  "tier": "free",
  "limits": {
    /* tier limits */
  },
  "usage": { "minute": 8, "hour": 87, "day": 450 },
  "remaining": { "minute": 2, "hour": 13, "day": 50 },
  "percentageUsed": { "minute": 80, "hour": 87, "day": 90 }
}
```

## Frontend Components

### 1. Admin: Rate Limiting Management Tab

**File:** `app/admin/components/RateLimitingManagement.tsx`

Features:

- Display all users with subscription tiers
- Show real-time usage bars (minute/hour/day)
- Indicator for custom vs. default limits
- Edit/reset rate limits per user
- Summary cards (total users, tier breakdown)
- Search and filter by tier

**Key Functions:**

- `fetchUsersWithSubscriptions()` - Get user data from admin endpoint
- `handleOpenRateLimitDialog()` - Open editor
- `handleSaveRateLimits()` - Save custom limits via PUT
- `handleResetRateLimits()` - Remove custom override via DELETE

### 2. User: Rate Limit Warnings Component

**File:** `components/RateLimitWarnings.tsx`

Features:

- Display current tier (Free/Pro/Enterprise)
- Show usage for minute/hour/day windows with progress bars
- Color-coded warnings (green <50%, yellow 50-80%, red >80%)
- Alerts when approaching limits
- Upgrade suggestion when usage high on free tier
- Auto-refresh every 30 seconds

### 3. Admin Page Integration

**File:** `app/admin/page.tsx`

Changes:

- Added `RateLimitingManagement` import
- Added "Rate Limits" tab to admin dashboard
- Changed grid layout to accommodate 8 tabs

## Rate Limiting Flow

### Request Processing

```
1. Request arrives at /api/...
2. verifyToken middleware extracts user
3. subscriptionRateLimiter middleware:
   a. Gets subscription limits (tier or custom)
   b. Increments minute/hour/day counters
   c. Checks against limits
   d. If exceeded, returns 429 error
   e. Otherwise, continues to route handler
4. Route handler processes request
5. Response includes X-RateLimit-* headers
```

### Usage Counter Windows

- **Minute**: Resets every 60 seconds
- **Hour**: Resets every 3600 seconds
- **Day**: Resets every 86400 seconds
- Each window is tracked independently

### Error Responses

When limit exceeded:

```json
{
  "error": "Rate limit exceeded",
  "message": "Minute limit exceeded: 11/10",
  "retryAfter": 60,
  "limitType": "minute",
  "current": 11,
  "limit": 10
}
```

## Configuration

### Environment Variables

```env
# Backend rate limiting
RATE_LIMIT_MAX=60  # Default requests per minute
REDIS_URL=redis://...  # Optional Redis for distributed systems
```

### Customization

To change tier limits, edit `DEFAULT_TIER_LIMITS` in `server.js`:

```javascript
const DEFAULT_TIER_LIMITS = {
  free: {
    /* modify here */
  },
  pro: {
    /* modify here */
  },
  enterprise: {
    /* modify here */
  },
};
```

## Usage Statistics

The system tracks usage through:

1. **Redis** (if configured): Distributed counter storage
2. **In-Memory Map** (fallback): Single-server counter storage
3. **Supabase** (future): Persistent usage analytics

Each metric is stored with a TTL matching the window duration.

## Admin Operations

### Viewing User Subscriptions

1. Navigate to Admin > Rate Limits tab
2. See all users with their current tier
3. View usage bars for minute/hour/day limits
4. See "Custom" or "Default" badge

### Modifying User Rate Limits

1. Click "Edit Limits" in user actions
2. Dialog opens with current limits (tier defaults or custom)
3. Modify any values
4. Click "Save Limits"
5. User immediately subject to new limits

### Resetting to Tier Defaults

1. User with custom limits shows "Reset to Tier Default" option
2. Click to remove custom override
3. User reverts to tier defaults

## Monitoring & Debugging

### Backend Logs

Rate limiting events are logged via Winston:

```
Rate limit exceeded for user_id: 15 requests (15 > 10 per minute)
Rate limits updated for user_id: Free tier → Custom limits
Custom rate limits removed for user_id: reverting to tier defaults
```

### Response Headers

All API responses include rate limit headers:

```
X-RateLimit-Limit-Minute: 10
X-RateLimit-Remaining-Minute: 2
X-RateLimit-Limit-Hour: 100
X-RateLimit-Remaining-Hour: 45
```

## Integration Points

### With Existing Systems

1. **Auth**: Uses JWT from `verifyToken` middleware
2. **Subscriptions**: Reads from `user_subscriptions` + `pricing_plans`
3. **Admin Dashboard**: New tab alongside Users, Agents, etc.
4. **User Profile**: Can display warnings component

### With Third-Party Services

1. **Redis**: Optional for distributed rate limit tracking
2. **Supabase**: Reads subscription tier, writes to usage_tracking (future)

## Testing Scenarios

### Scenario 1: Free User Approaching Limits

1. Free user makes 9 requests in one minute
2. Next request returns warning in headers
3. Frontend shows yellow progress bar (80% used)
4. Admin dashboard shows "9/10" with yellow indicator

### Scenario 2: Admin Sets Custom Limits

1. Admin views rate limits tab
2. Finds free user "john@example.com"
3. Clicks "Edit Limits"
4. Changes requests_per_minute from 10 → 50
5. Saves custom limits
6. User's next request now allows up to 50/minute

### Scenario 3: Rate Limit Exceeded

1. Free user makes 10 requests in 60 seconds
2. 11th request returns 429 error
3. Error message: "Minute limit exceeded: 11/10"
4. retryAfter: 60 (seconds)
5. User waits for minute window to reset
6. Counter resets at 60-second mark

## Performance Considerations

### Redis vs. In-Memory

**Redis** (production recommended):

- Distributed across multiple servers
- Survives restarts
- Higher latency (~1-5ms per operation)

**In-Memory** (development):

- Fast local storage
- Lost on restart
- Single-server only

### Optimization Tips

1. Cache subscription limits for 5 minutes
2. Use Redis pipelines for batch limit updates
3. Monitor counter accuracy under high load
4. Implement circuit breaker if rate limiter fails

## Migration from Old System

The old basic rate limiter (`rateLimiter`) is preserved for non-authenticated endpoints.

Authenticated endpoints use the new subscription-aware middleware:

```javascript
// Old (basic, per IP)
app.use('/api', rateLimiter({ windowSeconds: 60, maxRequests: 60 }));

// New (per user, subscription-based)
app.use('/api/*', [verifyToken, subscriptionRateLimiter()]);
```

## Future Enhancements

1. **Database-backed counters**: Write usage to `usage_tracking` table
2. **API key rate limiting**: Separate limits for API key vs. user
3. **Dynamic limits**: Adjust based on user payment status
4. **Burst allowance**: Allow temporary exceeding with cooldown
5. **Rate limit delegation**: Pass limits to external services (Inngest)
6. **Analytics dashboard**: Graph usage trends over time

## Troubleshooting

### Issue: All requests return 429

- Check Redis connection
- Verify user subscription exists
- Check if custom limits are too low
- Review backend logs for errors

### Issue: Rate limits not updating

- Confirm Redis TTL is correct
- Check if in-memory store is being used (development)
- Verify subscription tier is set correctly

### Issue: Custom limits not applying

- Confirm limit save API returned success
- Check that user ID is correct
- Verify backend restarted (if using in-memory)
- Look for admin operation logs

## Support & Maintenance

- Monitor Redis memory usage
- Regularly export usage statistics
- Review rate limit adjustments for tier mismatches
- Update tier limits based on usage patterns
