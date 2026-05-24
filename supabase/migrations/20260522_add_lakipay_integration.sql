-- ===========================================
-- LAKIPAY PAYMENT INTEGRATION SCHEMA
-- Add tables for LakiPay payment processing
-- Safe for existing database (using IF NOT EXISTS)
-- ===========================================

-- Add LakiPay transaction ID to user_subscriptions
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS lakipay_transaction_id TEXT UNIQUE;

-- Create pending transactions table for tracking checkout sessions
CREATE TABLE IF NOT EXISTS public.pending_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.pricing_plans(id),
    lakipay_transaction_id TEXT UNIQUE NOT NULL,
    reference TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'ETB' CHECK (currency IN ('ETB', 'USD')),
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_transactions_user 
ON public.pending_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_pending_transactions_reference 
ON public.pending_transactions(reference);

CREATE INDEX IF NOT EXISTS idx_pending_transactions_lakipay_id 
ON public.pending_transactions(lakipay_transaction_id);

CREATE INDEX IF NOT EXISTS idx_pending_transactions_status 
ON public.pending_transactions(status);

-- Add LakiPay customer ID to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS lakipay_customer_id TEXT;

-- Create payment methods table to store user's preferred payment methods
CREATE TABLE IF NOT EXISTS public.user_payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('TELEBIRR', 'MPESA', 'CBE', 'AWASH', 'KACHA', 'CARD')),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, payment_method)
);

-- Index for user payment methods
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user 
ON public.user_payment_methods(user_id);

-- Create subscription history table for tracking plan changes
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id_from UUID REFERENCES public.pricing_plans(id),
    plan_id_to UUID REFERENCES public.pricing_plans(id),
    action TEXT NOT NULL CHECK (action IN ('upgrade', 'downgrade', 'cancel', 'reactivate', 'create')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user subscription history
CREATE INDEX IF NOT EXISTS idx_subscription_history_user 
ON public.subscription_history(user_id);

-- Create payment reconciliation table for tracking failed payments
CREATE TABLE IF NOT EXISTS public.payment_reconciliation (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    lakipay_transaction_id TEXT NOT NULL,
    status TEXT NOT NULL,
    amount DECIMAL(10,2),
    currency TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for payment reconciliation
CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_user 
ON public.payment_reconciliation(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_lakipay_id 
ON public.payment_reconciliation(lakipay_transaction_id);

-- Add ON DELETE CASCADE to payment_history for integrity
ALTER TABLE public.payment_history
DROP CONSTRAINT IF EXISTS payment_history_user_id_fkey;

ALTER TABLE public.payment_history
ADD CONSTRAINT payment_history_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.pending_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_payment_methods TO authenticated;
GRANT SELECT, INSERT ON public.subscription_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payment_reconciliation TO authenticated;

-- Create function to automatically update subscription status on period end
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS void AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND current_period_end < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscription_history (user_id, plan_id_from, plan_id_to, action)
  VALUES (
    NEW.user_id,
    OLD.plan_id,
    NEW.plan_id,
    CASE
      WHEN OLD.status = 'active' AND NEW.status = 'canceled' THEN 'cancel'
      WHEN OLD.status = 'canceled' AND NEW.status = 'active' THEN 'reactivate'
      WHEN (OLD.plan_id IS NULL OR OLD.plan_id != NEW.plan_id) AND NEW.status = 'active' THEN 'create'
      ELSE 'update'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription changes
DROP TRIGGER IF EXISTS subscription_change_trigger ON public.user_subscriptions;
CREATE TRIGGER subscription_change_trigger
AFTER UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION log_subscription_change();
