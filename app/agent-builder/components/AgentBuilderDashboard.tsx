'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  LayoutDashboard,
  Play,
  Zap,
  Eye,
  Download,
  Trash2,
  Plus,
  Webhook,
  Database,
  Settings,
} from 'lucide-react';
import { AgentWorkflow, UserAgent } from '@/types/agent';

interface AgentBuilderDashboardProps {
  user?: any;
  workflows: Array<AgentWorkflow & { status?: string }>;
  userAgents: UserAgent[];
  executionStatuses: Record<string, { status: string; nodeStatuses: Record<string, string> }>;
  draftUserAgents: UserAgent[];
  activeUserAgents: UserAgent[];
  loadUserAgent: (agent: UserAgent) => void;
  createNewAgentWorkflow: () => void;
  exportDashboardReport: () => void;
  clearExecutions: () => void;
  setActiveSection: (
    section: 'builder' | 'dashboard' | 'settings' | 'templates' | 'webhooks' | 'vault'
  ) => void;
  exportAgentJson: (agent: UserAgent) => void;
  deleteAgent: (agentId: string) => void;
}

export function AgentBuilderDashboard({
  user,
  workflows,
  userAgents,
  executionStatuses,
  draftUserAgents,
  activeUserAgents,
  loadUserAgent,
  createNewAgentWorkflow,
  exportDashboardReport,
  clearExecutions,
  setActiveSection,
  exportAgentJson,
  deleteAgent,
}: AgentBuilderDashboardProps) {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              Agent Analytics Dashboard
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
              Comprehensive insights into your agent ecosystem, performance metrics, and workflow
              analytics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={createNewAgentWorkflow}
              className="border border-[var(--border-default)] bg-[var(--bg-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] shadow-[0_8px_18px_var(--shadow-soft)] transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Agent
            </Button>
            <Button
              variant="outline"
              className="border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-300"
              onClick={exportDashboardReport}
            >
              <FileText className="w-5 h-5 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[0_10px_22px_var(--shadow-soft)] transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
                Total Agents
              </CardTitle>
              <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center">
                <FileText className="h-5 w-5 text-[var(--text-secondary)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[var(--text-primary)]">
                {userAgents.length}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge
                  variant="secondary"
                  className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]"
                >
                  {draftUserAgents.length} Draft
                </Badge>
                <Badge
                  variant="default"
                  className="bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-default)]"
                >
                  {activeUserAgents.length} Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[0_10px_22px_var(--shadow-soft)] transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
                Active Workflows
              </CardTitle>
              <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-[var(--text-secondary)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[var(--text-primary)]">
                {workflows.filter(w => w.status === 'active').length}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                {workflows.length} total workflows configured
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[0_10px_22px_var(--shadow-soft)] transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
                Executions Today
              </CardTitle>
              <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center">
                <Play className="h-5 w-5 text-[var(--text-secondary)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[var(--text-primary)]">
                {Object.keys(executionStatuses).length}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                {Object.values(executionStatuses).filter(s => s.status === 'completed').length}{' '}
                successful
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[0_10px_22px_var(--shadow-soft)] transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
                Success Rate
              </CardTitle>
              <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center">
                <Zap className="h-5 w-5 text-[var(--text-secondary)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[var(--text-primary)]">
                {Object.keys(executionStatuses).length > 0
                  ? Math.round(
                      (Object.values(executionStatuses).filter(s => s.status === 'completed')
                        .length /
                        Object.keys(executionStatuses).length) *
                        100
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-2">Last 24 hours performance</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <Card className="border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_10px_22px_var(--shadow-soft)]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-[var(--text-primary)]">
                      Your Agents
                    </CardTitle>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Manage and monitor your AI agent portfolio
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {userAgents.slice(0, 10).map(agent => (
                      <div
                        key={agent.id}
                        className="group flex items-center justify-between p-6 border border-[var(--border-default)] rounded-xl hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)] transition-all duration-200 cursor-pointer"
                        onClick={() => loadUserAgent(agent)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <Avatar className="w-12 h-12 ring-2 ring-[var(--border-default)]">
                              <AvatarImage src={user?.user_metadata?.avatar_url} />
                              <AvatarFallback className="bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold border border-[var(--border-default)]">
                                {agent.name?.charAt(0)?.toUpperCase() || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                agent.status === 'active'
                                  ? 'bg-[#22c55e]'
                                  : agent.status === 'error'
                                    ? 'bg-[#6b7280]'
                                    : 'bg-[#8b8b8b]'
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--text-primary)] transition-colors">
                              {agent.name}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                              {agent.description || 'No description provided'}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-[var(--text-tertiary)]">
                                Updated{' '}
                                {agent.updated_at
                                  ? new Date(agent.updated_at).toLocaleDateString()
                                  : 'N/A'}
                              </span>
                              <Badge
                                variant={agent.status === 'active' ? 'default' : 'secondary'}
                                className="text-xs border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                              >
                                {agent.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              loadUserAgent(agent);
                            }}
                            className="text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              exportAgentJson(agent);
                            }}
                            className="text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              deleteAgent(agent.id);
                            }}
                            className="text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {userAgents.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                          No agents yet
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
                          Create your first AI agent to get started with automated workflows and
                          intelligent processing.
                        </p>
                        <Button
                          onClick={createNewAgentWorkflow}
                          className="border border-[var(--border-default)] bg-[var(--bg-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Agent
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_10px_22px_var(--shadow-soft)]">
              <CardHeader className="pb-4 flex items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
                  Recent Executions
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-300"
                  onClick={clearExecutions}
                >
                  Clear Executions
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {Object.entries(executionStatuses)
                      .slice(0, 8)
                      .map(([executionId, status]) => (
                        <div
                          key={executionId}
                          className="flex items-center justify-between p-3 border border-slate-200/60 dark:border-slate-700/60 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                status.status === 'completed'
                                  ? 'bg-emerald-500'
                                  : status.status === 'failed'
                                    ? 'bg-red-500'
                                    : status.status === 'running'
                                      ? 'bg-blue-500 animate-pulse'
                                      : 'bg-amber-500'
                              }`}
                            />
                            <div>
                              <p className="text-sm font-medium text-[var(--text-primary)]">
                                Execution {executionId.slice(-8)}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)]">
                                {status.status}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              status.status === 'completed'
                                ? 'default'
                                : status.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="text-xs"
                          >
                            {status.status}
                          </Badge>
                        </div>
                      ))}
                    {Object.keys(executionStatuses).length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <Play className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">No recent executions</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_10px_22px_var(--shadow-soft)]">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-300"
                  onClick={() => setActiveSection('templates')}
                >
                  <Zap className="w-4 h-4 mr-3 text-[var(--text-secondary)]" />
                  Browse Templates
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-300"
                  onClick={() => setActiveSection('webhooks')}
                >
                  <Webhook className="w-4 h-4 mr-3 text-[var(--text-secondary)]" />
                  Manage Webhooks
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-300"
                  onClick={() => setActiveSection('vault')}
                >
                  <Database className="w-4 h-4 mr-3 text-[var(--text-secondary)]" />
                  Credentials Vault
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-300 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300"
                  onClick={() => setActiveSection('settings')}
                >
                  <Settings className="w-4 h-4 mr-3 text-amber-600 dark:text-amber-400" />
                  System Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
