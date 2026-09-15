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
}

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
  const runningExecutions = executions.filter(execution => execution.status === 'running').length;
  const completedExecutions = executions.filter(
    execution => execution.status === 'completed'
  ).length;
  const failedExecutions = executions.filter(execution => execution.status === 'failed').length;
  const filteredExecutions = executions.filter(execution => {
    const matchesStatus =
      executionStatusFilter === 'all' || execution.status === executionStatusFilter;
    const matchesMode = executionModeFilter === 'all' || execution.mode === executionModeFilter;
    return matchesStatus && matchesMode;
  });

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

          <section className="grid gap-4 sm:grid-cols-3">
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
                <CardTitle className="text-sm">Execution history</CardTitle>
                <LoaderCircle className="h-4 w-4 text-[var(--text-tertiary)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{executions.length}</div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">Last 50 user runs</div>
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
