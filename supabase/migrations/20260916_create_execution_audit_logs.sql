-- Execution governance audit trail
-- Stores lifecycle and authorization decisions without workflow payloads or credentials.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.execution_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    execution_id TEXT,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS execution_audit_logs_execution_id_idx
    ON public.execution_audit_logs (execution_id);

CREATE INDEX IF NOT EXISTS execution_audit_logs_tenant_created_idx
    ON public.execution_audit_logs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS execution_audit_logs_user_created_idx
    ON public.execution_audit_logs (user_id, created_at DESC);

ALTER TABLE public.execution_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'execution_audit_logs'
          AND policyname = 'execution_audit_logs_service_role_all'
    ) THEN
        CREATE POLICY execution_audit_logs_service_role_all
            ON public.execution_audit_logs
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'execution_audit_logs'
          AND policyname = 'execution_audit_logs_authenticated_read_own'
    ) THEN
        CREATE POLICY execution_audit_logs_authenticated_read_own
            ON public.execution_audit_logs
            FOR SELECT
            TO authenticated
            USING (user_id = auth.uid()::text);
    END IF;
END
$$;

COMMENT ON TABLE public.execution_audit_logs IS
    'Execution lifecycle and governance events. Sensitive workflow payloads and credentials must not be stored.';
COMMENT ON COLUMN public.execution_audit_logs.metadata IS
    'Redacted event metadata only; do not store prompts, uploaded data, API keys, or provider secrets.';
