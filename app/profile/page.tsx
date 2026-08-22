'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/AuthGuard';
import { extractAvatarInitials, getUserDisplayName } from '@/lib/avatar-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [loadingData, setLoadingData] = useState(true);

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
        setLoadingData(false);
      }
    };

    if (user) {
      fetchSubscriptionData();
    }
  }, [user]);

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
      <div className="min-h-screen bg-[#020817] text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Account overview
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Profile
              </h1>
            </div>

            <Button
              onClick={signOut}
              variant="outline"
              className="border-red-500/40 bg-red-500/5 text-red-200 hover:bg-red-500 hover:text-white"
            >
              Sign Out
            </Button>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden border border-white/10 bg-slate-950/70 shadow-[0_30px_80px_rgba(15,23,42,0.8)]">
              <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.12),transparent_22%)] p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border border-white/10 bg-slate-900 shadow-lg shadow-cyan-500/10">
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
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-indigo-500 text-lg font-bold text-white">
                        {avatarInitials}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <CardTitle className="text-2xl font-bold text-white sm:text-3xl">
                        {displayName}
                      </CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge className="border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
                          <Shield className="mr-1 h-3 w-3" />
                          Verified User
                        </Badge>
                        <Badge className="border border-violet-400/20 bg-violet-500/10 text-violet-200">
                          <Sparkles className="mr-1 h-3 w-3" />
                          Pro workspace
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push('/agent-builder')}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_16px_40px_rgba(34,211,238,0.35)]"
                  >
                    Go to Builder
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <CardContent className="space-y-8 p-6 sm:p-8">
                <div>
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                    <User className="mr-2 h-5 w-5 text-cyan-300" />
                    Account Information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Email address
                      </label>
                      <div className="mt-2 flex items-center gap-2 text-slate-100">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span>{user.email}</span>
                        {user.email_confirmed_at && (
                          <Badge className="ml-auto border border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        User ID
                      </label>
                      <div className="mt-2 font-mono text-sm text-slate-200">{user.id}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Account created
                      </label>
                      <div className="mt-2 flex items-center gap-2 text-slate-200">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Last sign in
                      </label>
                      <div className="mt-2 text-slate-200">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div>
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                    <CreditCard className="mr-2 h-5 w-5 text-cyan-300" />
                    Subscription & Billing
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Current plan
                      </label>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          className={`${
                            subscription?.plan_tier === 'enterprise'
                              ? 'border border-violet-400/20 bg-violet-500/10 text-violet-200'
                              : subscription?.plan_tier === 'pro'
                                ? 'border border-cyan-400/20 bg-cyan-500/10 text-cyan-200'
                                : 'border border-slate-400/20 bg-slate-500/10 text-slate-300'
                          }`}
                        >
                          {subscription?.plan_name || 'Loading...'}
                        </Badge>
                        <span className="text-sm capitalize text-slate-300">
                          {subscription?.billing_cycle}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Next billing date
                      </label>
                      <div className="mt-2 text-slate-200">
                        {subscription?.current_period_end
                          ? new Date(subscription.current_period_end).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/pricing')}
                      className="border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500 hover:text-white"
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Manage Subscription
                    </Button>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div>
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                    <TrendingUp className="mr-2 h-5 w-5 text-cyan-300" />
                    Usage This Month
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-200">
                          <Bot className="h-4 w-4 text-cyan-300" />
                          <span>AI Agents</span>
                        </div>
                        <span className="text-sm text-slate-300">
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
