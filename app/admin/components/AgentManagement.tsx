'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bot,
  Play,
  Pause,
  Square,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  Activity,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  name: string;
  description?: string;
  status: string;
  owner: {
    id: string;
    email: string;
    full_name?: string;
  };
  stats: {
    executions_count: number;
    success_rate: number;
    avg_execution_time: number;
    last_execution: string;
  };
  created_at: string;
  updated_at: string;
}

interface Execution {
  id: string;
  agent_id: string;
  agent_name: string;
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
  status: string;
  started_at: string;
  completed_at?: string;
  duration?: number;
  progress: number;
  error_message?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function AgentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('agents');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentDialog, setShowAgentDialog] = useState(false);

  // Fetch agents from admin API
  const fetchAgents = async (page = 1, search = '', status = 'all') => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append('search', search);
      if (status !== 'all') params.append('status', status);

      const response = await fetch(`/api/admin/agents?${params}`, {
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
      setAgents(data.agents);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch agents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch executions from admin API
  const fetchExecutions = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/admin/executions?status=running,queued&limit=50`, {
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
      setExecutions(data.executions);
    } catch (error) {
      console.error('Error fetching executions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch executions',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchExecutions();
  }, []);

  const handleAgentAction = async (agentId: string, action: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/admin/agents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId, action }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: 'Success',
        description: `Agent ${action} successfully`,
      });

      // Refresh agents list
      fetchAgents(pagination.page, searchTerm, statusFilter);
    } catch (error) {
      console.error('Error updating agent:', error);
      toast({
        title: 'Error',
        description: `Failed to ${action} agent`,
        variant: 'destructive',
      });
    }
  };

  const handleExecutionAction = async (executionId: string, action: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/admin/executions`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ executionId, action }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: 'Success',
        description: `Execution ${action} successfully`,
      });

      // Refresh executions list
      fetchExecutions();
    } catch (error) {
      console.error('Error updating execution:', error);
      toast({
        title: 'Error',
        description: `Failed to ${action} execution`,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Running</Badge>
        );
      case 'idle':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Idle</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
      case 'paused':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Paused</Badge>
        );
      case 'queued':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Queued</Badge>;
      case 'completed':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>
        );
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Agent Management</h2>
          <p className="text-gray-400">Monitor and manage AI agents and their executions</p>
        </div>
        <Button
          onClick={() => {
            fetchAgents();
            fetchExecutions();
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{agents.length}</div>
                <p className="text-xs text-gray-400">Total Agents</p>
              </div>
              <Bot className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {agents.filter(a => a.status === 'active').length}
                </div>
                <p className="text-xs text-gray-400">Running Now</p>
              </div>
              <Activity className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {executions.filter(e => e.status === 'running').length}
                </div>
                <p className="text-xs text-gray-400">Active Executions</p>
              </div>
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {agents.length > 0
                    ? Math.round(
                        agents.reduce((acc, a) => acc + a.stats.success_rate, 0) / agents.length
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-gray-400">Avg Success Rate</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={selectedTab === 'agents' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('agents')}
        >
          Agents ({pagination.total.toLocaleString()})
        </Button>
        <Button
          variant={selectedTab === 'executions' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('executions')}
        >
          Active Executions ({executions.length})
        </Button>
      </div>

      {/* Agents Tab */}
      {selectedTab === 'agents' && (
        <>
          {/* Filters */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search agents by name or owner..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 bg-white/5 border-white/10">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="idle">Idle</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => fetchAgents(1, searchTerm, statusFilter)} variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Agents Table */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Agent Overview
              </CardTitle>
              <CardDescription>
                Page {pagination.page} of {pagination.totalPages}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading agents...
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Executions</TableHead>
                        <TableHead>Success Rate</TableHead>
                        <TableHead>Avg Time</TableHead>
                        <TableHead>Last Run</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agents.map(agent => (
                        <TableRow key={agent.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{agent.name}</p>
                              <p className="text-sm text-gray-400">ID: {agent.id.slice(0, 8)}...</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{agent.owner.full_name || 'No name'}</p>
                              <p className="text-sm text-gray-400">{agent.owner.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(agent.status)}</TableCell>
                          <TableCell>{agent.stats.executions_count}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{agent.stats.success_rate}%</span>
                              <Progress value={agent.stats.success_rate} className="w-16 h-2" />
                            </div>
                          </TableCell>
                          <TableCell>{formatDuration(agent.stats.avg_execution_time)}</TableCell>
                          <TableCell className="text-sm text-gray-400">
                            {agent.stats.last_execution
                              ? formatDate(agent.stats.last_execution)
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedAgent(agent);
                                    setShowAgentDialog(true);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleAgentAction(agent.id, 'start')}
                                  disabled={agent.status === 'active'}
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Start Agent
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleAgentAction(agent.id, 'pause')}
                                  disabled={agent.status !== 'active'}
                                >
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pause Agent
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleAgentAction(agent.id, 'stop')}
                                  disabled={agent.status === 'idle'}
                                >
                                  <Square className="mr-2 h-4 w-4" />
                                  Stop Agent
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-gray-400">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} agents
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => fetchAgents(pagination.page - 1, searchTerm, statusFilter)}
                          disabled={pagination.page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => fetchAgents(pagination.page + 1, searchTerm, statusFilter)}
                          disabled={pagination.page === pagination.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Executions Tab */}
      {selectedTab === 'executions' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Active Executions
            </CardTitle>
            <CardDescription>Currently running and queued agent executions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Execution ID</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map(execution => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-mono text-sm">
                      {execution.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{execution.agent_name}</p>
                        <p className="text-sm text-gray-400">
                          ID: {execution.agent_id.slice(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{execution.user.full_name || 'No name'}</p>
                        <p className="text-sm text-gray-400">{execution.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(execution.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={execution.progress} className="w-20 h-2" />
                        <span className="text-sm">{execution.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-400">
                      {formatDate(execution.started_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {execution.duration ? (
                        formatDuration(execution.duration)
                      ) : (
                        <Clock className="w-4 h-4 inline" />
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Logs
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleExecutionAction(execution.id, 'stop')}
                            className="text-red-400"
                          >
                            <Square className="mr-2 h-4 w-4" />
                            Stop Execution
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Agent Details Dialog */}
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="bg-[#020617] border-white/10">
          <DialogHeader>
            <DialogTitle>Agent Details</DialogTitle>
            <DialogDescription>Detailed information about the selected agent</DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedAgent.name}</h3>
                  <p className="text-gray-400">{selectedAgent.description || 'No description'}</p>
                  {getStatusBadge(selectedAgent.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-400">Agent ID</Label>
                  <p className="font-mono text-sm">{selectedAgent.id}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Owner</Label>
                  <p className="text-sm">{selectedAgent.owner.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Created</Label>
                  <p className="text-sm">{formatDate(selectedAgent.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Last Updated</Label>
                  <p className="text-sm">{formatDate(selectedAgent.updated_at)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Total Executions</Label>
                  <p className="text-sm">{selectedAgent.stats.executions_count}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Success Rate</Label>
                  <p className="text-sm">{selectedAgent.stats.success_rate}%</p>
                </div>
              </div>

              {selectedAgent.stats.last_execution && (
                <div>
                  <Label className="text-sm text-gray-400">Last Execution</Label>
                  <p className="text-sm">{formatDate(selectedAgent.stats.last_execution)}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowAgentDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
