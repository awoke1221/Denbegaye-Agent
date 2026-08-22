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
      <main className="flex min-h-screen items-center justify-center bg-[#020817] text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <p className="text-sm">Preparing your secure checkout...</p>
        </div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020817] px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-slate-900/90 p-8 text-center shadow-2xl">
          <p className="text-red-200">{errorMessage || 'Unable to load this plan.'}</p>
          <Button className="mt-6" onClick={() => router.push('/pricing')}>
            Return to pricing
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_30%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
        <button
          type="button"
          onClick={() => router.push('/pricing')}
          className="mb-10 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to plans
        </button>

        <div className="mb-10 max-w-2xl">
          <Badge className="border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
            <LockKeyhole className="mr-2 h-3.5 w-3.5" /> Secure checkout
          </Badge>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Review your plan</h1>
          <p className="mt-4 text-slate-300">
            Confirm your subscription details before continuing to PayPal. Your access begins after
            the payment is approved.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/75 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-7">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-cyan-300">
                  <Sparkles className="h-4 w-4" /> {plan.tier} plan
                </div>
                <h2 className="text-3xl font-bold">{plan.name}</h2>
                <p className="mt-2 max-w-lg text-slate-400">{plan.description}</p>
              </div>
              <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-400" />
            </div>

            <div className="grid gap-4 border-b border-white/10 py-7 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-400">Billing cycle</p>
                <p className="mt-2 text-lg font-semibold capitalize">{billingCycle}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Renewal</p>
                <p className="mt-2 text-lg font-semibold">
                  {billingCycle === 'yearly' ? 'Every 12 months' : 'Every month'}
                </p>
              </div>
            </div>

            <div className="pt-7">
              <h3 className="font-semibold">What is included</h3>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                      <Check className="h-3 w-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <aside className="h-fit rounded-[2rem] border border-cyan-300/20 bg-gradient-to-b from-cyan-400/10 to-slate-900/90 p-6 shadow-2xl shadow-cyan-950/30 sm:p-8">
            <p className="text-sm font-medium text-slate-300">Order summary</p>
            <div className="mt-6 flex items-end justify-between gap-4">
              <span className="text-slate-300">{plan.name} subscription</span>
              <span className="text-3xl font-black">${price.toFixed(2)}</span>
            </div>
            <p className="mt-2 text-right text-sm text-slate-400">
              USD / {billingCycle === 'yearly' ? 'year' : 'month'}
            </p>

            {billingCycle === 'yearly' && (
              <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
                Annual billing averages ${monthlyEquivalent.toFixed(2)} per month.
              </div>
            )}

            <div className="my-7 border-t border-white/10 pt-5 text-sm text-slate-400">
              <div className="flex justify-between">
                <span>Due today</span>
                <span className="font-semibold text-white">${price.toFixed(2)} USD</span>
              </div>
              <p className="mt-4 leading-6">
                You will review and approve the payment securely on PayPal. We do not store your
                PayPal password or card details.
              </p>
            </div>

            {errorMessage && (
              <p className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
                {errorMessage}
              </p>
            )}

            <Button
              onClick={startPayPalCheckout}
              disabled={processing}
              className="h-12 w-full bg-[#ffc439] font-bold text-[#111827] hover:bg-[#f4b51f]"
            >
              {processing ? 'Connecting to PayPal...' : 'Continue to PayPal'}
              {!processing && <ExternalLink className="ml-2 h-4 w-4" />}
            </Button>
            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              Secure payment processing by PayPal. Subscription access is activated only after
              verified payment.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
