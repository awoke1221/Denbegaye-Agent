-- ===========================================
-- DENBEGNAYE AGENT - COMPLETE SUPABASE SCHEMA
-- Safe update commands for existing database
-- Creates tables if they don't exist, updates if they do
-- Fully aligned with types/database.ts TypeScript interfaces
-- Updated: May 10, 2026
-- ===========================================

-- Enable necessary extensions (safe for existing)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For embeddings

-- ===========================================
-- CREATE ALL TABLES (IF NOT EXISTS)
-- ===========================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    credits_remaining INTEGER DEFAULT 1000,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User agents table
CREATE TABLE IF NOT EXISTS public.user_agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    template_id UUID REFERENCES public.agent_templates(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'error')),
    is_favorite BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent executions table
CREATE TABLE IF NOT EXISTS public.agent_executions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.user_agents(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    idempotency_key TEXT UNIQUE,
    workflow_id TEXT,
    tokens_used INTEGER,
    cost_cents INTEGER,
    metadata JSONB DEFAULT '{}',
    execution_time_ms INTEGER,
    partial_success BOOLEAN DEFAULT FALSE,
    circuit_breaker_tripped BOOLEAN DEFAULT FALSE,
    failed_nodes TEXT[] DEFAULT '{}',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    is_temporary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent memories table
CREATE TABLE IF NOT EXISTS public.agent_memories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.user_agents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(384),
    metadata JSONB DEFAULT '{}',
    memory_type TEXT DEFAULT 'conversation' CHECK (memory_type IN ('conversation', 'fact', 'procedure', 'context')),
    importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow executions table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    external_execution_id TEXT NOT NULL DEFAULT '',
    provider TEXT NOT NULL DEFAULT 'inngest' CHECK (provider IN ('inngest', 'upstash', 'temporal')),
    input_payload JSONB,
    output_payload JSONB,
    error_details JSONB,
    execution_time_ms INTEGER,
    cost_cents INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data sources table
CREATE TABLE IF NOT EXISTS public.data_sources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email_list', 'phone_list', 'contact_list', 'csv_upload', 'api_integration')),
    config JSONB NOT NULL,
    record_count INTEGER DEFAULT 0,
    last_sync_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data records table
CREATE TABLE IF NOT EXISTS public.data_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    data_source_id UUID REFERENCES public.data_sources(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    external_id TEXT,
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage analytics table
CREATE TABLE IF NOT EXISTS public.usage_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    session_id TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    unit TEXT,
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- User API keys (encrypted storage)
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'deepseek', 'groq')),
    label TEXT NOT NULL,
    encrypted_key TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Agent templates (pre-built configurations)
CREATE TABLE IF NOT EXISTS public.agent_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    config JSONB NOT NULL,
    ui_schema JSONB,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    usage_count INTEGER DEFAULT 0,
    version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing plans
CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    tier TEXT UNIQUE NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.pricing_plans(id),
    stripe_subscription_id TEXT UNIQUE,
    paypal_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id) -- One active subscription per user
);

-- Usage tracking for rate limiting
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('agent_creations', 'executions', 'api_calls', 'storage_mb')),
    count INTEGER NOT NULL DEFAULT 0,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, metric_type, period_start)
);

-- Payment history
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    stripe_payment_intent_id TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'canceled')),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook triggers (for agent webhook integrations)
CREATE TABLE IF NOT EXISTS public.webhook_triggers (
    id TEXT PRIMARY KEY,
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    secret TEXT,
    enabled BOOLEAN DEFAULT true,
    method TEXT NOT NULL CHECK (method IN ('GET','POST','PUT','PATCH')),
    headers JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_triggered TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0
);

-- Webhook event audit trail for advanced debugging and retries
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id TEXT PRIMARY KEY,
    webhook_id TEXT REFERENCES public.webhook_triggers(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('success', 'failure')),
    event_type TEXT NOT NULL CHECK (event_type IN ('trigger', 'error')),
    payload JSONB,
    metadata JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job queue for persistent job processing
CREATE TABLE IF NOT EXISTS public.job_queue (
    id TEXT PRIMARY KEY,
    job_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'dead_letter')),
    priority INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 3,
    attempt_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory relationships (for graph-based memory)
CREATE TABLE IF NOT EXISTS public.memory_relationships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    source_memory_id UUID REFERENCES public.agent_memories(id) ON DELETE CASCADE,
    target_memory_id UUID REFERENCES public.agent_memories(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('related', 'contradicts', 'supports', 'follows')),
    strength FLOAT DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_memory_id, target_memory_id, relationship_type)
);

-- ===========================================
-- UPDATE EXISTING TABLES WITH MISSING COLUMNS
-- ===========================================

-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_remaining INTEGER DEFAULT 1000;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to user_agents table
ALTER TABLE public.user_agents ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.agent_templates(id);
ALTER TABLE public.user_agents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'error'));
ALTER TABLE public.user_agents ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE public.user_agents ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.user_agents ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0.0';
ALTER TABLE public.user_agents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to agent_executions table
ALTER TABLE public.agent_executions ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
ALTER TABLE public.agent_executions ADD COLUMN IF NOT EXISTS workflow_id TEXT;
ALTER TABLE public.agent_executions ADD COLUMN IF NOT EXISTS tokens_used INTEGER;
ALTER TABLE public.agent_executions ADD COLUMN IF NOT EXISTS cost_cents INTEGER;
ALTER TABLE public.agent_executions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.agent_executions ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER;
ALTER TABLE public.agent_executions ADD COLUMN IF NOT EXISTS partial_success BOOLEAN DEFAULT FALSE;
ALTER TABLE public.agent_executions ADD COLUMN IF NOT EXISTS circuit_breaker_tripped BOOLEAN DEFAULT FALSE;
ALTER TABLE public.agent_executions ADD COLUMN IF NOT EXISTS failed_nodes TEXT[] DEFAULT '{}';
ALTER TABLE public.agent_executions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.agent_executions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.agent_executions ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT FALSE;

-- Make agent_id nullable to support temporary executions
ALTER TABLE public.agent_executions DROP CONSTRAINT IF EXISTS agent_executions_agent_id_fkey;
ALTER TABLE public.agent_executions ALTER COLUMN agent_id DROP NOT NULL;
ALTER TABLE public.agent_executions ADD CONSTRAINT agent_executions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.user_agents(id) ON DELETE CASCADE;

-- Add missing columns to agent_memories table
ALTER TABLE public.agent_memories ADD COLUMN IF NOT EXISTS embedding vector(384);
ALTER TABLE public.agent_memories ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.agent_memories ADD COLUMN IF NOT EXISTS memory_type TEXT DEFAULT 'conversation' CHECK (memory_type IN ('conversation', 'fact', 'procedure', 'context'));
ALTER TABLE public.agent_memories ADD COLUMN IF NOT EXISTS importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1);
ALTER TABLE public.agent_memories ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;
ALTER TABLE public.agent_memories ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;
ALTER TABLE public.agent_memories ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add missing columns to workflows table
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to workflow_executions table
ALTER TABLE public.workflow_executions ADD COLUMN IF NOT EXISTS external_execution_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.workflow_executions ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'inngest' CHECK (provider IN ('inngest', 'upstash', 'temporal'));
ALTER TABLE public.workflow_executions ADD COLUMN IF NOT EXISTS input_payload JSONB;
ALTER TABLE public.workflow_executions ADD COLUMN IF NOT EXISTS output_payload JSONB;
ALTER TABLE public.workflow_executions ADD COLUMN IF NOT EXISTS error_details JSONB;
ALTER TABLE public.workflow_executions ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER;
ALTER TABLE public.workflow_executions ADD COLUMN IF NOT EXISTS cost_cents INTEGER;
ALTER TABLE public.workflow_executions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.workflow_executions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add missing columns to data_sources table
ALTER TABLE public.data_sources ADD COLUMN IF NOT EXISTS record_count INTEGER DEFAULT 0;
ALTER TABLE public.data_sources ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE public.data_sources ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.data_sources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to data_records table
ALTER TABLE public.data_records ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.data_records ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.data_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error'));
ALTER TABLE public.data_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to job_queue table
ALTER TABLE public.job_queue ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;
ALTER TABLE public.job_queue ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to performance_metrics table
ALTER TABLE public.performance_metrics ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE public.performance_metrics ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.performance_metrics ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ DEFAULT NOW();

-- ===========================================
-- CREATE INDEXES (IF NOT EXISTS)
-- ===========================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_agents_user_id ON public.user_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agents_status ON public.user_agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_user_id ON public.agent_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON public.agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_created_at ON public.agent_executions(created_at);

-- Job queue indexes
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON public.job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled_at ON public.job_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_priority ON public.job_queue(priority DESC);

-- Vector search indexes (only if vector extension is available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        CREATE INDEX IF NOT EXISTS idx_agent_memories_embedding ON public.agent_memories USING ivfflat (embedding vector_cosine_ops);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agent_memories_agent_user ON public.agent_memories(agent_id, user_id);
CREATE INDEX IF NOT EXISTS idx_agent_memories_type ON public.agent_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memories_importance ON public.agent_memories(importance_score);

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_provider ON public.workflow_executions(provider);

-- Pricing and subscription indexes
CREATE INDEX IF NOT EXISTS idx_pricing_plans_tier ON public.pricing_plans(tier);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON public.pricing_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_metric ON public.usage_tracking(user_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON public.usage_tracking(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription ON public.payment_history(subscription_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_event ON public.usage_analytics(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at ON public.usage_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_type ON public.performance_metrics(user_id, metric_type);

-- ===========================================
-- ENABLE ROW LEVEL SECURITY (IF NOT ENABLED)
-- ===========================================

-- Enable RLS on all tables (safe operation)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

-- Pricing and subscription tables RLS
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- CREATE POLICIES (IF NOT EXISTS)
-- ===========================================

-- Drop existing policies to avoid conflicts, then recreate
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Public templates are readable by all" ON public.agent_templates;
DROP POLICY IF EXISTS "Users can manage own templates" ON public.agent_templates;
DROP POLICY IF EXISTS "Users can manage own agents" ON public.user_agents;
DROP POLICY IF EXISTS "Users can view own agent executions" ON public.agent_executions;
DROP POLICY IF EXISTS "Users can manage own agent memories" ON public.agent_memories;
DROP POLICY IF EXISTS "Users can manage own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can manage own data sources" ON public.data_sources;
DROP POLICY IF EXISTS "Users can view own analytics" ON public.usage_analytics;
DROP POLICY IF EXISTS "Users can view own performance metrics" ON public.performance_metrics;
DROP POLICY IF EXISTS "Authenticated users can access job queue" ON public.job_queue;
DROP POLICY IF EXISTS "All users can view pricing plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can view own payment history" ON public.payment_history;

-- Recreate policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own API keys" ON public.user_api_keys
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public templates are readable by all" ON public.agent_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage own templates" ON public.agent_templates
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can manage own agents" ON public.user_agents
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own agent executions" ON public.agent_executions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own agent memories" ON public.agent_memories
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own workflows" ON public.workflows
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own data sources" ON public.data_sources
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics" ON public.usage_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own performance metrics" ON public.performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can access job queue" ON public.job_queue
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "All users can view pricing plans" ON public.pricing_plans
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscriptions" ON public.user_subscriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payment history" ON public.payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_user_agents_updated_at ON public.user_agents;
DROP TRIGGER IF EXISTS update_workflows_updated_at ON public.workflows;
DROP TRIGGER IF EXISTS update_data_sources_updated_at ON public.data_sources;
DROP TRIGGER IF EXISTS update_data_records_updated_at ON public.data_records;
DROP TRIGGER IF EXISTS update_pricing_plans_updated_at ON public.pricing_plans;
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON public.usage_tracking;
DROP TRIGGER IF EXISTS update_job_queue_updated_at ON public.job_queue;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_agents_updated_at BEFORE UPDATE ON public.user_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON public.data_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_records_updated_at BEFORE UPDATE ON public.data_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_plans_updated_at BEFORE UPDATE ON public.pricing_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON public.usage_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_queue_updated_at BEFORE UPDATE ON public.job_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION vector_similarity_search(
    query_embedding vector(384),
    match_threshold float DEFAULT 0.1,
    match_count int DEFAULT 10
)
RETURNS TABLE(
    id uuid,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        agent_memories.id,
        agent_memories.content,
        1 - (agent_memories.embedding <=> query_embedding) as similarity
    FROM agent_memories
    WHERE 1 - (agent_memories.embedding <=> query_embedding) > match_threshold
    ORDER BY agent_memories.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ===========================================
-- INITIAL PRICING DATA (UPSERT)
-- ===========================================

-- Insert default pricing plans (use ON CONFLICT to handle existing data)
INSERT INTO public.pricing_plans (name, tier, description, price_monthly, price_yearly, features, limits) VALUES
('Free', 'free', 'Perfect for getting started with AI agents', 0.00, 0.00, 
 '["1 AI Agent", "100 Executions/month", "Basic Templates", "Community Support"]'::jsonb,
 '{"agents": 1, "executions": 100, "api_calls": 1000, "storage_mb": 100}'::jsonb)
ON CONFLICT (tier) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits;

INSERT INTO public.pricing_plans (name, tier, description, price_monthly, price_yearly, features, limits) VALUES
('Pro', 'pro', 'For professionals and small teams', 29.99, 299.99,
 '["5 AI Agents", "5000 Executions/month", "All Templates", "Priority Support", "Advanced Analytics", "API Access"]'::jsonb,
 '{"agents": 5, "executions": 5000, "api_calls": 50000, "storage_mb": 5000}'::jsonb)
ON CONFLICT (tier) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits;

INSERT INTO public.pricing_plans (name, tier, description, price_monthly, price_yearly, features, limits) VALUES
('Enterprise', 'enterprise', 'For large organizations with advanced needs', 99.99, 999.99,
 '["Unlimited AI Agents", "Unlimited Executions", "Custom Templates", "Dedicated Support", "Advanced Analytics", "API Access", "Custom Integrations", "SLA Guarantee"]'::jsonb,
 '{"agents": -1, "executions": -1, "api_calls": -1, "storage_mb": 50000}'::jsonb)
ON CONFLICT (tier) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits;

-- ===========================================
-- CREATE INDEXES (IF NOT EXISTS)
-- ===========================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_agents_user_id ON public.user_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agents_status ON public.user_agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_user_id ON public.agent_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON public.agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_created_at ON public.agent_executions(created_at);

-- Job queue indexes
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON public.job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled_at ON public.job_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_priority ON public.job_queue(priority DESC);

-- Vector search indexes (only if vector extension is available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        CREATE INDEX IF NOT EXISTS idx_agent_memories_embedding ON public.agent_memories USING ivfflat (embedding vector_cosine_ops);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agent_memories_agent_user ON public.agent_memories(agent_id, user_id);
CREATE INDEX IF NOT EXISTS idx_agent_memories_type ON public.agent_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memories_importance ON public.agent_memories(importance_score);

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_provider ON public.workflow_executions(provider);

-- Pricing and subscription indexes
CREATE INDEX IF NOT EXISTS idx_pricing_plans_tier ON public.pricing_plans(tier);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON public.pricing_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_metric ON public.usage_tracking(user_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON public.usage_tracking(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription ON public.payment_history(subscription_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_event ON public.usage_analytics(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at ON public.usage_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_type ON public.performance_metrics(user_id, metric_type);

-- ===========================================
-- ENABLE ROW LEVEL SECURITY (IF NOT ENABLED)
-- ===========================================

-- Enable RLS on all tables (safe operation)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

-- Pricing and subscription tables RLS
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- CREATE POLICIES (IF NOT EXISTS)
-- ===========================================

-- Drop existing policies to avoid conflicts, then recreate
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Public templates are readable by all" ON public.agent_templates;
DROP POLICY IF EXISTS "Users can manage own templates" ON public.agent_templates;
DROP POLICY IF EXISTS "Users can manage own agents" ON public.user_agents;
DROP POLICY IF EXISTS "Users can view own agent executions" ON public.agent_executions;
DROP POLICY IF EXISTS "Users can manage own agent memories" ON public.agent_memories;
DROP POLICY IF EXISTS "Users can manage own workflows" ON public.workflows;
DROP POLICY IF EXISTS "Users can manage own data sources" ON public.data_sources;
DROP POLICY IF EXISTS "Users can view own analytics" ON public.usage_analytics;
DROP POLICY IF EXISTS "Users can view own performance metrics" ON public.performance_metrics;
DROP POLICY IF EXISTS "Authenticated users can access job queue" ON public.job_queue;
DROP POLICY IF EXISTS "All users can view pricing plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can view own payment history" ON public.payment_history;

-- Recreate policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own API keys" ON public.user_api_keys
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public templates are readable by all" ON public.agent_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage own templates" ON public.agent_templates
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can manage own agents" ON public.user_agents
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own agent executions" ON public.agent_executions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own agent memories" ON public.agent_memories
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own workflows" ON public.workflows
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own data sources" ON public.data_sources
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics" ON public.usage_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own performance metrics" ON public.performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can access job queue" ON public.job_queue
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "All users can view pricing plans" ON public.pricing_plans
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscriptions" ON public.user_subscriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payment history" ON public.payment_history
    FOR SELECT USING (auth.uid() = user_id);
