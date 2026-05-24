'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Eye,
  EyeOff,
  Download,
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Zap,
} from 'lucide-react';
import {
  ExecutionStatus,
  ExecutionDetails,
  ObservableExecutionLog,
  NodeStatus,
  executionStore,
} from '@/lib/observability';

interface ExecutionLogsUIProps {
  executionId: string;
  onClose?: () => void;
  className?: string;
}

export function ExecutionLogsUI({ executionId, onClose, className }: ExecutionLogsUIProps) {
  const [execution, setExecution] = useState<ExecutionDetails | null>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const [nodeFilter, setNodeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLive, setIsLive] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = executionStore.subscribe(executionId, status => {
      if (isMounted) {
        setExecution(status);
      }
    });

    (async () => {
      const status = await executionStore.getExecution(executionId);
      if (isMounted && status) {
        setExecution(status);
      }
    })();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [executionId]);

  useEffect(() => {
    if (isAutoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [execution?.logs, isAutoScroll]);

  const filteredLogs =
    execution?.logs.filter(log => {
      if (logFilter !== 'all' && log.level !== logFilter) return false;
      if (nodeFilter !== 'all' && log.nodeId !== nodeFilter) return false;
      if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    }) || [];

  const uniqueNodes = execution ? Array.from(new Set(execution.logs.map(log => log.nodeId))) : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <Square className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug':
        return <Zap className="w-4 h-4 text-gray-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const exportLogs = () => {
    if (!execution) return;

    const data = {
      executionId: execution.executionId,
      workflowId: execution.workflowId,
      status: execution.status,
      logs: execution.logs,
      nodeStatuses: execution.nodeStatuses,
      errors: execution.errors,
      metrics: execution.metrics,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-${executionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!execution) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading execution details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Execution Logs</CardTitle>
            {getStatusIcon(execution.status)}
            <Badge
              variant={
                execution.status === 'completed'
                  ? 'default'
                  : execution.status === 'failed'
                    ? 'destructive'
                    : execution.status === 'running'
                      ? 'secondary'
                      : 'outline'
              }
            >
              {execution.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className={isLive ? 'bg-green-50 border-green-200' : ''}
            >
              {isLive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {isLive ? 'Live' : 'Paused'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="w-4 h-4" />
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Progress: {execution.progress}%</span>
          <Progress value={execution.progress} className="flex-1 max-w-xs" />
          <span>Duration: {formatDuration(execution.duration || 0)}</span>
          <span>Nodes: {execution.metrics?.nodesExecuted || 0}</span>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logs">Logs ({execution.logs.length})</TabsTrigger>
            <TabsTrigger value="nodes">
              Nodes ({Object.keys(execution.nodeStatuses).length})
            </TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="px-2 py-1 border rounded text-sm w-48"
                />
              </div>

              <select
                value={logFilter}
                onChange={e => setLogFilter(e.target.value as any)}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="all">All Levels</option>
                <option value="error">Errors</option>
                <option value="warn">Warnings</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>

              <select
                value={nodeFilter}
                onChange={e => setNodeFilter(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="all">All Nodes</option>
                {uniqueNodes.map(nodeId => (
                  <option key={nodeId} value={nodeId}>
                    {nodeId}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoScroll(!isAutoScroll)}
                className={isAutoScroll ? 'bg-blue-50' : ''}
              >
                {isAutoScroll ? 'Auto-scroll On' : 'Auto-scroll Off'}
              </Button>
            </div>

            <ScrollArea className="h-96 w-full border rounded" ref={scrollAreaRef}>
              <div className="p-4 space-y-2">
                {filteredLogs.map(log => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 p-2 rounded text-sm ${
                      log.level === 'error'
                        ? 'bg-red-50 border-l-4 border-red-500'
                        : log.level === 'warn'
                          ? 'bg-yellow-50 border-l-4 border-yellow-500'
                          : 'bg-gray-50'
                    }`}
                  >
                    {getLogIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {log.nodeId}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-900">{log.message}</p>
                      {log.data && (
                        <details className="mt-1">
                          <summary className="text-xs text-gray-500 cursor-pointer">
                            Show data
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="nodes" className="space-y-4">
            <div className="grid gap-3">
              {Object.values(execution.nodeStatuses).map(node => (
                <Card key={node.nodeId} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(node.status)}
                      <span className="font-medium">{node.label || node.nodeId}</span>
                      <Badge variant="outline" className="text-xs">
                        {node.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {node.duration && <span>{formatDuration(node.duration)}</span>}
                      {node.retryCount && node.retryCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Retries: {node.retryCount}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {node.progress !== undefined && (
                    <Progress value={node.progress} className="mb-2" />
                  )}

                  {node.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{node.error}</div>
                  )}

                  {node.output && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-600 cursor-pointer">
                        Show output
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(node.output, null, 2)}
                      </pre>
                    </details>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {execution.metrics?.nodesExecuted || 0}
                </div>
                <div className="text-sm text-gray-600">Nodes Executed</div>
              </Card>

              <Card className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {formatDuration(execution.metrics?.totalExecutionTime || 0)}
                </div>
                <div className="text-sm text-gray-600">Total Time</div>
              </Card>

              <Card className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {execution.metrics?.apiCalls || 0}
                </div>
                <div className="text-sm text-gray-600">API Calls</div>
              </Card>

              <Card className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {execution.metrics?.retries || 0}
                </div>
                <div className="text-sm text-gray-600">Retries</div>
              </Card>
            </div>

            {(execution.errors?.length || 0) > 0 && (
              <Card className="p-4">
                <h3 className="font-medium mb-2 text-red-600">
                  Errors ({execution.errors?.length || 0})
                </h3>
                <div className="space-y-2">
                  {execution.errors?.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
