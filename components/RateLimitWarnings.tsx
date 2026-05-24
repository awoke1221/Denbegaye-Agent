'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, TrendingUp, Zap, Activity, RefreshCw, Clock, Gauge } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabaseClient';

interface UsageData {
  userId: string;
  tier: string;
  limits: {
    requests_per_minute: number;
    requests_per_hour: number;
    requests_per_day: number;
    agents_limit: number;
    executions_per_month: number;
    api_calls_per_month: number;
    storage_mb: number;
  };
  usage: {
    minute: number;
    hour: number;
    day: number;
  };
  remaining: {
    minute: number;
    hour: number;
    day: number;
  };
  percentageUsed: {
    minute: number;
    hour: number;
    day: number;
  };
}

export function RateLimitWarnings() {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchUsageData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch('/api/user/usage', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsageData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError('Failed to fetch rate limit information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsageData, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-6 flex items-center justify-center">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          Loading rate limit information...
        </CardContent>
      </Card>
    );
  }

  if (error || !usageData) {
    return (
      <Alert className="border-red-500/30 bg-red-500/10">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-200">{error}</AlertDescription>
      </Alert>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'pro':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getUsageBadge = (percentage: number) => {
    if (percentage < 50) return 'text-green-400';
    if (percentage < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const renderLimitWarning = (name: string, current: number, limit: number, percentage: number) => {
    return (
      <div key={name} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{name}</span>
            {percentage >= 80 && (
              <AlertTriangle
                className={`w-4 h-4 ${getUsageColor(percentage).replace('bg-', 'text-')}`}
              />
            )}
          </div>
          <div
            className={`text-sm font-medium ${getUsageColor(percentage).replace('bg-', 'text-')}`}
          >
            {current} / {limit}
          </div>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className={`text-xs ${getUsageColor(percentage).replace('bg-', 'text-')}`}>
          {percentage.toFixed(1)}% of limit used
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tier Info Card */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                Rate Limits
              </CardTitle>
              <CardDescription>Your current subscription tier and usage</CardDescription>
            </div>
            <Badge className={getTierColor(usageData.tier)}>
              {usageData.tier.charAt(0).toUpperCase() + usageData.tier.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {usageData.percentageUsed.minute >= 80 && (
            <Alert className="border-yellow-500/30 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200">
                You're approaching your minute-based rate limit. Please slow down your requests.
              </AlertDescription>
            </Alert>
          )}

          {usageData.percentageUsed.hour >= 90 && (
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                You've exceeded 90% of your hourly rate limit.
              </AlertDescription>
            </Alert>
          )}

          {usageData.percentageUsed.day >= 95 && (
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                You've exceeded 95% of your daily rate limit. Please wait for the limit to reset.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <Clock className="w-3 h-3" />
                This Minute
              </div>
              <div
                className={`text-lg font-semibold ${getUsageColor(usageData.percentageUsed.minute).replace('bg-', 'text-')}`}
              >
                {usageData.usage.minute} / {usageData.limits.requests_per_minute}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <Activity className="w-3 h-3" />
                This Hour
              </div>
              <div
                className={`text-lg font-semibold ${getUsageColor(usageData.percentageUsed.hour).replace('bg-', 'text-')}`}
              >
                {usageData.usage.hour} / {usageData.limits.requests_per_hour}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <TrendingUp className="w-3 h-3" />
                This Day
              </div>
              <div
                className={`text-lg font-semibold ${getUsageColor(usageData.percentageUsed.day).replace('bg-', 'text-')}`}
              >
                {usageData.usage.day} / {usageData.limits.requests_per_day}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Usage Card */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle>Usage Breakdown</CardTitle>
          <CardDescription>Real-time rate limit monitoring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-4">Request Rate Limits</h4>
            <div className="space-y-4">
              {renderLimitWarning(
                'Requests per Minute',
                usageData.usage.minute,
                usageData.limits.requests_per_minute,
                usageData.percentageUsed.minute
              )}
              {renderLimitWarning(
                'Requests per Hour',
                usageData.usage.hour,
                usageData.limits.requests_per_hour,
                usageData.percentageUsed.hour
              )}
              {renderLimitWarning(
                'Requests per Day',
                usageData.usage.day,
                usageData.limits.requests_per_day,
                usageData.percentageUsed.day
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-semibold mb-4">Plan Limits</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-gray-400">Agents Limit</p>
                <p className="text-lg font-semibold">{usageData.limits.agents_limit}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-gray-400">Executions/Month</p>
                <p className="text-lg font-semibold">{usageData.limits.executions_per_month}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-gray-400">API Calls/Month</p>
                <p className="text-lg font-semibold">{usageData.limits.api_calls_per_month}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-gray-400">Storage</p>
                <p className="text-lg font-semibold">
                  {(usageData.limits.storage_mb / 1024).toFixed(1)} GB
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <p className="text-xs text-gray-400">
              Last updated: {lastUpdated?.toLocaleTimeString()}
            </p>
            <Button variant="ghost" size="sm" onClick={fetchUsageData} className="text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Suggestion */}
      {usageData.tier === 'free' && usageData.percentageUsed.day > 70 && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-blue-400">Upgrade Your Plan</CardTitle>
            <CardDescription>Consider upgrading to get higher rate limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-blue-200">
                You're using most of your free tier limits. Upgrade to Pro to get:
              </p>
              <ul className="text-sm text-blue-200 list-disc list-inside space-y-1">
                <li>10x higher request limits (100/min → 1000/min)</li>
                <li>Unlimited agents</li>
                <li>100GB storage</li>
                <li>Priority support</li>
              </ul>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">View Pricing Plans</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
