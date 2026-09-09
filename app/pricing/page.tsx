'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SitePageShell } from '@/components/site-page-shell';
import { Check, Star, Zap, Users, Database, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface PricingPlan {
  id: string;
  name: string;
  tier: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    agents: number;
    executions: number;
    api_calls: number;
    storage_mb: number;
  };
}

interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_end: string;
}

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchPricingData = async () => {
      setLoading(true);

      try {
        const { data: plansData, error: plansError } = await supabase
          .from('pricing_plans')
          .select('*')
          .eq('is_active', true)
          .order('price_monthly');

        if (plansError) {
          throw plansError;
        }

        const transformedPlans =
          plansData?.map(plan => ({
            id: plan.id,
            name: plan.name,
            tier: plan.tier,
            description: plan.description,
            price_monthly: plan.price_monthly,
            price_yearly: plan.price_yearly,
            features: plan.features || [],
            limits: plan.limits || { agents: 0, executions: 0, api_calls: 0, storage_mb: 0 },
          })) || [];

        if (!active) return;
        setPlans(transformedPlans);

        if (user) {
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

          if (!active) return;

          if (!subscriptionError && subscriptionData) {
            setUserSubscription(subscriptionData as UserSubscription);
          } else if (subscriptionError && subscriptionError.code !== 'PGRST116') {
            console.warn('Subscription lookup warning:', subscriptionError.message);
          }
        }
      } catch (error) {
        console.error('Error fetching pricing data:', error);
        if (active) {
          setPlans([]);
          setUserSubscription(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPricingData();

    return () => {
      active = false;
    };
  }, [user]);

  const handleSubscribe = async (plan: PricingPlan) => {
    if (plan.price_monthly <= 0 && plan.price_yearly <= 0) {
      router.push('/agent-builder');
      return;
    }

    if (!user) {
      router.push(
        `/login?redirectTo=${encodeURIComponent(`/checkout?planId=${plan.id}&cycle=${billingCycle}`)}`
      );
      return;
    }

    router.push(`/checkout?planId=${plan.id}&cycle=${billingCycle}`);
  };

  const getCurrentPrice = (plan: PricingPlan) => {
    return billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  };

  const getSavings = (plan: PricingPlan) => {
    if (billingCycle === 'yearly' && plan.price_monthly > 0) {
      const monthlyTotal = plan.price_monthly * 12;
      const savings = monthlyTotal - plan.price_yearly;
      return Math.round((savings / monthlyTotal) * 100);
    }
    return 0;
  };

  if (loading && plans.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-[var(--border-strong)] border-t-[var(--button-bg)]" />
          <p className="text-sm text-[var(--text-secondary)]">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <SitePageShell
      className="relative overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)]"
      contentClassName="py-10 sm:py-12 lg:py-16"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-6rem] top-[-4rem] h-72 w-72 rounded-full bg-[rgba(17,24,39,0.04)] blur-3xl" />
        <div className="absolute right-[-5rem] top-20 h-80 w-80 rounded-full bg-[rgba(17,24,39,0.03)] blur-3xl" />
        <div className="absolute bottom-[-7rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[rgba(17,24,39,0.02)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">
            <Sparkles className="h-3.5 w-3.5" />
            Pricing plans
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
            Choose the plan built for your next AI growth leap
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-[var(--text-secondary)] sm:text-lg">
            From solo builders to high-output teams, unlock powerful agent workflows, automation,
            deeper integrations, and enterprise-grade control.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.62)] p-2 shadow-[0_15px_35px_rgba(15,23,42,0.05)] backdrop-blur-xl">
              <span
                className={`px-3 py-1.5 text-sm ${billingCycle === 'monthly' ? 'rounded-full bg-[var(--button-bg)] text-[var(--button-text)]' : 'text-[var(--text-secondary)]'}`}
              >
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="relative h-7 w-14 rounded-full bg-[var(--bg-hover)] transition-colors"
                aria-label="Toggle billing cycle"
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-[var(--button-text)] transition-transform ${
                    billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
              <span
                className={`px-3 py-1.5 text-sm ${billingCycle === 'yearly' ? 'rounded-full bg-[var(--button-bg)] text-[var(--button-text)]' : 'text-[var(--text-secondary)]'}`}
              >
                Yearly
              </span>
            </div>

            {billingCycle === 'yearly' && (
              <Badge className="border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-1.5 text-sm text-[var(--text-secondary)]">
                Save up to 17%
              </Badge>
            )}
          </div>
        </div>

        <div className="mb-12 grid gap-4 md:grid-cols-3">
          {[
            { label: 'Workflow automations', value: '5x faster', icon: Zap },
            { label: 'Model orchestration', value: '99.9% uptime', icon: Shield },
            { label: 'Team collaboration', value: '24/7 operations', icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={value}
              className="rounded-3xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.62)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur-xl"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--text-primary)]">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{label}</p>
              <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#6b7280]" />
            Secure checkout via PayPal
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.56)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            Pro plan access activates instantly after approval
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-10 text-center text-slate-300 shadow-[0_25px_80px_rgba(15,23,42,0.7)] backdrop-blur-xl">
            No pricing plans are currently available. Please check back soon.
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map(plan => {
              const isCurrentPlan = userSubscription?.plan_id === plan.id;
              const isPopular = plan.tier === 'pro';

              return (
                <Card
                  key={plan.id}
                  className={`group relative overflow-hidden border transition-all duration-300 ${
                    isPopular
                      ? 'border-[var(--border-strong)] bg-[rgba(255,255,255,0.75)] shadow-[0_30px_100px_rgba(15,23,42,0.06)]'
                      : 'border-[var(--border-default)] bg-[rgba(255,255,255,0.64)] shadow-[0_18px_50px_rgba(15,23,42,0.04)]'
                  } ${isCurrentPlan ? 'ring-2 ring-[rgba(17,24,39,0.12)]' : ''}`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 ${isPopular ? 'bg-[var(--button-bg)]' : 'bg-[rgba(17,24,39,0.12)]'}`}
                  />

                  {isPopular && (
                    <div className="absolute inset-x-0 top-4 flex justify-center">
                      <Badge className="border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                        <Star className="mr-1 h-3 w-3" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute right-4 top-4">
                      <Badge className="border border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                        Current Plan
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-5 pt-12 text-center">
                    <div className="mb-4 inline-flex self-center rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                      {plan.tier}
                    </div>
                    <CardTitle className="text-2xl font-bold text-[var(--text-primary)]">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="mt-3 min-h-[48px] text-sm leading-6 text-[var(--text-secondary)]">
                      {plan.description}
                    </CardDescription>

                    <div className="mt-7">
                      <div className="flex items-end justify-center gap-2">
                        <span className="text-5xl font-black tracking-tight text-[var(--text-primary)]">
                          ${getCurrentPrice(plan)}
                        </span>
                        <span className="pb-2 text-sm text-[var(--text-tertiary)]">
                          /{billingCycle === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>

                      {getSavings(plan) > 0 && (
                        <div className="mt-3 text-sm font-medium text-[var(--text-secondary)]">
                          Save {getSavings(plan)}% with annual billing
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 px-6 pb-6">
                    <Button
                      onClick={() => handleSubscribe(plan)}
                      disabled={isCurrentPlan}
                      className={`w-full ${
                        isPopular
                          ? 'bg-[var(--button-bg)] text-[var(--button-text)] shadow-[0_18px_45px_rgba(15,23,42,0.08)]'
                          : isCurrentPlan
                            ? 'bg-[var(--button-bg)] text-[var(--button-text)]'
                            : 'bg-[var(--bg-hover)] text-[var(--text-primary)] hover:bg-[var(--bg-soft)]'
                      }`}
                    >
                      {isCurrentPlan
                        ? 'Current Plan'
                        : plan.price_monthly <= 0 && plan.price_yearly <= 0
                          ? 'Select Plan'
                          : 'Select Plan'}
                      {!isCurrentPlan && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>

                    <div className="rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.54)] p-4">
                      <div className="mb-4 flex items-center justify-between text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        <span>Included</span>
                        <span>{plan.features.length} features</span>
                      </div>

                      <ul className="space-y-3 text-sm text-[var(--text-primary)]">
                        {plan.features.map(feature => (
                          <li key={feature} className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-soft)] text-[var(--text-primary)]">
                              <Check className="h-3 w-3" />
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.52)] p-4 text-sm">
                      <div className="flex items-center justify-between text-[var(--text-secondary)]">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[var(--text-primary)]" />
                          Agents
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {plan.limits.agents}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[var(--text-secondary)]">
                        <span className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-[var(--text-primary)]" />
                          Executions
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {plan.limits.executions}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[var(--text-secondary)]">
                        <span className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-[var(--text-primary)]" />
                          API Calls
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {plan.limits.api_calls}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[var(--text-secondary)]">
                        <span className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-[var(--text-primary)]" />
                          Storage
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {plan.limits.storage_mb}MB
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SitePageShell>
  );
}
