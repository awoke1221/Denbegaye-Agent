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
} from 'lucide-react';
import { LoadingState } from '@/components/loading-state';
import { getUserUsage, getUserLimits } from '@/lib/rateLimiting';
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
        // Fetch subscription
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
          // Default to free plan
          setSubscription({
            plan_name: 'Free',
            plan_tier: 'free',
            status: 'active',
            billing_cycle: 'monthly',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }

        // Fetch usage statistics
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
      <div className="min-h-screen bg-[#020617] text-white p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Profile</h1>
            <Button
              onClick={signOut}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              Sign Out
            </Button>
          </div>

          {/* Profile Card */}
          <Card className="bg-[#0f172a] border-white/10">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage
                    src={
                      user.user_metadata?.avatar_url ||
                      user.user_metadata?.picture ||
                      user.photoURL ||
                      undefined
                    }
                    alt={displayName || 'User avatar'}
                  />
                  <AvatarFallback className="text-xl">{avatarInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{displayName}</CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified User
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Email Address</label>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{user.email}</span>
                      {user.email_confirmed_at && (
                        <Badge
                          variant="secondary"
                          className="bg-green-500/20 text-green-400 text-xs"
                        >
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">User ID</label>
                    <span className="font-mono text-sm">{user.id}</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Account Created</label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Last Sign In</label>
                    <span>
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Subscription & Billing */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Subscription & Billing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Current Plan</label>
                    <div className="flex items-center space-x-2">
                      <Badge
                        className={`${
                          subscription?.plan_tier === 'enterprise'
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            : subscription?.plan_tier === 'pro'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}
                      >
                        {subscription?.plan_name || 'Loading...'}
                      </Badge>
                      <span className="text-sm text-gray-400 capitalize">
                        {subscription?.billing_cycle}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Next Billing Date</label>
                    <span>
                      {subscription?.current_period_end
                        ? new Date(subscription.current_period_end).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/pricing')}
                    className="border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </Button>
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Usage Statistics */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Usage This Month
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Agents */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-blue-400" />
                        <label className="text-sm text-gray-400">AI Agents</label>
                      </div>
                      <span className="text-sm">
                        {usageStats.agents?.current || 0} / {usageStats.agents?.limit || 0}
                      </span>
                    </div>
                    <Progress value={usageStats.agents?.percentage || 0} className="h-2" />
                  </div>

                  {/* Executions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <label className="text-sm text-gray-400">Executions</label>
                      </div>
                      <span className="text-sm">
                        {usageStats.executions?.current || 0} / {usageStats.executions?.limit || 0}
                      </span>
                    </div>
                    <Progress value={usageStats.executions?.percentage || 0} className="h-2" />
                  </div>

                  {/* API Calls */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <label className="text-sm text-gray-400">API Calls</label>
                      </div>
                      <span className="text-sm">
                        {usageStats.api_calls?.current || 0} / {usageStats.api_calls?.limit || 0}
                      </span>
                    </div>
                    <Progress value={usageStats.api_calls?.percentage || 0} className="h-2" />
                  </div>

                  {/* Storage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-purple-400" />
                        <label className="text-sm text-gray-400">Storage</label>
                      </div>
                      <span className="text-sm">
                        {usageStats.storage_mb?.current || 0}MB /{' '}
                        {usageStats.storage_mb?.limit || 0}
                        MB
                      </span>
                    </div>
                    <Progress value={usageStats.storage_mb?.percentage || 0} className="h-2" />
                  </div>
                </div>
              </div>

              <Separator className="bg-white/10" />
              <div>
                <h3 className="text-lg font-semibold mb-4">Authentication</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                    {user.app_metadata?.provider === 'google'
                      ? 'Google'
                      : user.app_metadata?.provider === 'github'
                        ? 'GitHub'
                        : 'Email & Password'}
                  </Badge>
                  <span className="text-sm text-gray-400">
                    {user.app_metadata?.provider
                      ? `Signed in with ${user.app_metadata.provider}`
                      : 'Signed in with email and password'}
                  </span>
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Account Actions */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => router.push('/agent-builder')}>
                    Go to Agent Builder
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/')}>
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
