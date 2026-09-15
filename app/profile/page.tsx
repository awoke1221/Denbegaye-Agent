'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/AuthGuard';
import { extractAvatarInitials, getUserDisplayName } from '@/lib/avatar-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Calendar,
  Shield,
  User,
  CreditCard,
  TrendingUp,
  Zap,
  Database,
  Bot,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { LoadingState } from '@/components/loading-state';
import { getUserUsage } from '@/lib/rateLimiting';
import { supabase } from '@/lib/supabaseClient';
import {
  OFFICE_AGENTS,
  OFFICE_CATEGORIES,
  getAgentCountByCategoryId,
} from '@/lib/office-intelligence-data';

interface Subscription {
  plan_name: string;
  plan_tier: string;
  status: string;
  billing_cycle: string;
  current_period_end: string;
}

interface UsageStats {
  [key: string]: {
    current: number;
    limit: number;
    percentage: number;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats>({});
  const [canceling, setCanceling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [officeRecentCount, setOfficeRecentCount] = useState(0);
  const [officeFavoriteCount, setOfficeFavoriteCount] = useState(0);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user) return;

      try {
        const { data: subData, error: subError } = await supabase
          .from('user_subscriptions')
          .select('pricing_plans!inner(name, tier), status, billing_cycle, current_period_end')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (!subError && subData) {
          setSubscription({
            plan_name: subData.pricing_plans?.[0]?.name || 'Free',
            plan_tier: subData.pricing_plans?.[0]?.tier || 'free',
            status: subData.status,
            billing_cycle: subData.billing_cycle,
            current_period_end: subData.current_period_end,
          });
        } else {
          setSubscription({
            plan_name: 'Free',
            plan_tier: 'free',
            status: 'active',
            billing_cycle: 'monthly',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }

        const usage = await getUserUsage(user.id);
        setUsageStats(usage);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
      }
    };

    if (user) {
      fetchSubscriptionData();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    try {
      const recent = window.localStorage.getItem(`office-intelligence-sessions:${user.id}`);
      const favorites = window.localStorage.getItem(`office-intelligence-favorites:${user.id}`);
      const parsedRecent = recent ? JSON.parse(recent) : [];
      const parsedFavorites = favorites ? JSON.parse(favorites) : [];
      setOfficeRecentCount(Array.isArray(parsedRecent) ? parsedRecent.length : 0);
      setOfficeFavoriteCount(Array.isArray(parsedFavorites) ? parsedFavorites.length : 0);
    } catch {
      setOfficeRecentCount(0);
      setOfficeFavoriteCount(0);
    }
  }, [user]);

  const handleCancelSubscription = async () => {
    if (!user || !subscription || subscription.plan_tier === 'free') return;
    if (!window.confirm('Cancel recurring PayPal payments for this subscription?')) return;

    try {
      setCanceling(true);
      setCancelMessage(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Your session has expired. Please sign in again.');

      const response = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Canceled by customer from profile' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to cancel subscription.');

      setSubscription({
        ...subscription,
        status: 'canceled',
        plan_tier: 'free',
        plan_name: 'Free',
      });
      setCancelMessage('Recurring PayPal payments have been canceled.');
    } catch (error) {
      setCancelMessage(error instanceof Error ? error.message : 'Unable to cancel subscription.');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return (
      <AuthGuard>
        <LoadingState />
      </AuthGuard>
    );
  }

  const displayName = getUserDisplayName(user);
  const avatarInitials = extractAvatarInitials(user);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                Account overview
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--text-primary)] sm:text-4xl">
                Profile
              </h1>
            </div>

            <Button
              onClick={signOut}
              variant="outline"
              className="border-[var(--border-default)] bg-[rgba(255,255,255,0.64)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            >
              Sign Out
            </Button>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden border border-[var(--border-default)] bg-[rgba(255,255,255,0.72)] shadow-[0_30px_80px_rgba(15,23,42,0.05)]">
              <div className="border-b border-[var(--border-default)] bg-[rgba(255,255,255,0.55)] p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border border-[var(--border-default)] bg-[var(--bg-soft)] shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                      {(() => {
                        const src =
                          typeof user.user_metadata?.avatar_url === 'string'
                            ? user.user_metadata.avatar_url
                            : typeof user.user_metadata?.picture === 'string'
                              ? user.user_metadata.picture
                              : typeof user.photoURL === 'string'
                                ? user.photoURL
                                : undefined;

                        return <AvatarImage src={src} alt={displayName || 'User avatar'} />;
                      })()}
                      <AvatarFallback className="bg-[var(--button-bg)] text-lg font-bold text-[var(--button-text)]">
                        {avatarInitials}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <CardTitle className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                        {displayName}
                      </CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge className="border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                          <Shield className="mr-1 h-3 w-3" />
                          Verified User
                        </Badge>
                        <Badge className="border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                          <Sparkles className="mr-1 h-3 w-3" />
                          Pro workspace
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push('/agent-builder')}
                    className="bg-[var(--button-bg)] text-[var(--button-text)] shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
                  >
                    Go to Builder
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <CardContent className="space-y-8 p-6 sm:p-8">
                <div>
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-[var(--text-primary)]">
                    <User className="mr-2 h-5 w-5 text-[var(--text-primary)]" />
                    Account Information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.55)] p-4">
                      <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        Email address
                      </label>
                      <div className="mt-2 flex items-center gap-2 text-[var(--text-primary)]">
                        <Mail className="h-4 w-4 text-[var(--text-tertiary)]" />
                        <span>{user.email}</span>
                        {user.email_confirmed_at && (
                          <Badge className="ml-auto border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.55)] p-4">
                      <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        User ID
                      </label>
                      <div className="mt-2 font-mono text-sm text-[var(--text-primary)]">
                        {user.id}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.55)] p-4">
                      <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        Account created
                      </label>
                      <div className="mt-2 flex items-center gap-2 text-[var(--text-primary)]">
                        <Calendar className="h-4 w-4 text-[var(--text-tertiary)]" />
                        <span>
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.55)] p-4">
                      <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        Last sign in
                      </label>
                      <div className="mt-2 text-[var(--text-primary)]">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-[var(--border-default)]" />

                <div>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="flex items-center text-lg font-semibold text-[var(--text-primary)]">
                        <Bot className="mr-2 h-5 w-5 text-[var(--text-primary)]" />
                        Office Intelligence
                      </h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Your signed-in workspace activity and available analysis categories.
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push('/office-intelligence')}
                      className="bg-[var(--button-bg)] text-[var(--button-text)]"
                    >
                      Open workspace
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mb-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.55)] p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        Recent sessions
                      </div>
                      <div className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                        {officeRecentCount}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.55)] p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        Favorite agents
                      </div>
                      <div className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                        {officeFavoriteCount}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {OFFICE_CATEGORIES.map(category => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => router.push(`/office-intelligence?category=${category.id}`)}
                        className="rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.55)] p-4 text-left transition-colors hover:bg-[var(--bg-hover)]"
                      >
                        <div className="font-semibold text-[var(--text-primary)]">
                          {category.name}
                        </div>
                        <div className="mt-1 text-sm text-[var(--text-secondary)]">
                          {getAgentCountByCategoryId(category.id)} agents available
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                    {OFFICE_AGENTS.length} analysis agents are available in your workspace.
                  </p>
                </div>

                <Separator className="bg-[var(--border-default)]" />

                <div>
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-[var(--text-primary)]">
                    <CreditCard className="mr-2 h-5 w-5 text-[var(--text-primary)]" />
                    Subscription & Billing
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.55)] p-4">
                      <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        Current plan
                      </label>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          className={`${
                            subscription?.plan_tier === 'enterprise'
                              ? 'border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                              : subscription?.plan_tier === 'pro'
                                ? 'border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                                : 'border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {subscription?.plan_name || 'Loading...'}
                        </Badge>
                        <span className="text-sm capitalize text-[var(--text-secondary)]">
                          {subscription?.billing_cycle}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.55)] p-4">
                      <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        Next billing date
                      </label>
                      <div className="mt-2 text-[var(--text-primary)]">
                        {subscription?.current_period_end
                          ? new Date(subscription.current_period_end).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={() => router.push('/pricing')}
                        className="border-[var(--border-default)] bg-[rgba(255,255,255,0.65)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                      >
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Manage Subscription
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/office-intelligence/dashboard')}
                        className="border-[var(--border-default)] bg-[rgba(255,255,255,0.65)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                      >
                        Dashboard
                      </Button>
                      {subscription?.plan_tier !== 'free' && subscription?.status === 'active' && (
                        <Button
                          variant="outline"
                          onClick={handleCancelSubscription}
                          disabled={canceling}
                          className="border-[var(--border-default)] bg-[rgba(255,255,255,0.65)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                        >
                          {canceling ? 'Canceling...' : 'Cancel recurring payments'}
                        </Button>
                      )}
                    </div>
                    {cancelMessage && (
                      <p className="mt-3 text-sm text-[var(--text-secondary)]">{cancelMessage}</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-[var(--border-default)]" />

                <div>
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-[var(--text-primary)]">
                    <TrendingUp className="mr-2 h-5 w-5 text-[var(--text-primary)]" />
                    Usage This Month
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.55)] p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[var(--text-primary)]">
                          <Bot className="h-4 w-4 text-[var(--text-primary)]" />
                          <span>AI Agents</span>
                        </div>
                        <span className="text-sm text-[var(--text-secondary)]">
                          {usageStats.agents?.current || 0} / {usageStats.agents?.limit || 0}
                        </span>
                      </div>
                      <Progress value={usageStats.agents?.percentage || 0} className="h-2" />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-200">
                          <Zap className="h-4 w-4 text-amber-300" />
                          <span>Executions</span>
                        </div>
                        <span className="text-sm text-slate-300">
                          {usageStats.executions?.current || 0} /{' '}
                          {usageStats.executions?.limit || 0}
                        </span>
                      </div>
                      <Progress value={usageStats.executions?.percentage || 0} className="h-2" />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-200">
                          <TrendingUp className="h-4 w-4 text-emerald-300" />
                          <span>API Calls</span>
                        </div>
                        <span className="text-sm text-slate-300">
                          {usageStats.api_calls?.current || 0} / {usageStats.api_calls?.limit || 0}
                        </span>
                      </div>
                      <Progress value={usageStats.api_calls?.percentage || 0} className="h-2" />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-200">
                          <Database className="h-4 w-4 text-violet-300" />
                          <span>Storage</span>
                        </div>
                        <span className="text-sm text-slate-300">
                          {usageStats.storage_mb?.current || 0}MB /{' '}
                          {usageStats.storage_mb?.limit || 0}MB
                        </span>
                      </div>
                      <Progress value={usageStats.storage_mb?.percentage || 0} className="h-2" />
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div>
                  <h3 className="mb-4 text-lg font-semibold text-white">Authentication</h3>
                  <div className="flex items-center gap-2">
                    <Badge className="border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
                      {user.app_metadata?.provider === 'google'
                        ? 'Google'
                        : user.app_metadata?.provider === 'github'
                          ? 'GitHub'
                          : 'Email & Password'}
                    </Badge>
                    <span className="text-sm text-slate-300">
                      {user.app_metadata?.provider
                        ? `Signed in with ${user.app_metadata.provider}`
                        : 'Signed in with email and password'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/agent-builder')}
                    className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                  >
                    Go to Agent Builder
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                    className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
