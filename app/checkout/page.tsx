'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, ExternalLink, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PricingPlan {
  id: string;
  name: string;
  tier: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const planId = params.get('planId');
  const billingCycle = params.get('cycle') === 'yearly' ? 'yearly' : 'monthly';

  const [plan, setPlan] = useState<PricingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadPlan = async () => {
      if (!planId) {
        setErrorMessage('No plan was selected.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('pricing_plans')
        .select('id, name, tier, description, price_monthly, price_yearly, features')
        .eq('id', planId)
        .eq('is_active', true)
        .maybeSingle();

      if (!active) return;

      if (error || !data) {
        setErrorMessage('This pricing plan is no longer available.');
      } else if (Number(data.price_monthly) <= 0 && Number(data.price_yearly) <= 0) {
        router.replace('/agent-builder');
        return;
      } else {
        setPlan({
          ...data,
          price_monthly: Number(data.price_monthly),
          price_yearly: Number(data.price_yearly),
          features: data.features || [],
        });
      }
      setLoading(false);
    };

    loadPlan();
    return () => {
      active = false;
    };
  }, [planId, router]);

  const price = plan ? (billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly) : 0;
  const monthlyEquivalent = plan && billingCycle === 'yearly' ? plan.price_yearly / 12 : price;

  const startPayPalCheckout = async () => {
    if (!planId || !user) {
      router.push(
        `/login?redirectTo=${encodeURIComponent(`/checkout?planId=${planId || ''}&cycle=${billingCycle}`)}`
      );
      return;
    }

    try {
      setProcessing(true);
      setErrorMessage(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Your session has expired. Please sign in again.');

      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ planId, billingCycle, paymentGateway: 'paypal' }),
      });
      const result = await response.json();

      if (!response.ok || !result.data?.checkoutUrl) {
        throw new Error(result.error || 'Unable to open PayPal checkout.');
      }

      window.location.assign(result.data.checkoutUrl);
    } catch (error) {
      setProcessing(false);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to open PayPal checkout.');
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--border-strong)] border-t-[var(--button-bg)]" />
          <p className="text-sm text-[var(--text-secondary)]">Preparing your secure checkout...</p>
        </div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-4 text-[var(--text-primary)]">
        <div className="w-full max-w-md rounded-3xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.72)] p-8 text-center shadow-[0_28px_80px_rgba(15,23,42,0.06)]">
          <p className="text-[var(--text-secondary)]">
            {errorMessage || 'Unable to load this plan.'}
          </p>
          <Button className="mt-6" onClick={() => router.push('/pricing')}>
            Return to pricing
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(17,24,39,0.04),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(17,24,39,0.03),transparent_30%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
        <button
          type="button"
          onClick={() => router.push('/pricing')}
          className="mb-10 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to plans
        </button>

        <div className="mb-10 max-w-2xl">
          <Badge className="border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
            <LockKeyhole className="mr-2 h-3.5 w-3.5" /> Secure checkout
          </Badge>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl text-[var(--text-primary)]">
            Review your plan
          </h1>
          <p className="mt-4 text-[var(--text-secondary)]">
            Confirm your subscription details before continuing to PayPal. Your access begins after
            the payment is approved.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-[var(--border-default)] bg-[rgba(255,255,255,0.7)] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-default)] pb-7">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  <Sparkles className="h-4 w-4" /> {plan.tier} plan
                </div>
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">{plan.name}</h2>
                <p className="mt-2 max-w-lg text-[var(--text-secondary)]">{plan.description}</p>
              </div>
              <ShieldCheck className="h-8 w-8 shrink-0 text-[var(--text-primary)]" />
            </div>

            <div className="grid gap-4 border-b border-[var(--border-default)] py-7 sm:grid-cols-2">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Billing cycle</p>
                <p className="mt-2 text-lg font-semibold capitalize text-[var(--text-primary)]">
                  {billingCycle}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Renewal</p>
                <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                  {billingCycle === 'yearly' ? 'Every 12 months' : 'Every month'}
                </p>
              </div>
            </div>

            <div className="pt-7">
              <h3 className="font-semibold text-[var(--text-primary)]">What is included</h3>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {plan.features.map(feature => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-[var(--text-secondary)]"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--bg-soft)] text-[var(--text-primary)]">
                      <Check className="h-3 w-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <aside className="h-fit rounded-[2rem] border border-[var(--border-default)] bg-[rgba(255,255,255,0.74)] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.05)] sm:p-8">
            <p className="text-sm font-medium text-[var(--text-secondary)]">Order summary</p>
            <div className="mt-6 flex items-end justify-between gap-4">
              <span className="text-[var(--text-secondary)]">{plan.name} subscription</span>
              <span className="text-3xl font-black text-[var(--text-primary)]">
                ${price.toFixed(2)}
              </span>
            </div>
            <p className="mt-2 text-right text-sm text-[var(--text-secondary)]">
              USD / {billingCycle === 'yearly' ? 'year' : 'month'}
            </p>

            {billingCycle === 'yearly' && (
              <div className="mt-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-primary)]">
                Annual billing averages ${monthlyEquivalent.toFixed(2)} per month.
              </div>
            )}

            <div className="my-7 border-t border-[var(--border-default)] pt-5 text-sm text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>Due today</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  ${price.toFixed(2)} USD
                </span>
              </div>
              <p className="mt-4 leading-6">
                You will review and approve the payment securely on PayPal. We do not store your
                PayPal password or card details.
              </p>
            </div>

            {errorMessage && (
              <p className="mb-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-soft)] p-3 text-sm text-[var(--text-primary)]">
                {errorMessage}
              </p>
            )}

            <Button
              onClick={startPayPalCheckout}
              disabled={processing}
              className="h-12 w-full bg-[var(--button-bg)] font-bold text-[var(--button-text)] hover:bg-[var(--accent-strong)]"
            >
              {processing ? 'Connecting to PayPal...' : 'Continue to PayPal'}
              {!processing && <ExternalLink className="ml-2 h-4 w-4" />}
            </Button>
            <p className="mt-4 text-center text-xs leading-5 text-[var(--text-tertiary)]">
              Secure payment processing by PayPal. Subscription access is activated only after
              verified payment.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
