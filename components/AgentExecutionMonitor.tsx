// Example: Agent Execution Monitor Component
'use client';

import React, { useEffect } from 'react';
import { useLangGraphExecution, useLangGraphConnection } from '@/hooks/use-langgraph';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AgentExecutionMonitorProps {
  nodes: any[];
  edges: any[];
  input: Record<string, any>;
  apiKeys: Record<string, any>;
}

export function AgentExecutionMonitor({
  nodes,
  edges,
  input,
  apiKeys,
}: AgentExecutionMonitorProps) {
  const { user } = useAuth();
  const { connect, isConnected, error: connectionError } = useLangGraphConnection();
  const { state, executeAgent, cancelExecution, reset, isRunning, isCompleted, isFailed } =
    useLangGraphExecution();

  // Connect on mount
  useEffect(() => {
    if (user?.id && !isConnected) {
      connect(user.id);
    }
  }, [user, isConnected, connect]);

  const handleExecute = async () => {
    try {
      await executeAgent({
        nodes,
        edges,
        input,
        apiKeys,
      });
    } catch (error) {
      console.error('Execution error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Connection Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {connectionError && <span className="text-sm text-red-500">{connectionError}</span>}
        </div>
      </Card>

      {/* Execution Controls */}
      <Card className="p-4">
        <div className="flex space-x-2">
          <Button onClick={handleExecute} disabled={!isConnected || isRunning} className="flex-1">
            {isRunning ? 'Executing...' : 'Execute Agent'}
          </Button>
          {isRunning && (
            <Button onClick={cancelExecution} variant="destructive" className="flex-1">
              Cancel
            </Button>
          )}
          {isCompleted && (
            <Button onClick={reset} variant="outline" className="flex-1">
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Status & Progress */}
      {state.executionId && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge className={`${getStatusColor(state.status)} text-white`}>
              {state.status.toUpperCase()}
            </Badge>
          </div>

          {state.status === 'running' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{state.progress}%</span>
              </div>
              <Progress value={state.progress} className="w-full" />
            </div>
          )}

          {state.currentNode && (
            <div className="text-sm">
              <span className="font-medium">Current Node: </span>
              <span className="text-blue-600">{state.currentNode}</span>
            </div>
          )}

          <div className="text-xs text-gray-500">Execution ID: {state.executionId}</div>
        </Card>
      )}

      {/* Logs */}
      {state.logs.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">Execution Logs</h3>
          <ScrollArea className="h-40 w-full border rounded p-2 bg-gray-50">
            <div className="space-y-1">
              {state.logs.map((log, index) => (
                <div key={index} className="text-xs font-mono text-gray-700">
                  <span className="text-gray-500">[{index}]</span> {log}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Errors */}
      {state.errors.length > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <h3 className="text-sm font-semibold mb-2 text-red-800">Errors</h3>
          <div className="space-y-1">
            {state.errors.map((error, index) => (
              <div key={index} className="text-xs text-red-700">
                <span className="font-mono">• {error}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Output */}
      {Object.keys(state.output).length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">Output</h3>
          <ScrollArea className="h-40 w-full border rounded p-2 bg-gray-50">
            <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-words">
              {JSON.stringify(state.output, null, 2)}
            </pre>
          </ScrollArea>
        </Card>
      )}

      {/* Stream Events */}
      {state.streamEvents.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">Stream Events</h3>
          <ScrollArea className="h-40 w-full border rounded p-2 bg-gray-50">
            <div className="space-y-2">
              {state.streamEvents.slice(-10).map((event, index) => (
                <div key={index} className="text-xs font-mono text-gray-700 pb-2 border-b">
                  <div className="font-semibold text-blue-600">{event.type}</div>
                  {event.nodeId && <div className="text-gray-600">Node: {event.nodeId}</div>}
                  {event.data && (
                    <div className="text-gray-500 whitespace-pre-wrap">
                      {typeof event.data === 'string'
                        ? event.data
                        : JSON.stringify(event.data, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
