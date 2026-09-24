-- Persistent execution history for Office Intelligence specialist agents.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.office_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'auto',
    status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'waiting_for_approval')),
    prompt TEXT NOT NULL,
    input_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    output JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS office_executions_user_created_idx
    ON public.office_executions (user_id, created_at DESC);

ALTER TABLE public.office_executions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'office_executions'
          AND policyname = 'office_executions_service_role_all'
    ) THEN
        CREATE POLICY office_executions_service_role_all
            ON public.office_executions FOR ALL TO service_role
            USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'office_executions'
          AND policyname = 'office_executions_authenticated_read_own'
    ) THEN
        CREATE POLICY office_executions_authenticated_read_own
            ON public.office_executions FOR SELECT TO authenticated
            USING (user_id = auth.uid());
    END IF;
END
$$;