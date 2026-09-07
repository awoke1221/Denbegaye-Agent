import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type {
  UsageTracking,
  Profile,
  UserSubscription,
  PricingPlan,
  DatabaseResponse,
} from '@/types/database';

/**
 * Helper function to get auth token from request
 */
async function getAuthToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Helper function to verify user token
 */
async function verifyUser(token: string): Promise<{ id: string; email: string } | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  return { id: user.id, email: user.email || '' };
}

/**
 * Quota configuration per subscription tier
 */
const QUOTA_LIMITS = {
  free: {
    agent_creations: 5,
    executions: 100,
    api_calls: 1000,
    storage_mb: 100,
    concurrent_agents: 1,
  },
  pro: {
    agent_creations: 50,
    executions: 10000,
    api_calls: 100000,
    storage_mb: 1000,
    concurrent_agents: 5,
  },
  enterprise: {
    agent_creations: 999999,
    executions: 999999,
    api_calls: 999999,
    storage_mb: 999999,
    concurrent_agents: 999999,
  },
};

export interface QuotaInfo {
  agent_creations: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  executions: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  api_calls: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  storage_mb: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  credits_remaining: number;
  subscription_tier: string;
  period_start: string;
  period_end: string;
  reset_date: string;
}

/**
 * GET /api/usage/quotas
 * Fetch usage quotas and remaining limits for current user
 * Returns: QuotaInfo object with current usage and limits
 */

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    const user = await verifyUser(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Token verification failed' },
        { status: 401 }
      );
    }

    // Get user profile for credits and subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found', message: 'Unable to fetch user profile' },
        { status: 404 }
      );
    }

    const subscriptionTier = (profile.subscription_tier || 'free') as keyof typeof QUOTA_LIMITS;
    const limits = QUOTA_LIMITS[subscriptionTier];

    // Get current billing period
    // Assume monthly billing starting from subscription start date
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Fetch usage data for current period
    const { data: usageData, error: usageError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString());

    if (usageError) {
      console.error('Usage fetch error:', usageError);
      // Continue with zero usage if fetch fails
    }

    // Build usage map
    const usageMap = new Map<string, number>();
    (usageData || []).forEach((usage: UsageTracking) => {
      if (usage.metric_type) {
        usageMap.set(usage.metric_type, usage.count || 0);
      }
    });

    // Calculate quotas
    const quotaInfo: QuotaInfo = {
      agent_creations: {
        used: usageMap.get('agent_creations') || 0,
        limit: limits.agent_creations,
        remaining: Math.max(0, limits.agent_creations - (usageMap.get('agent_creations') || 0)),
        percentage: Math.round(
          ((usageMap.get('agent_creations') || 0) / limits.agent_creations) * 100
        ),
      },
      executions: {
        used: usageMap.get('executions') || 0,
        limit: limits.executions,
        remaining: Math.max(0, limits.executions - (usageMap.get('executions') || 0)),
        percentage: Math.round(((usageMap.get('executions') || 0) / limits.executions) * 100),
      },
      api_calls: {
        used: usageMap.get('api_calls') || 0,
        limit: limits.api_calls,
        remaining: Math.max(0, limits.api_calls - (usageMap.get('api_calls') || 0)),
        percentage: Math.round(((usageMap.get('api_calls') || 0) / limits.api_calls) * 100),
      },
      storage_mb: {
        used: usageMap.get('storage_mb') || 0,
        limit: limits.storage_mb,
        remaining: Math.max(0, limits.storage_mb - (usageMap.get('storage_mb') || 0)),
        percentage: Math.round(((usageMap.get('storage_mb') || 0) / limits.storage_mb) * 100),
      },
      credits_remaining: profile.credits_remaining || 0,
      subscription_tier: subscriptionTier,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      reset_date: new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString(),
    };

    return NextResponse.json(
      {
        data: quotaInfo,
      } as DatabaseResponse<QuotaInfo>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching usage quotas:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to check if user has exceeded quota
 */
export async function checkQuotaExceeded(
  userId: string,
  metricType: keyof typeof QUOTA_LIMITS.free
): Promise<boolean> {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (!profile) return true;

    const subscriptionTier = (profile.subscription_tier || 'free') as keyof typeof QUOTA_LIMITS;
    const limit = QUOTA_LIMITS[subscriptionTier][metricType as keyof typeof QUOTA_LIMITS.free];

    // Get current billing period
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get current usage
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('count')
      .eq('user_id', userId)
      .eq('metric_type', metricType)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString())
      .single();

    const currentUsage = usage?.count || 0;
    return currentUsage >= limit;
  } catch (error) {
    console.error('Error checking quota:', error);
    return true; // Fail closed - assume quota exceeded
  }
}

/**
 * Helper function to increment usage counter
 */
export async function incrementUsage(
  userId: string,
  metricType: keyof typeof QUOTA_LIMITS.free,
  amount: number = 1
): Promise<void> {
  try {
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Try to update existing record
    const { data: existing } = await supabase
      .from('usage_tracking')
      .select('id, count')
      .eq('user_id', userId)
      .eq('metric_type', metricType)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString())
      .single();

    if (existing) {
      // Update existing record
      await supabase
        .from('usage_tracking')
        .update({
          count: (existing.count || 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Create new record
      await supabase.from('usage_tracking').insert({
        user_id: userId,
        metric_type: metricType,
        count: amount,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error incrementing usage:', error);
    // Non-critical error - don't throw
  }
}
