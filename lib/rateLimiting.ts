import { supabase, supabaseAdmin } from './supabaseClient';

const usageDatabase = supabaseAdmin || supabase;

type UsageMetric = 'agent_creations' | 'executions' | 'api_calls' | 'storage_mb';

const getCurrentPeriod = () => {
  const today = new Date();
  return {
    start: new Date(today.getFullYear(), today.getMonth(), 1),
    end: new Date(today.getFullYear(), today.getMonth() + 1, 1),
  };
};

async function getPlanLimits(userId: string) {
  const { data: profile } = await usageDatabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  const { data: plan } = await usageDatabase
    .from('pricing_plans')
    .select('limits')
    .eq('tier', profile?.subscription_tier || 'free')
    .eq('is_active', true)
    .maybeSingle();

  return {
    agents: Number(plan?.limits?.agents ?? 1),
    executions: Number(plan?.limits?.executions ?? 100),
  };
}

export async function checkAgentCreationAllowed(userId: string) {
  const limits = await getPlanLimits(userId);
  const { count, error } = await usageDatabase
    .from('user_agents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return {
    allowed: limits.agents < 0 || (count || 0) < limits.agents,
    limit: limits.agents,
    used: count || 0,
  };
}

export async function checkExecutionAllowed(userId: string) {
  const limits = await getPlanLimits(userId);
  const { start, end } = getCurrentPeriod();
  const { data, error } = await usageDatabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', userId)
    .eq('metric_type', 'executions')
    .eq('period_start', start.toISOString())
    .maybeSingle();

  if (error) throw error;
  const used = Number(data?.count || 0);
  return {
    allowed: limits.executions < 0 || used < limits.executions,
    limit: limits.executions,
    used,
    start,
    end,
  };
}

export async function incrementUsage(userId: string, metricType: UsageMetric, amount = 1) {
  const { start, end } = getCurrentPeriod();
  const { data: existing } = await usageDatabase
    .from('usage_tracking')
    .select('id, count')
    .eq('user_id', userId)
    .eq('metric_type', metricType)
    .eq('period_start', start.toISOString())
    .maybeSingle();

  if (existing) {
    await usageDatabase
      .from('usage_tracking')
      .update({ count: Number(existing.count || 0) + amount, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    return;
  }

  await usageDatabase.from('usage_tracking').insert({
    user_id: userId,
    metric_type: metricType,
    count: amount,
    period_start: start.toISOString(),
    period_end: end.toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export const getUserUsage = async (userId: string) => {
  const { start, end } = getCurrentPeriod();
  const { data } = await usageDatabase
    .from('usage_tracking')
    .select('metric_type, count')
    .eq('user_id', userId)
    .gte('period_start', start.toISOString())
    .lt('period_start', end.toISOString());
  const usage = Object.fromEntries((data || []).map(item => [item.metric_type, item.count || 0]));
  return {
    requests: { current: usage.api_calls || 0, limit: 1000, percentage: 0 },
    tokens: { current: usage.executions || 0, limit: 100000, percentage: 0 },
  };
};

export const getUserLimits = async (userId: string) => {
  const limits = await getPlanLimits(userId);
  return {
    requests: { current: 0, limit: limits.executions, percentage: 0 },
    tokens: { current: 0, limit: limits.executions, percentage: 0 },
  };
};
