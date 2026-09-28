'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Clock3,
  Download,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  RefreshCw,
  Star,
  Trash2,
  XCircle,
  Users,
} from 'lucide-react';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import {
  OFFICE_AGENTS,
  OFFICE_CATEGORIES,
  getAgentById,
  getAgentCountByCategoryId,
} from '@/lib/office-intelligence-data';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OfficeSession {
  id: string;
  agentId: string;
  title: string;
  time: string;
}

interface OfficeExecution {
  id: string;
  agentId: string;
  prompt: string;
  mode: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  durationMs?: number;
  error?: string;
  tokensUsed?: number;
  costUsd?: number;
  model?: string;
}

interface BackendUsageSummary {
  totalTokens?: number;
  totalCostUsd?: number;
  averageExecutionMs?: number;
  completedExecutions?: number;
  failedExecutions?: number;
  runningExecutions?: number;
  totalExecutions?: number;
  agentUsage?: Array<{
    id: string;
    name?: string;
    tokens: number;
    cost: number;
    runs: number;
  }>;
}

interface QuotaMetric {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}

interface QuotaInfo {
  executions: QuotaMetric;
  api_calls: QuotaMetric;
  agent_creations: QuotaMetric;
  storage_mb: QuotaMetric;
  subscription_tier: string;
  credits_remaining: number;
}

const normalizeNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const resolveUsageSummary = (payload: any): BackendUsageSummary | null => {
  const root = payload?.data ?? payload ?? {};
  if (!root || typeof root !== 'object') {
    return null;
  }

  const totals = root.totals ?? root.summary ?? root.metrics ?? root.usage ?? root;
  const totalTokens =
    normalizeNumber(root.total_tokens) ||
    normalizeNumber(root.totalTokens) ||
    normalizeNumber(root.tokensUsed) ||
    normalizeNumber(root.tokens_used) ||
    normalizeNumber(totals?.total_tokens) ||
    normalizeNumber(totals?.totalTokens) ||
    normalizeNumber(totals?.tokensUsed) ||
    normalizeNumber(totals?.tokens_used);

  const totalCostUsd =
    normalizeNumber(root.total_cost) ||
    normalizeNumber(root.totalCostUsd) ||
    normalizeNumber(root.costUsd) ||
    normalizeNumber(root.cost_usd) ||
    normalizeNumber(totals?.total_cost) ||
    normalizeNumber(totals?.totalCostUsd) ||
    normalizeNumber(totals?.costUsd) ||
    normalizeNumber(totals?.cost_usd);

  const averageExecutionMs =
    normalizeNumber(root.average_execution_ms) ||
    normalizeNumber(root.averageExecutionMs) ||
    normalizeNumber(root.avg_latency_ms) ||
    normalizeNumber(root.avgLatencyMs) ||
    normalizeNumber(totals?.average_execution_ms) ||
    normalizeNumber(totals?.averageExecutionMs) ||
    normalizeNumber(totals?.avg_latency_ms) ||
    normalizeNumber(totals?.avgLatencyMs);

  const completedExecutions =
    normalizeNumber(root.completed) ||
    normalizeNumber(root.completedExecutions) ||
    normalizeNumber(totals?.completed) ||
    normalizeNumber(totals?.completedExecutions);

  const failedExecutions =
    normalizeNumber(root.failed) ||
    normalizeNumber(root.failedExecutions) ||
    normalizeNumber(totals?.failed) ||
    normalizeNumber(totals?.failedExecutions);

  const runningExecutions =
    normalizeNumber(root.running) ||
    normalizeNumber(root.runningExecutions) ||
    normalizeNumber(totals?.running) ||
    normalizeNumber(totals?.runningExecutions);

  const totalExecutions =
    normalizeNumber(root.executions) ||
    normalizeNumber(root.totalExecutions) ||
    normalizeNumber(totals?.executions) ||
    normalizeNumber(totals?.totalExecutions);

  const agentUsageSource =
    root.agentUsage ??
    root.agent_usage ??
    root.topAgents ??
    root.top_agents ??
    totals?.agentUsage ??
    totals?.agent_usage ??
    totals?.topAgents ??
    totals?.top_agents ??
    [];

  const agentUsage = Array.isArray(agentUsageSource)
    ? agentUsageSource.map((entry: any) => {
        const id =
          entry?.agentId ?? entry?.agent_id ?? entry?.id ?? entry?.agent?.id ?? entry?.name ?? '';
        const name = entry?.name ?? entry?.agentName ?? entry?.agent_name ?? '';
        return {
          id: String(id),
          name,
          tokens: normalizeNumber(entry?.tokens ?? entry?.tokensUsed ?? entry?.tokenCount ?? 0),
          cost: normalizeNumber(entry?.cost ?? entry?.costUsd ?? entry?.estimatedCost ?? 0),
          runs: normalizeNumber(entry?.runs ?? entry?.count ?? entry?.totalRuns ?? 0),
        };
      })
    : [];

  return {
    totalTokens: totalTokens || undefined,
    totalCostUsd: totalCostUsd || undefined,
    averageExecutionMs: averageExecutionMs || undefined,
    completedExecutions: completedExecutions || undefined,
    failedExecutions: failedExecutions || undefined,
    runningExecutions: runningExecutions || undefined,
    totalExecutions: totalExecutions || undefined,
    agentUsage: agentUsage.length > 0 ? agentUsage : undefined,
  };
};

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 1000 ? 0 : 1,
    notation: value >= 1000 ? 'compact' : 'standard',
  }).format(value);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(value);

export default function OfficeIntelligenceDashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<OfficeSession[]>([]);
  const [favoriteAgentIds, setFavoriteAgentIds] = useState<string[]>([]);
  const [executions, setExecutions] = useState<OfficeExecution[]>([]);
  const [executionStatusFilter, setExecutionStatusFilter] = useState<
    'all' | OfficeExecution['status']
  >('all');
  const [executionModeFilter, setExecutionModeFilter] = useState('all');
  const [refreshToken, setRefreshToken] = useState(0);
  const [liveUsageSummary, setLiveUsageSummary] = useState<BackendUsageSummary | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [approvalDecisions, setApprovalDecisions] = useState<
    Record<string, 'pending' | 'approved' | 'needs-revision'>
  >({});

  useEffect(() => {
    if (!user) return;

    try {
      const storedSessions = window.localStorage.getItem(`office-intelligence-sessions:${user.id}`);
      const storedFavorites = window.localStorage.getItem(
        `office-intelligence-favorites:${user.id}`
      );
      const storedExecutions = window.localStorage.getItem(
        `office-intelligence-executions:${user.id}`
      );
      const parsedSessions = storedSessions ? JSON.parse(storedSessions) : [];
      const parsedFavorites = storedFavorites ? JSON.parse(storedFavorites) : [];
      const parsedExecutions = storedExecutions ? JSON.parse(storedExecutions) : [];
      setSessions(Array.isArray(parsedSessions) ? parsedSessions : []);
      setFavoriteAgentIds(Array.isArray(parsedFavorites) ? parsedFavorites : []);
      setExecutions(Array.isArray(parsedExecutions) ? parsedExecutions : []);
    } catch {
      setSessions([]);
      setFavoriteAgentIds([]);
      setExecutions([]);
    }
  }, [refreshToken, user]);

  useEffect(() => {
    if (!user) {
      setLiveUsageSummary(null);
      setQuotaInfo(null);
      setLastUpdatedAt(null);
      return;
    }

    let isMounted = true;
    const updateInterval = window.setInterval(() => {
      setRefreshToken(value => value + 1);
    }, 15000);

    const loadLiveUsage = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          return;
        }

        const [usageResponse, quotaResponse] = await Promise.all([
          fetch('/api/user/usage', {
            method: 'GET',
            cache: 'no-store',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch('/api/usage/quotas', {
            method: 'GET',
            cache: 'no-store',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (usageResponse.ok) {
          const usagePayload = await usageResponse.json();
          const summary = resolveUsageSummary(usagePayload);
          if (isMounted && summary) {
            setLiveUsageSummary(summary);
            setLastUpdatedAt(new Date());
          }
        }

        if (quotaResponse.ok) {
          const quotaPayload = await quotaResponse.json();
          const nextQuota = quotaPayload?.data ?? quotaPayload;
          if (isMounted && nextQuota && typeof nextQuota === 'object') {
            setQuotaInfo({
              executions: nextQuota.executions ?? {
                used: 0,
                limit: 0,
                remaining: 0,
                percentage: 0,
              },
              api_calls: nextQuota.api_calls ?? { used: 0, limit: 0, remaining: 0, percentage: 0 },
              agent_creations: nextQuota.agent_creations ?? {
                used: 0,
                limit: 0,
                remaining: 0,
                percentage: 0,
              },
              storage_mb: nextQuota.storage_mb ?? {
                used: 0,
                limit: 0,
                remaining: 0,
                percentage: 0,
              },
              subscription_tier: nextQuota.subscription_tier ?? 'free',
              credits_remaining: nextQuota.credits_remaining ?? 0,
            });
          }
        }
      } catch (error) {
        console.warn('Could not load live Office Intelligence usage metrics:', error);
      }
    };

    loadLiveUsage();

    return () => {
      isMounted = false;
      window.clearInterval(updateInterval);
    };
  }, [user?.id, refreshToken]);

  const categoryActivity = useMemo(
    () =>
      OFFICE_CATEGORIES.map(category => {
        const agentIds = OFFICE_AGENTS.filter(agent => agent.categoryId === category.id).map(
          agent => agent.id
        );
        const recentCount = sessions.filter(session => agentIds.includes(session.agentId)).length;
        const favoriteCount = favoriteAgentIds.filter(agentId => agentIds.includes(agentId)).length;
        return { category, agentIds, recentCount, favoriteCount };
      }),
    [favoriteAgentIds, sessions]
  );

  const activeCategories = categoryActivity.filter(item => item.recentCount > 0).length;
  const mostRecentSessions = sessions.slice(0, 5);
  const localRunningExecutions = executions.filter(
    execution => execution.status === 'running'
  ).length;
  const localCompletedExecutions = executions.filter(
    execution => execution.status === 'completed'
  ).length;
  const localFailedExecutions = executions.filter(
    execution => execution.status === 'failed'
  ).length;

  const localTokenTotal = executions.reduce(
    (sum, execution) => sum + (execution.tokensUsed ?? 0),
    0
  );
  const localCostTotal = executions.reduce((sum, execution) => {
    if (typeof execution.costUsd === 'number') {
      return sum + execution.costUsd;
    }
    const estimated = (execution.tokensUsed ?? 0) * 0.00006;
    return sum + estimated;
  }, 0);
  const localAverageExecutionMs =
    executions.length > 0
      ? Math.round(
          executions.reduce((sum, execution) => sum + (execution.durationMs ?? 0), 0) /
            executions.length
        )
      : 0;

  const totalTokensUsed = liveUsageSummary?.totalTokens ?? localTokenTotal;
  const totalCostUsd = liveUsageSummary?.totalCostUsd ?? localCostTotal;
  const averageExecutionMs = liveUsageSummary?.averageExecutionMs ?? localAverageExecutionMs;
  const completedExecutions = liveUsageSummary?.completedExecutions ?? localCompletedExecutions;
  const failedExecutions = liveUsageSummary?.failedExecutions ?? localFailedExecutions;
  const runningExecutions = liveUsageSummary?.runningExecutions ?? localRunningExecutions;

  const localAgentUsage = OFFICE_AGENTS.map(agent => {
    const relatedExecutions = executions.filter(execution => execution.agentId === agent.id);
    const tokenCount = relatedExecutions.reduce(
      (sum, execution) => sum + (execution.tokensUsed ?? 0),
      0
    );
    return {
      agent,
      runs: relatedExecutions.length,
      tokens: tokenCount,
      cost: relatedExecutions.reduce((sum, execution) => {
        if (typeof execution.costUsd === 'number') {
          return sum + execution.costUsd;
        }
        return sum + (execution.tokensUsed ?? 0) * 0.00006;
      }, 0),
    };
  })
    .filter(item => item.runs > 0)
    .sort((left, right) => right.tokens - left.tokens)
    .slice(0, 5);

  const agentUsage =
    liveUsageSummary?.agentUsage && liveUsageSummary.agentUsage.length > 0
      ? liveUsageSummary.agentUsage
          .map(item => {
            const agent = getAgentById(item.id) ??
              OFFICE_AGENTS.find(candidate => candidate.name === item.name) ?? {
                id: item.id,
                name: item.name || 'Unknown agent',
                categoryId: 'general',
              };
            return {
              agent,
              runs: item.runs,
              tokens: item.tokens,
              cost: item.cost,
            };
          })
          .filter(item => item.runs > 0)
          .sort((left, right) => right.tokens - left.tokens)
          .slice(0, 5)
      : localAgentUsage;

  const filteredExecutions = executions.filter(execution => {
    const matchesStatus =
      executionStatusFilter === 'all' || execution.status === executionStatusFilter;
    const matchesMode = executionModeFilter === 'all' || execution.mode === executionModeFilter;
    return matchesStatus && matchesMode;
  });

  const quotaCards = [
    {
      key: 'executions',
      label: 'Executions',
      metric: quotaInfo?.executions,
      tone: 'emerald',
    },
    {
      key: 'api_calls',
      label: 'API calls',
      metric: quotaInfo?.api_calls,
      tone: 'blue',
    },
    {
      key: 'agent_creations',
      label: 'Agent creation',
      metric: quotaInfo?.agent_creations,
      tone: 'amber',
    },
    {
      key: 'storage_mb',
      label: 'Storage',
      metric: quotaInfo?.storage_mb,
      tone: 'violet',
    },
  ] as const;

  const getExecutionQualityScore = (execution: OfficeExecution) => {
    let score = 100;

    if (execution.status === 'failed') score -= 35;
    if (execution.status === 'cancelled') score -= 25;
    if (execution.status === 'running') score -= 10;
    if (execution.error) score -= 12;
    if (execution.durationMs && execution.durationMs > 60000) score -= 10;
    if ((execution.tokensUsed ?? 0) === 0 && execution.status === 'completed') score -= 8;
    if (execution.mode === 'report' && execution.status === 'completed') score += 4;

    return Math.min(100, Math.max(0, score));
  };

  const averageQualityScore =
    executions.length > 0
      ? Math.round(
          executions.reduce((sum, execution) => sum + getExecutionQualityScore(execution), 0) /
            executions.length
        )
      : 0;

  const qualityReviewItems = executions
    .map(execution => ({
      execution,
      score: getExecutionQualityScore(execution),
      decision: approvalDecisions[execution.id] ?? 'pending',
    }))
    .filter(item => item.score < 80 || item.execution.status === 'failed')
    .sort((left, right) => left.score - right.score)
    .slice(0, 4);

  const markApprovalDecision = (executionId: string, decision: 'approved' | 'needs-revision') => {
    setApprovalDecisions(previous => ({
      ...previous,
      [executionId]: decision,
    }));

    if (!user) return;

    try {
      const storageKey = `office-intelligence-approvals:${user.id}`;
      const existing = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}');
      existing[executionId] = decision;
      window.localStorage.setItem(storageKey, JSON.stringify(existing));
    } catch {
      // Ignore storage issues.
    }
  };

  const refreshStatusText = lastUpdatedAt
    ? `Last synced ${new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      }).format(lastUpdatedAt)}`
    : 'Waiting for live sync';

  const exportExecutionReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      user_id: user?.id,
      totals: {
        executions: executions.length,
        completed: completedExecutions,
        failed: failedExecutions,
        running: runningExecutions,
      },
      executions,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `office-intelligence-executions-${new Date().toISOString()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearExecutionHistory = () => {
    if (!user || !window.confirm('Clear your Office Intelligence execution history?')) return;
    window.localStorage.removeItem(`office-intelligence-executions:${user.id}`);
    setExecutions([]);
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[var(--bg-page)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/office-intelligence"
                className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Office Intelligence
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)]">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Office Intelligence Dashboard
                  </h1>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Your signed-in analysis activity, categories, and saved agents.
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {refreshStatusText}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setRefreshToken(value => value + 1)}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button variant="outline" onClick={exportExecutionReport}>
                <Download className="mr-2 h-4 w-4" /> Export runs
              </Button>
              <Button asChild className="bg-[var(--button-bg)] text-[var(--button-text)]">
                <Link href="/office-intelligence">
                  Open agent hub <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Available agents</CardTitle>
                <Users className="h-4 w-4 text-[var(--text-tertiary)]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{OFFICE_AGENTS.length}</div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Recent sessions</CardTitle>
                <Clock3 className="h-4 w-4 text-[var(--text-tertiary)]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{sessions.length}</div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Favorite agents</CardTitle>
                <Star className="h-4 w-4 text-[var(--text-tertiary)]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{favoriteAgentIds.length}</div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Running executions</CardTitle>
                <BarChart3 className="h-4 w-4 text-[var(--text-tertiary)]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{runningExecutions}</div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">
                  {activeCategories} active categories
                </div>
              </CardContent>
            </Card>
          </section>

          <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
            <CardHeader>
              <CardTitle>AI capability catalog</CardTitle>
              <p className="text-sm text-[var(--text-secondary)]">
                Worker-backed analysis areas available to this account.
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {OFFICE_CATEGORIES.map(category => (
                <Link
                  key={category.id}
                  href={`/office-intelligence?category=${category.id}`}
                  className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 hover:bg-[var(--bg-hover)]"
                >
                  <div className="font-medium">{category.name}</div>
                  <div className="mt-1 text-xs text-[var(--text-secondary)]">
                    {getAgentCountByCategoryId(category.id)} specialized agents
                  </div>
                  <div className="mt-3 text-xs text-[var(--text-tertiary)]">
                    Upload, analyze, report, and review results.
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Completed runs</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedExecutions}</div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Failed runs</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{failedExecutions}</div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">AI tokens used</CardTitle>
                <LoaderCircle className="h-4 w-4 text-[var(--text-tertiary)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCompactNumber(totalTokensUsed)}</div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">
                  Combined across all runs
                </div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Est. cost</CardTitle>
                <BarChart3 className="h-4 w-4 text-[var(--text-tertiary)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalCostUsd)}</div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">
                  Avg run: {averageExecutionMs} ms
                </div>
              </CardContent>
            </Card>
          </section>

          <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Quota & usage guardrails</CardTitle>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {quotaInfo
                      ? `Plan: ${quotaInfo.subscription_tier.toUpperCase()} • Credits remaining: ${quotaInfo.credits_remaining}`
                      : 'Usage and plan guardrails for this Office Intelligence workspace.'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {quotaCards.map(({ key, label, metric, tone }) => {
                const percentage = Math.min(metric?.percentage ?? 0, 100);
                const toneClass =
                  tone === 'emerald'
                    ? 'bg-emerald-500'
                    : tone === 'blue'
                      ? 'bg-sky-500'
                      : tone === 'amber'
                        ? 'bg-amber-500'
                        : 'bg-violet-500';

                return (
                  <div
                    key={key}
                    className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                      <span className="text-[var(--text-secondary)]">{label}</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <div className="text-2xl font-semibold">
                      {metric ? formatCompactNumber(metric.used) : '0'}
                    </div>
                    <div className="mt-1 text-xs text-[var(--text-secondary)]">
                      {metric ? `${metric.remaining} remaining of ${metric.limit}` : '0 remaining'}
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-page)]">
                      <div
                        className={`h-full rounded-full ${toneClass}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_1.8fr]">
            <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
              <CardHeader>
                <CardTitle>AI quality & review queue</CardTitle>
                <p className="text-sm text-[var(--text-secondary)]">
                  Human review for low-confidence or failed outputs before they are accepted as
                  final.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                    <div className="text-xs uppercase text-[var(--text-tertiary)]">
                      Avg quality score
                    </div>
                    <div className="mt-2 text-2xl font-semibold">{averageQualityScore}/100</div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                    <div className="text-xs uppercase text-[var(--text-tertiary)]">
                      Needs review
                    </div>
                    <div className="mt-2 text-2xl font-semibold">{qualityReviewItems.length}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {qualityReviewItems.length > 0 ? (
                    qualityReviewItems.map(({ execution, score, decision }) => {
                      const agent = getAgentById(execution.agentId);
                      return (
                        <div
                          key={execution.id}
                          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium">
                                {agent?.name || execution.agentId}
                              </div>
                              <div className="text-xs text-[var(--text-secondary)]">
                                {execution.status} • {execution.mode}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{score}</div>
                              <div className="text-[10px] uppercase text-[var(--text-tertiary)]">
                                quality
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant={decision === 'approved' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => markApprovalDecision(execution.id, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant={decision === 'needs-revision' ? 'secondary' : 'outline'}
                              size="sm"
                              onClick={() => markApprovalDecision(execution.id, 'needs-revision')}
                            >
                              Needs revision
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-[var(--border-default)] p-5 text-sm text-[var(--text-secondary)]">
                      No review items flagged right now. Output quality is within the current
                      threshold.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
              <CardHeader>
                <CardTitle>AI usage & performance</CardTitle>
                <p className="text-sm text-[var(--text-secondary)]">
                  {liveUsageSummary
                    ? 'Live backend usage synced from your authenticated Office Intelligence activity.'
                    : 'Token consumption, estimated spend, and top usage by agent.'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                    <div className="text-xs uppercase text-[var(--text-tertiary)]">
                      Total tokens
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                      {formatCompactNumber(totalTokensUsed)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                    <div className="text-xs uppercase text-[var(--text-tertiary)]">Avg latency</div>
                    <div className="mt-2 text-2xl font-semibold">{averageExecutionMs} ms</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    Top consuming agents
                  </div>
                  {agentUsage.length > 0 ? (
                    agentUsage.map(({ agent, tokens, cost, runs }) => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-default)] p-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{agent.name}</div>
                          <div className="text-xs text-[var(--text-secondary)]">
                            {runs} runs · {formatCompactNumber(tokens)} tokens
                          </div>
                        </div>
                        <div className="text-right text-sm font-medium text-[var(--text-primary)]">
                          {formatCurrency(cost)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-[var(--border-default)] p-5 text-sm text-[var(--text-secondary)]">
                      No usage recorded yet. Run an Office Intelligence agent to start tracking
                      consumption.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <p className="text-sm text-[var(--text-secondary)]">
                  Your latest Office Intelligence agents.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {mostRecentSessions.length > 0 ? (
                  mostRecentSessions.map(session => {
                    const agent = getAgentById(session.agentId);
                    return (
                      <Link
                        key={session.id}
                        href={`/office-intelligence?agent=${session.agentId}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-default)] p-3 hover:bg-[var(--bg-hover)]"
                      >
                        <span className="truncate text-sm">{agent?.name || session.title}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
                      </Link>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-[var(--border-default)] p-5 text-sm text-[var(--text-secondary)]">
                    No recent activity yet. Open an agent to begin.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
              <CardHeader>
                <CardTitle>Category performance</CardTitle>
                <p className="text-sm text-[var(--text-secondary)]">
                  Every available category and its signed-in activity.
                </p>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {categoryActivity.map(({ category, recentCount, favoriteCount }) => (
                  <Link
                    key={category.id}
                    href={`/office-intelligence?category=${category.id}`}
                    className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 transition-colors hover:bg-[var(--bg-hover)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{category.name}</div>
                      <FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
                    </div>
                    <div className="mt-2 text-xs text-[var(--text-secondary)]">
                      {getAgentCountByCategoryId(category.id)} agents · {recentCount} recent ·{' '}
                      {favoriteCount} favorites
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-[var(--border-default)] bg-[var(--bg-surface)]">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Execution control</CardTitle>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Review mode, status, duration, and failures.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={executionStatusFilter}
                      onChange={event =>
                        setExecutionStatusFilter(
                          event.target.value as 'all' | OfficeExecution['status']
                        )
                      }
                      className="rounded-md border border-[var(--border-default)] bg-[var(--bg-page)] px-2 py-1 text-xs"
                    >
                      <option value="all">All statuses</option>
                      <option value="running">Running</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                      value={executionModeFilter}
                      onChange={event => setExecutionModeFilter(event.target.value)}
                      className="rounded-md border border-[var(--border-default)] bg-[var(--bg-page)] px-2 py-1 text-xs"
                    >
                      <option value="all">All modes</option>
                      <option value="auto">Auto</option>
                      <option value="plan">Plan</option>
                      <option value="execute">Execute</option>
                      <option value="report">Report</option>
                      <option value="graph">Graph</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearExecutionHistory}
                      disabled={executions.length === 0}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredExecutions.length > 0 ? (
                  filteredExecutions.slice(0, 8).map(execution => {
                    const agent = getAgentById(execution.agentId);
                    return (
                      <div
                        key={execution.id}
                        className="rounded-lg border border-[var(--border-default)] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-medium">
                            {agent?.name || execution.agentId}
                          </span>
                          <span className="text-[10px] uppercase text-[var(--text-tertiary)]">
                            {execution.status}
                          </span>
                        </div>
                        <div className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                          {execution.mode} ·{' '}
                          {execution.durationMs ? `${execution.durationMs} ms` : 'in progress'}
                        </div>
                        {execution.error && (
                          <div className="mt-1 text-xs text-red-600">{execution.error}</div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-[var(--border-default)] p-5 text-sm text-[var(--text-secondary)]">
                    No executions match the selected filters.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
