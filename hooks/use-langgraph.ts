// React hook for LangGraph agent execution
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  langGraphClient,
  ExecutionStreamOptions,
  StreamEvent,
  AdvancedLangGraphClient,
} from '@/lib/advancedLangGraphClient';
import { useToast } from './use-toast';

export interface ExecutionState {
  executionId: string | null;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentNode: string | null;
  logs: string[];
  errors: string[];
  output: Record<string, any>;
  streamEvents: StreamEvent[];
}

/**
 * Hook for executing agents with LangGraph
 */
export function useLangGraphExecution() {
  const [state, setState] = useState<ExecutionState>({
    executionId: null,
    status: 'idle',
    progress: 0,
    currentNode: null,
    logs: [],
    errors: [],
    output: {},
    streamEvents: [],
  });

  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /**
   * Execute agent with streaming
   */
  const executeAgent = useCallback(
    async (agentData: {
      agentId?: string;
      nodes: any[];
      edges: any[];
      input: Record<string, any>;
      apiKeys: Record<string, any>;
      agentName?: string;
    }) => {
      try {
        // Reset state
        setState({
          executionId: null,
          status: 'running',
          progress: 0,
          currentNode: null,
          logs: [],
          errors: [],
          output: {},
          streamEvents: [],
        });

        abortControllerRef.current = new AbortController();

        // Check if WebSocket is connected
        if (!langGraphClient.isConnected()) {
          throw new Error('WebSocket not connected');
        }

        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }

        // Execute with streaming
        const result = await langGraphClient.executeAgentWithStreaming(agentData, {
          onNodeStart: nodeId => {
            setState(prev => ({
              ...prev,
              currentNode: nodeId,
              logs: [...prev.logs, `Started node: ${nodeId}`],
            }));
          },
          onNodeEnd: (nodeId, data) => {
            setState(prev => ({
              ...prev,
              currentNode: null,
              progress: prev.progress + 10,
              logs: [...prev.logs, `Completed node: ${nodeId}`],
              output: { ...prev.output, [nodeId]: data },
            }));
          },
          onNodeError: (nodeId, error) => {
            setState(prev => ({
              ...prev,
              errors: [...prev.errors, `Node ${nodeId} error: ${error}`],
            }));
            toast({
              title: 'Node Error',
              description: `${nodeId}: ${error}`,
              variant: 'destructive',
            });
          },
          onToolCall: (toolName, input) => {
            setState(prev => ({
              ...prev,
              logs: [...prev.logs, `Tool call: ${toolName}`],
            }));
          },
          onToolResult: (toolName, result) => {
            setState(prev => ({
              ...prev,
              logs: [...prev.logs, `Tool result: ${toolName}`],
            }));
          },
          onMessage: message => {
            setState(prev => ({
              ...prev,
              logs: [...prev.logs, message],
            }));
          },
          onDebug: message => {
            console.debug('[LangGraph]', message);
          },
          onExecutionComplete: result => {
            setState(prev => ({
              ...prev,
              status: 'completed',
              progress: 100,
              executionId: result.executionId,
              output: result.output || prev.output,
            }));
            toast({
              title: 'Execution Complete',
              description: 'Agent execution completed successfully',
            });
          },
          onExecutionError: error => {
            setState(prev => ({
              ...prev,
              status: 'failed',
              errors: [...prev.errors, error],
            }));
            toast({
              title: 'Execution Failed',
              description: error,
              variant: 'destructive',
            });
          },
        });

        if (typeof result.unsubscribe === 'function') {
          unsubscribeRef.current = result.unsubscribe;
        }

        setState(prev => ({
          ...prev,
          executionId: result.executionId,
        }));

        return result;
      } catch (error) {
        const errorMessage = (error as Error).message;
        setState(prev => ({
          ...prev,
          status: 'failed',
          errors: [...prev.errors, errorMessage],
        }));
        toast({
          title: 'Execution Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast]
  );

  /**
   * Cancel execution
   */
  const cancelExecution = useCallback(async () => {
    if (!state.executionId) return;

    try {
      await langGraphClient.cancelExecution(state.executionId);
      setState(prev => ({
        ...prev,
        status: 'cancelled',
      }));
      toast({
        title: 'Execution Cancelled',
        description: 'Agent execution has been cancelled',
      });
    } catch (error) {
      toast({
        title: 'Cancel Failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  }, [state.executionId, toast]);

  /**
   * Get execution status
   */
  const getStatus = useCallback(async () => {
    if (!state.executionId) return null;

    try {
      return await langGraphClient.getExecutionStatus(state.executionId);
    } catch (error) {
      console.error('Failed to get status:', error);
      return null;
    }
  }, [state.executionId]);

  /**
   * Validate workflow
   */
  const validateWorkflow = useCallback(async (nodes: any[], edges: any[]) => {
    try {
      return await langGraphClient.validateWorkflow(nodes, edges);
    } catch (error) {
      console.error('Validation failed:', error);
      throw error;
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      executionId: null,
      status: 'idle',
      progress: 0,
      currentNode: null,
      logs: [],
      errors: [],
      output: {},
      streamEvents: [],
    });
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    state,
    executeAgent,
    cancelExecution,
    getStatus,
    validateWorkflow,
    reset,
    isRunning: state.status === 'running',
    isCompleted: state.status === 'completed',
    isFailed: state.status === 'failed',
  };
}

/**
 * Hook for managing WebSocket connection
 */
export function useLangGraphConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const connect = useCallback(
    async (token: string) => {
      try {
        await langGraphClient.connect(token);
        setIsConnected(true);
        setError(null);
        toast({
          title: 'Connected',
          description: 'Connected to LangGraph streaming',
        });
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        toast({
          title: 'Connection Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const disconnect = useCallback(() => {
    langGraphClient.disconnect();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
  };
}
