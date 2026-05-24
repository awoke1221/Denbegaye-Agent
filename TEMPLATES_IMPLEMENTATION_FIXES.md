# Templates System - Implementation Fixes & Code Solutions

**Priority**: Apply immediately before production
**Estimated Time**: 8-10 hours for all critical fixes

---

## Fix 1: JWT Signature Verification

**Severity**: 🔴 CRITICAL
**Time**: 1-2 hours
**Impact**: Security

### Current Code (UNSAFE)

```javascript
// server.js - verifyToken middleware
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.decode(token); // ❌ NO VERIFICATION!
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role || 'user',
    };
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ error: 'Token verification failed' });
  }
};
```

### Fixed Code

```javascript
// server.js - verifyToken middleware (FIXED)
const jwt = require('jsonwebtoken');

// Get Supabase JWT secret from environment
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!JWT_SECRET) {
  console.error('CRITICAL: SUPABASE_JWT_SECRET not set in environment');
  process.exit(1);
}

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  try {
    // ✅ VERIFY signature using Supabase secret
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'], // Supabase uses HS256
    });

    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role || 'user',
    };
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.status(401).json({ error: 'Token verification failed' });
  }
};
```

### Environment Configuration

**Add to `.env`**:

```env
# Get this from Supabase Dashboard > Settings > JWT Secret
SUPABASE_JWT_SECRET=your_secret_here_from_supabase
```

### Testing

```bash
# Test with valid token
curl -H "Authorization: Bearer your_valid_token" http://localhost:3001/api/admin/dashboard

# Test with invalid token
curl -H "Authorization: Bearer invalid_token" http://localhost:3001/api/admin/dashboard
# Expected: 401 Invalid token
```

---

## Fix 2: Email Credentials - Migrate to OAuth

**Severity**: 🔴 CRITICAL
**Time**: 3-4 hours
**Impact**: Security, removes password exposure

### Current Code (UNSAFE)

```javascript
// server.js - trigger-email handler
"trigger-email": async (node, inputData) => {
  const Imap = require("imap");

  const email = node.config.email || inputData.email;
  const password = node.config.password || inputData.password;  // ❌ PASSWORD!
  const host = node.config.host || "imap.gmail.com";

  const imap = new Imap({ user: email, password, host, port: 993, tls: true });
  // ... rest of implementation
}
```

### Fixed Code - Using Gmail API

```javascript
// server.js - trigger-email handler (FIXED with OAuth)
const { google } = require('googleapis');

// Helper function to get Gmail OAuth client
const getGmailClient = async (userId, refreshToken) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  // Refresh token if needed
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    return oauth2Client;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw new Error('Gmail authentication expired. Please re-authorize.');
  }
};

"trigger-email": async (node, inputData, apiKeys) => {
  try {
    // ✅ Get OAuth client instead of password
    const refreshToken = node.config.refreshToken;  // Stored securely in DB
    if (!refreshToken) {
      throw new Error('Gmail OAuth not configured');
    }

    const oauth2Client = await getGmailClient(node.userId, refreshToken);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get unread messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 10,
    });

    const messages = response.data.messages || [];

    if (messages.length === 0) {
      return {
        triggered: false,
        source: 'email',
        emails: [],
        count: 0,
      };
    }

    // Get message details
    const messageDetails = await Promise.all(
      messages.map(msg =>
        gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        })
      )
    );

    const emailData = messageDetails.map(detail => {
      const headers = detail.data.payload.headers;
      const getHeader = (name) => headers.find(h => h.name === name)?.value;

      return {
        id: detail.data.id,
        threadId: detail.data.threadId,
        subject: getHeader('Subject'),
        from: getHeader('From'),
        to: getHeader('To'),
        date: getHeader('Date'),
        snippet: detail.data.snippet,
      };
    });

    return {
      triggered: true,
      source: 'email',
      emails: emailData,
      count: emailData.length,
    };
  } catch (error) {
    console.error('Email trigger error:', error.message);
    return {
      triggered: false,
      source: 'email',
      error: error.message,
    };
  }
}
```

### Database Schema for OAuth Tokens

```sql
-- Add to Supabase
CREATE TABLE oauth_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,  -- 'gmail', 'outlook', etc.
  access_token TEXT ENCRYPTED,     -- Encrypted at rest
  refresh_token TEXT ENCRYPTED,    -- Encrypted at rest
  token_expiry TIMESTAMP,
  scope TEXT,                      -- Requested permissions
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

### Environment Configuration

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Encryption
ENCRYPTION_KEY=your_encryption_key_for_credentials
```

### Setup Instructions

1. Create Google OAuth app (console.cloud.google.com)
2. Add scopes: `https://www.googleapis.com/auth/gmail.readonly`
3. Store credentials securely in database
4. Update node configuration to use refreshToken instead of password

---

## Fix 3: Input Validation

**Severity**: 🟠 HIGH
**Time**: 2-3 hours
**Impact**: Security (prevents injection attacks)

### Install Validation Library

```bash
npm install zod
```

### Create Validation Schemas

```typescript
// lib/validation.ts
import { z } from 'zod';

export const templateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(200, 'Template name must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).min(0).max(10, 'Maximum 10 tags allowed'),
  nodes: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.string().min(1),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
        data: z.record(z.any()),
      })
    )
    .min(1, 'At least one node is required'),
  edges: z.array(
    z.object({
      id: z.string().min(1),
      source: z.string().min(1),
      target: z.string().min(1),
    })
  ),
  featured: z.boolean().optional(),
  price: z.number().min(0).optional(),
});

export const agentSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(200),
  description: z.string().optional(),
  config: z.record(z.any()),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

export type TemplateInput = z.infer<typeof templateSchema>;
export type AgentInput = z.infer<typeof agentSchema>;
```

### Update API Routes

```typescript
// app/api/admin/templates/route.ts
import { templateSchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyAdmin(token);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // ✅ VALIDATE input
    try {
      const validatedData = templateSchema.parse(body);

      // Forward validated data to backend
      const backendResponse = await fetch(`${backendUrl}/api/admin/templates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        return NextResponse.json(errorData, { status: backendResponse.status });
      }

      const data = await backendResponse.json();
      return NextResponse.json(data, { status: 201 });
    } catch (validationError) {
      // Return validation errors
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validationError.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error('Error in templates API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## Fix 4: Add Request Timeout Handling

**Severity**: 🟠 HIGH
**Time**: 1-2 hours
**Impact**: Prevents hanging connections

### Create Timeout Utility

```javascript
// lib/timeout.js (backend)
const createTimeoutPromise = ms => {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms));
};

const withTimeout = (promise, timeoutMs = 30000, label = 'Operation') => {
  return Promise.race([promise, createTimeoutPromise(timeoutMs)]).catch(error => {
    if (error.message === 'Request timeout') {
      throw new Error(`${label} exceeded ${timeoutMs}ms timeout`);
    }
    throw error;
  });
};

module.exports = { withTimeout, createTimeoutPromise };
```

### Use in Node Handlers

```javascript
// server.js - Updated handlers
const { withTimeout } = require('./lib/timeout');

"ai-gemini": async (node, inputData, apiKeys) => {
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKeys.gemini);
    const model = genAI.getGenerativeModel({
      model: resolveModel(node.config, "gemini-2.5-flash"),
    });

    // ✅ Add timeout wrapper
    const result = await withTimeout(
      model.generateContent(request),
      30000,  // 30 second timeout
      'Gemini generation'
    );

    return { output: result.response.text() };
  } catch (error) {
    console.error(`[ai-gemini] Error: ${error.message}`);
    return {
      output: null,
      error: error.message,
      success: false,
    };
  }
}
```

---

## Fix 5: Add Rate Limiting

**Severity**: 🟠 HIGH
**Time**: 1 hour
**Impact**: Prevent DDoS/abuse

### Install Express Rate Limit

```bash
npm install express-rate-limit redis redis-store
```

### Implement Rate Limiting

```javascript
// server.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('redis-store');
const redis = require('redis').createClient();

// Memory store for development
const memoryStore = new Map();

class SimpleMemoryStore {
  constructor() {
    this.requests = new Map();
  }

  async increment(key) {
    const current = (this.requests.get(key) || 0) + 1;
    this.requests.set(key, current);
    return current;
  }

  async decrement(key) {
    const current = this.requests.get(key) || 0;
    if (current > 0) {
      this.requests.set(key, current - 1);
    }
    return current - 1;
  }
}

// Create rate limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 minutes
  keyGenerator: req => req.user?.id || req.ip,
  message: 'Too many API requests, please try again later.',
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  keyGenerator: req => req.body.email || req.ip,
  message: 'Too many login attempts, please try again later.',
});

// Apply global limiter to all requests
app.use(globalLimiter);

// Apply API limiter to protected routes
app.use('/api/', apiLimiter);

// Apply auth limiter to login routes
app.post('/api/auth/login', authLimiter, (req, res) => {
  // ... login logic
});

// Apply limiter to template creation
app.post('/api/admin/templates', authLimiter, verifyToken, async (req, res) => {
  // ... template creation logic
});
```

---

## Fix 6: Add Structured Logging

**Severity**: 🟡 MEDIUM
**Time**: 2 hours
**Impact**: Better debugging and monitoring

### Install Winston

```bash
npm install winston
```

### Setup Logger

```javascript
// lib/logger.js (backend)
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'denbegaye-workers' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880,
      maxFiles: 10,
    }),
    // Console output (development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),
  ],
});

module.exports = logger;
```

### Use Logger in Code

```javascript
// server.js
const logger = require('./lib/logger');

// Log API calls
app.get('/api/admin/templates', verifyToken, async (req, res) => {
  const startTime = Date.now();

  try {
    logger.info('Fetching templates', {
      userId: req.user.id,
      query: req.query,
    });

    // ... fetch templates

    const duration = Date.now() - startTime;
    logger.info('Templates fetched successfully', {
      userId: req.user.id,
      templateCount: data.length,
      duration,
    });

    res.json(data);
  } catch (error) {
    logger.error('Failed to fetch templates', {
      userId: req.user.id,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime,
    });

    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Log node execution
const executeNode = async (node, inputData, apiKeys) => {
  const startTime = Date.now();
  logger.info('Executing node', {
    nodeId: node.id,
    nodeType: node.type,
  });

  try {
    const handler = nodeHandlers[node.type];
    if (!handler) {
      throw new Error(`No handler for node type: ${node.type}`);
    }

    const result = await handler(node, inputData, apiKeys);

    logger.info('Node executed successfully', {
      nodeId: node.id,
      nodeType: node.type,
      duration: Date.now() - startTime,
    });

    return result;
  } catch (error) {
    logger.error('Node execution failed', {
      nodeId: node.id,
      nodeType: node.type,
      error: error.message,
      duration: Date.now() - startTime,
    });

    throw error;
  }
};
```

---

## Fix 7: Persistent Execution Tracking

**Severity**: 🟡 MEDIUM
**Time**: 3-4 hours
**Impact**: Recoverable execution history

### Database Schema

```sql
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id),
  user_id UUID REFERENCES profiles(id),
  agent_id UUID REFERENCES user_agents(id),
  status VARCHAR(50) NOT NULL,  -- 'queued', 'running', 'completed', 'failed'
  input JSONB,
  result JSONB,
  error TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  node_executions JSONB,  -- Array of node execution details
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_started_at (started_at DESC)
);
```

### Updated Node Handler

```javascript
// server.js
const saveExecution = async (executionData) => {
  const { data, error } = await supabase
    .from('agent_executions')
    .insert(executionData);

  if (error) {
    logger.error('Failed to save execution', { error });
  }
  return data;
};

const updateExecution = async (executionId, updates) => {
  const { data, error } = await supabase
    .from('agent_executions')
    .update(updates)
    .eq('id', executionId);

  if (error) {
    logger.error('Failed to update execution', { error });
  }
  return data;
};

"ai-gemini": async (node, inputData, apiKeys) => {
  const executionId = require('uuid').v4();
  const startTime = Date.now();

  try {
    // Save execution start
    await saveExecution({
      id: executionId,
      node_id: node.id,
      status: 'running',
      input: inputData,
      started_at: new Date(),
    });

    // ... execute
    const result = await model.generateContent(request);

    // Save execution completion
    await updateExecution(executionId, {
      status: 'completed',
      result: { output: result.response.text() },
      completed_at: new Date(),
      duration_ms: Date.now() - startTime,
    });

    return { output: result.response.text(), executionId };
  } catch (error) {
    // Save execution failure
    await updateExecution(executionId, {
      status: 'failed',
      error: error.message,
      completed_at: new Date(),
      duration_ms: Date.now() - startTime,
    });

    throw error;
  }
}
```

---

## Implementation Checklist

### Priority 1 (Week 1)

- [ ] Fix JWT verification (2 hours)
- [ ] Migrate email to OAuth (3-4 hours)
- [ ] Add input validation (2-3 hours)
- [ ] Add rate limiting (1 hour)
- **Total: 8-10 hours**

### Priority 2 (Week 2)

- [ ] Add structured logging (2 hours)
- [ ] Implement timeout handling (1-2 hours)
- [ ] Persistent execution tracking (3-4 hours)
- [ ] Error boundary improvements (2 hours)
- **Total: 8-11 hours**

### Priority 3 (Week 3+)

- [ ] Template versioning system
- [ ] Analytics dashboard
- [ ] Fuzzy search implementation
- [ ] Caching layer (Redis)
- [ ] Load testing
- **Total: 15+ hours**

---

## Testing Your Fixes

### Test JWT Verification

```bash
# Create test token
node -e "console.log(require('jsonwebtoken').sign({sub:'user1',email:'test@example.com'}, 'secret'))"

# Test with valid token
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/admin/dashboard

# Test with invalid token
curl -H "Authorization: Bearer invalid" http://localhost:3001/api/admin/dashboard
```

### Test Input Validation

```bash
curl -X POST http://localhost:3001/api/admin/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "", "nodes": []}'  # Should fail validation

curl -X POST http://localhost:3001/api/admin/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Valid Template", "category": "Social Media", "nodes": [...], "edges": [...]}'
```

### Test Rate Limiting

```bash
# Send 101 requests rapidly - should get 429 after 100
for i in {1..101}; do
  curl http://localhost:3001/health
done
```

---

## Resources & References

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Zod Documentation](https://zod.dev)
- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit)
- [Winston Logging](https://github.com/winstonjs/winston)
- [Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [OWASP Security Guidelines](https://owasp.org)

---

## Support & Questions

For issues implementing these fixes:

1. Check the corresponding error in TEMPLATES_ERROR_ANALYSIS_AND_QUICK_REFERENCE.md
2. Review the detailed implementation report
3. Test each fix in isolation before combining
4. Consult the testing section above

**Estimated completion time**: 16-21 hours for all Priority 1 & 2 fixes
**Recommended**: Start with Priority 1 security fixes immediately
