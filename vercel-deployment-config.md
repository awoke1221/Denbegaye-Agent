# ===========================================

# DENBEGNAYE AGENT - VERCEL DEPLOYMENT CONFIGURATION

# Professional Production Deployment Setup

# ===========================================

# vercel.json - Vercel Configuration

{
"version": 2,
"buildCommand": "npm run build",
"outputDirectory": ".next",
"framework": "nextjs",
"functions": {
"app/api/**/\*.ts": {
"maxDuration": 300
},
"app/api/workflows/**/_.ts": {
"maxDuration": 600
}
},
"regions": ["iad1"],
"env": {
"NODE_ENV": "production"
},
"build": {
"env": {
"NEXT_PUBLIC_APP_URL": "@next_public_app_url",
"SUPABASE_URL": "@supabase_url",
"SUPABASE_ANON_KEY": "@supabase_anon_key",
"SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
"OPENAI_API_KEY": "@openai_api_key",
"INNGEST_SIGNING_KEY": "@inngest_signing_key",
"INNGEST_EVENT_KEY": "@inngest_event_key",
"UPSTASH_WORKFLOW_URL": "@upstash_workflow_url",
"UPSTASH_WORKFLOW_TOKEN": "@upstash_workflow_token",
"INTERNAL_API_KEY": "@internal_api_key",
"ENCRYPTION_KEY": "@encryption_key"
}
},
"rewrites": [
{
"source": "/api/(._)",
"destination": "/api/$1"
},
{
"source": "/(._)",
"destination": "/$1"
}
],
"headers": [
{
"source": "/api/(._)",
"headers": [
{
"key": "Access-Control-Allow-Origin",
"value": "*"
},
{
"key": "Access-Control-Allow-Methods",
"value": "GET, POST, PUT, DELETE, OPTIONS"
},
{
"key": "Access-Control-Allow-Headers",
"value": "Content-Type, Authorization, X-Requested-With"
}
]
}
]
}

# ===========================================

# ENVIRONMENT VARIABLES SETUP

# ===========================================

# .env.example - Environment Variables Template

# Copy this to .env.local for local development

# ===========================================

# APPLICATION CONFIG

# ===========================================

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ===========================================

# SUPABASE CONFIGURATION

# ===========================================

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ===========================================

# AI SERVICE API KEYS

# ===========================================

OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
GROQ_API_KEY=your_groq_api_key

# ===========================================

# WORKFLOW ENGINE CONFIGURATION

# ===========================================

# Choose either Inngest or Upstash Workflow

# Inngest Configuration

INNGEST_SIGNING_KEY=your_inngest_signing_key
INNGEST_EVENT_KEY=your_inngest_event_key

# Upstash Workflow Configuration (Alternative)

UPSTASH_WORKFLOW_URL=your_upstash_workflow_url
UPSTASH_WORKFLOW_TOKEN=your_upstash_workflow_token

# ===========================================

# SECURITY & ENCRYPTION

# ===========================================

INTERNAL_API_KEY=your_internal_api_key_for_webhooks
ENCRYPTION_KEY=your_32_character_encryption_key

# ===========================================

# ANALYTICS & MONITORING (OPTIONAL)

# ===========================================

VERCEL_ANALYTICS_ID=your_vercel_analytics_id
SENTRY_DSN=your_sentry_dsn

# ===========================================

# DEPLOYMENT SCRIPTS

# ===========================================

# package.json deployment scripts

{
"scripts": {
"build": "next build",
"start": "next start",
"lint": "next lint",
"type-check": "tsc --noEmit",
"test": "jest",
"test:ci": "jest --ci --coverage",
"deploy:vercel": "vercel --prod",
"deploy:preview": "vercel",
"db:migrate": "supabase db push",
"db:seed": "supabase seed",
"db:reset": "supabase db reset",
"workflow:dev": "inngest dev",
"workflow:deploy": "inngest deploy"
}
}

# ===========================================

# SUPABASE CONFIGURATION

# ===========================================

# supabase/config.toml

project_id = "denbegaye-agent"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://denbegaye-agent.vercel.app"]
jwt_expiry = 3600
jwt_secret = "super-secret-jwt-token-with-at-least-32-characters-long"
enable_signup = true
enable_anonymous_sign_ins = false

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true

[db]
port = 54322
shadow_port = 54320
major_version = 15

[storage]
enabled = true
file_size_limit = "50MiB"

# ===========================================

# MONITORING & LOGGING SETUP

# ===========================================

# lib/monitoring.ts

import { NextApiRequest, NextApiResponse } from 'next';

export class MonitoringService {
static logApiRequest(req: NextApiRequest, res: NextApiResponse, duration: number) {
const logData = {
method: req.method,
url: req.url,
statusCode: res.statusCode,
duration,
userAgent: req.headers['user-agent'],
ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
timestamp: new Date().toISOString(),
};

    // Log to Vercel Analytics or external service
    console.log('API Request:', JSON.stringify(logData));

}

static logError(error: Error, context: any = {}) {
const errorData = {
message: error.message,
stack: error.stack,
context,
timestamp: new Date().toISOString(),
};

    console.error('Application Error:', JSON.stringify(errorData));

    // Send to error tracking service (Sentry, etc.)
    if (process.env.SENTRY_DSN) {
      // Sentry.captureException(error, { extra: context });
    }

}

static logPerformance(metric: string, value: number, tags: Record<string, string> = {}) {
const performanceData = {
metric,
value,
tags,
timestamp: new Date().toISOString(),
};

    console.log('Performance Metric:', JSON.stringify(performanceData));

}
}

// ===========================================
// HEALTH CHECK ENDPOINT

# ===========================================

// app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
try {
// Check Supabase connection
const supabase = createClient();
const { data, error } = await supabase.from('profiles').select('count').limit(1);

    if (error) throw error;

    // Check external services
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        supabase: 'healthy',
        database: 'healthy',
      },
      version: process.env.npm_package_version || '1.0.0',
    };

    return NextResponse.json(healthStatus);

} catch (error) {
console.error('Health check failed:', error);

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });

}
}

// ===========================================
// DEPLOYMENT CHECKLIST

# ===========================================

# Pre-deployment Checklist:

# 1. Environment Variables

# - [ ] SUPABASE_URL and keys configured

# - [ ] AI API keys (OpenAI, etc.) set

# - [ ] Workflow provider keys (Inngest/Upstash) configured

# - [ ] ENCRYPTION_KEY generated (32 chars)

# - [ ] INTERNAL_API_KEY generated

# 2. Database Setup

# - [ ] Supabase project created

# - [ ] Schema deployed (supabase-schema.sql)

# - [ ] RLS policies applied

# - [ ] Initial data seeded

# 3. Authentication Setup

# - [ ] OAuth providers configured in Supabase

# - [ ] Email templates customized

# - [ ] Site URL configured for production

# 4. Storage Setup

# - [ ] Supabase Storage buckets created

# - [ ] File upload policies configured

# - [ ] Avatar storage configured

# 5. Workflow Setup

# - [ ] Inngest/Upstash account created

# - [ ] Webhook endpoints configured

# - [ ] Workflow functions deployed

# 6. Vercel Setup

# - [ ] Project connected to GitHub

# - [ ] Environment variables configured

# - [ ] Custom domain (optional)

# - [ ] Build settings verified

# 7. Security

# - [ ] HTTPS enabled

# - [ ] API rate limiting configured

# - [ ] CORS settings verified

# - [ ] Secrets properly encrypted

# 8. Monitoring

# - [ ] Error tracking (Sentry) configured

# - [ ] Analytics enabled

# - [ ] Performance monitoring set up

# ===========================================

# PRODUCTION OPTIMIZATIONS

# ===========================================

# next.config.mjs optimizations

/\*_ @type {import('next').NextConfig} _/
const nextConfig = {
// Performance optimizations
swcMinify: true,
compiler: {
removeConsole: process.env.NODE_ENV === 'production',
},

// Image optimization
images: {
domains: ['localhost', 'denbegaye-agent.vercel.app'],
remotePatterns: [
{
protocol: 'https',
hostname: '**',
},
],
},

// Security headers
async headers() {
return [
{
source: '/(.\*)',
headers: [
{
key: 'X-Frame-Options',
value: 'DENY',
},
{
key: 'X-Content-Type-Options',
value: 'nosniff',
},
{
key: 'Referrer-Policy',
value: 'origin-when-cross-origin',
},
],
},
];
},

// Experimental features for performance
experimental: {
optimizeCss: true,
scrollRestoration: true,
},
};

export default nextConfig;

# ===========================================

# CI/CD PIPELINE (GitHub Actions)

# ===========================================

# .github/workflows/deploy.yml

name: Deploy to Vercel

on:
push:
branches: [main]
pull_request:
branches: [main]

jobs:
test:
runs-on: ubuntu-latest
steps: - uses: actions/checkout@v3 - uses: actions/setup-node@v3
with:
node-version: '18'
cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm run test:ci

      - name: Run linting
        run: npm run lint

deploy:
needs: test
runs-on: ubuntu-latest
if: github.ref == 'refs/heads/main'
steps: - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

# ===========================================

# BACKUP & DISASTER RECOVERY

# ===========================================

# lib/backupService.ts

export class BackupService {
static async createDatabaseBackup() {
// Implementation for database backup
// Could use Supabase CLI or pg_dump
}

static async backupUserData(userId: string) {
// Implementation for user data backup
}

static async restoreFromBackup(backupId: string) {
// Implementation for data restoration
}
}

# ===========================================

# COST OPTIMIZATION

# ===========================================

# Cost monitoring and optimization strategies:

# 1. Database: Use connection pooling, optimize queries

# 2. Storage: Compress files, set size limits

# 3. AI APIs: Implement caching, batch requests

# 4. Workflows: Set timeouts, monitor execution costs

# 5. Vercel: Use appropriate function sizes, optimize builds
