-- Run this migration in the Supabase SQL editor before enabling recurring PayPal billing.
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS public.pending_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.pricing_plans(id) NOT NULL,
  lakipay_transaction_id TEXT UNIQUE,
  reference TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pending_transactions
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

ALTER TABLE public.payment_history
  ADD COLUMN IF NOT EXISTS lakipay_transaction_id TEXT UNIQUE;

ALTER TABLE public.payment_history
  ADD COLUMN IF NOT EXISTS paypal_transaction_id TEXT UNIQUE;