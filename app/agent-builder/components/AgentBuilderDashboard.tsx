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
    <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">
              Agent Analytics Dashboard
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Comprehensive insights into your agent ecosystem, performance metrics, and workflow
              analytics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={createNewAgentWorkflow}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Agent
            </Button>
            <Button
              variant="outline"
              className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300"
              onClick={exportDashboardReport}
            >
              <FileText className="w-5 h-5 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200/50 dark:border-blue-800/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Total Agents
              </CardTitle>
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {userAgents.length}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {draftUserAgents.length} Draft
                </Badge>
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  {activeUserAgents.length} Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200/50 dark:border-emerald-800/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                Active Workflows
              </CardTitle>
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                {workflows.filter(w => w.status === 'active').length}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                {workflows.length} total workflows configured
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200/50 dark:border-purple-800/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                Executions Today
              </CardTitle>
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Play className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {Object.keys(executionStatuses).length}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                {Object.values(executionStatuses).filter(s => s.status === 'completed').length}{' '}
                successful
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200/50 dark:border-amber-800/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Success Rate
              </CardTitle>
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
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
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Last 24 hours performance
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Your Agents
                    </CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Manage and monitor your AI agent portfolio
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-300 dark:border-slate-600"
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
                        className="group flex items-center justify-between p-6 border border-slate-200/60 dark:border-slate-700/60 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/20 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                        onClick={() => loadUserAgent(agent)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <Avatar className="w-12 h-12 ring-2 ring-slate-200 dark:ring-slate-700">
                              <AvatarImage src={user?.user_metadata?.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                                {agent.name?.charAt(0)?.toUpperCase() || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                                agent.status === 'active'
                                  ? 'bg-emerald-500'
                                  : agent.status === 'error'
                                    ? 'bg-red-500'
                                    : 'bg-amber-500'
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors">
                              {agent.name}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                              {agent.description || 'No description provided'}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Updated{' '}
                                {agent.updated_at
                                  ? new Date(agent.updated_at).toLocaleDateString()
                                  : 'N/A'}
                              </span>
                              <Badge
                                variant={agent.status === 'active' ? 'default' : 'secondary'}
                                className="text-xs"
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
                            className="hover:bg-blue-100 dark:hover:bg-blue-900"
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
                            className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
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
                            className="hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
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
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          No agents yet
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                          Create your first AI agent to get started with automated workflows and
                          intelligent processing.
                        </p>
                        <Button
                          onClick={createNewAgentWorkflow}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <CardHeader className="pb-4 flex items-center justify-between gap-4">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Recent Executions
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300"
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
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                Execution {executionId.slice(-8)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
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
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          No recent executions
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-300 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300"
                  onClick={() => setActiveSection('templates')}
                >
                  <Zap className="w-4 h-4 mr-3 text-blue-600 dark:text-blue-400" />
                  Browse Templates
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-300 dark:border-slate-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300"
                  onClick={() => setActiveSection('webhooks')}
                >
                  <Webhook className="w-4 h-4 mr-3 text-purple-600 dark:text-purple-400" />
                  Manage Webhooks
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-300 dark:border-slate-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300"
                  onClick={() => setActiveSection('vault')}
                >
                  <Database className="w-4 h-4 mr-3 text-emerald-600 dark:text-emerald-400" />
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
