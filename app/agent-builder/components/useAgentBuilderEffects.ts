'use client';

import { useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type { Socket } from 'socket.io-client';
import { getSharedSocket } from '@/lib/socket-client';
import { Node, Edge } from 'reactflow';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { AgentWorkflow, UserAgent } from '@/types/agent';
import { AgentNodeData } from '@/stores/agentBuilderStore';

const getExecutionErrorMessage = (error: unknown, errorStack?: string) => {
  if (typeof error === 'string' && error.trim()) return error;
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object') {
    const errorObject = error as { message?: unknown; error?: unknown };
    if (typeof errorObject.message === 'string' && errorObject.message.trim()) {
      return errorObject.message;
    }
    if (typeof errorObject.error === 'string' && errorObject.error.trim()) {
      return errorObject.error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return errorStack || 'Unknown error';
    }
  }
  return errorStack || 'Unknown error';
};

type AutosaveArgs = {
  nodes: Node<AgentNodeData>[];
  edges: Edge[];
  workflowName: string;
  agentDescription: string;
  selectedAgentId: string | null;
  currentAgentStatus: string;
};

export function useAgentBuilderAutosave({
  nodes,
  edges,
  workflowName,
  agentDescription,
  selectedAgentId,
  currentAgentStatus,
}: AutosaveArgs) {
  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      try {
        localStorage.setItem(
          'agent-builder-workflow',
          JSON.stringify({
            nodes,
            edges,
            name: workflowName,
            description: agentDescription,
            selectedAgentId,
            currentAgentStatus,
          })
        );
      } catch (error) {
        console.error('Failed to autosave builder state', error);
      }
    }, 500);

    return () => window.clearTimeout(saveTimer);
  }, [nodes, edges, workflowName, agentDescription, selectedAgentId, currentAgentStatus]);
}

type HistoryArgs = {
  nodes: Node<AgentNodeData>[];
  edges: Edge[];
  setNodes: (nodes: Node<AgentNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
};

export function useAgentBuilderHistory({ nodes, edges, setNodes, setEdges }: HistoryArgs) {
  const historyRef = useRef<{ nodes: Node<AgentNodeData>[]; edges: Edge[] }[]>([]);
  const futureRef = useRef<{ nodes: Node<AgentNodeData>[]; edges: Edge[] }[]>([]);
  const isTimeTravelRef = useRef(false);

  useEffect(() => {
    if (isTimeTravelRef.current) {
      isTimeTravelRef.current = false;
      return;
    }

    historyRef.current = [...historyRef.current.slice(-49), { nodes, edges }];
    futureRef.current = [];
  }, [nodes, edges]);

  const undo = () => {
    if (historyRef.current.length < 2) return;
    const prev = historyRef.current[historyRef.current.length - 2];
    isTimeTravelRef.current = true;
    futureRef.current = [{ nodes, edges }, ...futureRef.current].slice(0, 50);
    historyRef.current = historyRef.current.slice(0, historyRef.current.length - 1);
    setNodes(prev.nodes);
    setEdges(prev.edges);
  };

  const redo = () => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    isTimeTravelRef.current = true;
    historyRef.current = [...historyRef.current.slice(-49), next];
    setNodes(next.nodes);
    setEdges(next.edges);
    futureRef.current = futureRef.current.slice(1);
  };

  return { undo, redo };
}

export function useAgentBuilderKeyboardShortcuts({
  undo,
  redo,
}: {
  undo: () => void;
  redo: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);
}

type DragPaneArgs = {
  draggingPane: null | 'palette' | 'settings' | 'nodeConfig';
  dragOffset: { x: number; y: number };
  setDraggingPane: Dispatch<SetStateAction<null | 'palette' | 'settings' | 'nodeConfig'>>;
  setDragOffset: Dispatch<SetStateAction<{ x: number; y: number }>>;
  setNodePalettePosition: Dispatch<SetStateAction<{ x: number; y: number }>>;
  setSettingsPosition: Dispatch<SetStateAction<{ x: number; y: number }>>;
  setNodeConfigPosition: Dispatch<SetStateAction<{ x: number; y: number }>>;
};

export function useAgentBuilderDragPanels({
  draggingPane,
  dragOffset,
  setDraggingPane,
  setDragOffset,
  setNodePalettePosition,
  setSettingsPosition,
  setNodeConfigPosition,
}: DragPaneArgs) {
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!draggingPane) return;

      const nextX = event.clientX - dragOffset.x;
      const nextY = event.clientY - dragOffset.y;
      const clampedX = Math.max(16, Math.min(nextX, window.innerWidth - 320));
      const clampedY = Math.max(16, Math.min(nextY, window.innerHeight - 120));

      if (draggingPane === 'palette') {
        setNodePalettePosition({ x: clampedX, y: clampedY });
      } else if (draggingPane === 'settings') {
        setSettingsPosition({ x: clampedX, y: clampedY });
      } else if (draggingPane === 'nodeConfig') {
        setNodeConfigPosition({ x: clampedX, y: clampedY });
      }
    };

    const handleMouseUp = () => {
      setDraggingPane(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    draggingPane,
    dragOffset,
    setDraggingPane,
    setDragOffset,
    setNodePalettePosition,
    setSettingsPosition,
    setNodeConfigPosition,
  ]);
}

type SocketExecutionArgs = {
  backendUrl: string;
  nodes: Node<AgentNodeData>[];
  setNodes: (nodes: Node<AgentNodeData>[]) => void;
  setExecutionStatuses: Dispatch<
    SetStateAction<Record<string, { status: string; nodeStatuses: Record<string, string> }>>
  >;
  setCurrentExecutionId: Dispatch<SetStateAction<string | null>>;
  setExecutionStatus: Dispatch<SetStateAction<string | null>>;
  setCurrentExecutingNodeId: Dispatch<SetStateAction<string | null>>;
  setLog: Dispatch<SetStateAction<string[]>>;
  setIsExecuting: Dispatch<SetStateAction<boolean>>;
};

export function useAgentBuilderSocketExecution({
  backendUrl,
  nodes,
  setNodes,
  setExecutionStatuses,
  setCurrentExecutionId,
  setExecutionStatus,
  setCurrentExecutingNodeId,
  setLog,
  setIsExecuting,
}: SocketExecutionArgs) {
  const socketRef = useRef<Socket | null>(null);
  const nodesRef = useRef<Node<AgentNodeData>[]>(nodes);
  const [approvalRequest, setApprovalRequest] = useState<{
    executionId: string;
    nodeId: string;
    question: string;
    options: string[];
  } | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const getAuthToken = async () => {
    const session = await supabase.auth.getSession();
    return session?.data?.session?.access_token || null;
  };

  const appendLog = (message: string) => {
    setLog(prev => {
      if (prev.some(entry => entry === message)) {
        return prev;
      }
      return [...prev, message];
    });
  };

  const submitApproval = async (executionId: string, response: string) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const session = await supabase.auth.getSession();
      const userId = session?.data?.session?.user?.id;
      if (!userId) {
        throw new Error('No user ID available');
      }

      const fetchResponse = await fetch(`/api/executions/${executionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          response,
          userId,
        }),
      });

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json();
        throw new Error(errorData.error || 'Failed to submit approval');
      }

      setApprovalRequest(null);
    } catch (error) {
      console.error('Error submitting approval:', error);
      appendLog(
        `Error submitting approval: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  useEffect(() => {
    const socket = getSharedSocket(backendUrl);
    socketRef.current = socket;

    socket.on('execution-started', (data: { executionId: string }) => {
      console.log('[socket → agentBuilder] execution-started', data);
      setCurrentExecutionId(data.executionId);
      setExecutionStatuses(prev => ({
        ...prev,
        [data.executionId]: {
          status: 'running',
          nodeStatuses: {},
        },
      }));
      setExecutionStatus('running');
      setIsExecuting(true);
      setNodes(
        nodesRef.current.map(node => ({
          ...node,
          data: {
            ...node.data,
            executionState: 'pending',
            executionError: null,
          },
        }))
      );
      appendLog(`Execution started: ${data.executionId}`);
    });

    socket.on('node-started', (data: { executionId: string; nodeId: string }) => {
      console.log('[socket → agentBuilder] node-started', data);
      setExecutionStatuses(prev => ({
        ...prev,
        [data.executionId]: {
          ...prev[data.executionId],
          nodeStatuses: {
            ...prev[data.executionId]?.nodeStatuses,
            [data.nodeId]: 'executing',
          },
        },
      }));
      setCurrentExecutingNodeId(data.nodeId);
      setNodes(
        nodesRef.current.map(node =>
          node.id === data.nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  executionState: 'executing',
                  executionError: null,
                },
              }
            : node
        )
      );
      const node = nodesRef.current.find(n => n.id === data.nodeId);
      appendLog(`Executing node: ${node?.data?.label || data.nodeId}`);
    });

    socket.on(
      'node-completed',
      (data: {
        executionId: string;
        nodeId: string;
        success: boolean;
        error?: unknown;
        errorStack?: string;
      }) => {
        console.log('[socket → agentBuilder] node-completed', data);
        setExecutionStatuses(prev => ({
          ...prev,
          [data.executionId]: {
            ...prev[data.executionId],
            nodeStatuses: {
              ...prev[data.executionId]?.nodeStatuses,
              [data.nodeId]: data.success ? 'completed' : 'failed',
            },
          },
        }));
        setNodes(
          nodesRef.current.map(node =>
            node.id === data.nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    executionState: data.success ? 'completed' : 'failed',
                    executionError: data.success
                      ? null
                      : getExecutionErrorMessage(data.error, data.errorStack),
                  },
                }
              : node
          )
        );
        const node = nodesRef.current.find(n => n.id === data.nodeId);
        if (data.success) {
          appendLog(`Node completed: ${node?.data?.label || data.nodeId}`);
        } else {
          appendLog(
            `Node failed: ${node?.data?.label || data.nodeId} - ${data.error || 'Unknown error'}`
          );
        }
      }
    );

    socket.on('execution-completed', (data: { executionId: string; success: boolean }) => {
      console.log('[socket → agentBuilder] execution-completed', data);
      setExecutionStatuses(prev => ({
        ...prev,
        [data.executionId]: {
          ...prev[data.executionId],
          status: data.success ? 'completed' : 'failed',
        },
      }));
      setExecutionStatus(data.success ? 'completed' : 'failed');
      setCurrentExecutingNodeId(null);
      setCurrentExecutionId(null);
      setIsExecuting(false);
      appendLog(`Execution ${data.success ? 'completed' : 'failed'}: ${data.executionId}`);
    });

    socket.on(
      'execution-paused',
      (data: { executionId: string; nodeId: string; question: string; options: string[] }) => {
        console.log('[socket → agentBuilder] execution-paused', data);
        setApprovalRequest(data);
        appendLog(`Execution paused at node ${data.nodeId}: ${data.question}`);
      }
    );

    socket.on('execution-approved', (data: any) => {
      console.log('[socket → agentBuilder] execution-approved', data);
      setApprovalRequest(null);
      appendLog(`Execution approved: ${data.response}`);
    });

    socket.on('execution-timeout', (data: { executionId: string; nodeId: string }) => {
      console.log('[socket → agentBuilder] execution-timeout', data);
      setApprovalRequest(null);
      appendLog(`Approval request timed out for node ${data.nodeId}`);
    });

    return () => {
      // Shared socket is reused across the builder, so do not disconnect here.
    };
  }, [
    backendUrl,
    setCurrentExecutionId,
    setExecutionStatus,
    setExecutionStatuses,
    setCurrentExecutingNodeId,
    setLog,
    setIsExecuting,
  ]);

  return { socketRef, approvalRequest, submitApproval };
}

type ExecutionStateSyncArgs = {
  currentExecutionId: string | null;
  executionStatuses: Record<string, { status: string; nodeStatuses: Record<string, string> }>;
  nodes: Node<AgentNodeData>[];
  setNodes: (nodes: Node<AgentNodeData>[]) => void;
};

export function useAgentBuilderExecutionStateSync({
  currentExecutionId,
  executionStatuses,
  nodes,
  setNodes,
}: ExecutionStateSyncArgs) {
  useEffect(() => {
    if (!currentExecutionId) return;

    const execStatus = executionStatuses[currentExecutionId];
    if (!execStatus) return;

    const updatedNodes = nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        executionState:
          (execStatus.nodeStatuses[node.id] as AgentNodeData['executionState']) || null,
      },
    }));

    setNodes(updatedNodes);
  }, [currentExecutionId, executionStatuses, nodes, setNodes]);
}

type DataLoaderArgs = {
  currentUser: {
    id?: string | null;
    email?: string | null;
    user_metadata?: Record<string, any>;
  } | null;
  setWorkflows: Dispatch<SetStateAction<AgentWorkflow[]>>;
  setUserAgents: Dispatch<SetStateAction<UserAgent[]>>;
  setCredentials: Dispatch<SetStateAction<any[]>>;
  setLog: Dispatch<SetStateAction<string[]>>;
};

export function useAgentBuilderDataLoader({
  currentUser,
  setWorkflows,
  setUserAgents,
  setCredentials,
  setLog,
}: DataLoaderArgs) {
  const getAuthToken = async () => {
    const session = await supabase.auth.getSession();
    return session?.data?.session?.access_token || null;
  };

  const loadUserAgents = async () => {
    if (!currentUser?.id) return;
    const { data, error } = await supabase
      .from('user_agents')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setUserAgents(data as UserAgent[]);
    }
  };

  const loadCredentials = async () => {
    if (!currentUser?.id) return;
    const token = await getAuthToken();
    if (!token) return;

    const response = await fetch('/api/credentials', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!data.error) {
      setCredentials(data.credentials || []);
    }
  };

  const loadWorkflows = async () => {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setWorkflows(data as AgentWorkflow[]);
    }
  };

  useEffect(() => {
    loadWorkflows();
    loadUserAgents();
    loadCredentials();
  }, [currentUser?.id]);

  return {
    loadUserAgents,
    loadCredentials,
  };
}

export function useAgentBuilderExecutionPoller(
  executionId: string | null,
  pollingExecution: boolean,
  fetchExecutionStatus: (executionId: string) => Promise<void>
) {
  useEffect(() => {
    if (!executionId || !pollingExecution) return;

    const intervalId = window.setInterval(() => {
      fetchExecutionStatus(executionId);
    }, 2000);

    fetchExecutionStatus(executionId);

    return () => window.clearInterval(intervalId);
  }, [executionId, pollingExecution, fetchExecutionStatus]);
}

// Main effects hook that combines all functionality
export function useAgentBuilderEffects({
  nodes,
  edges,
  workflowName,
  agentDescription,
  selectedAgentId,
  currentAgentStatus,
  setWorkflowName,
  setAgentDescription,
  setSelectedAgentId,
  setCurrentAgentStatus,
  setLog,
  setApiKeys,
  setWorkflows,
  setUserAgents,
  setCredentials,
  setExecutionStatuses,
  setCurrentExecutionId,
  setExecutionStatus,
  setCurrentExecutingNodeId,
  setNodes,
  setEdges,
  setIsExecuting,
  socketRef,
  backendUrl,
  user,
  router,
}: {
  nodes: Node<AgentNodeData>[];
  edges: Edge[];
  workflowName: string;
  agentDescription: string;
  selectedAgentId: string | null;
  currentAgentStatus: string;
  setWorkflowName: (value: string) => void;
  setAgentDescription: (value: string) => void;
  setSelectedAgentId: (value: string | null) => void;
  setCurrentAgentStatus: (value: string) => void;
  setLog: Dispatch<SetStateAction<string[]>>;
  setApiKeys: Dispatch<
    SetStateAction<{ openai: string; gemini: string; deepseek: string; gmail: string }>
  >;
  setWorkflows: Dispatch<SetStateAction<AgentWorkflow[]>>;
  setUserAgents: Dispatch<SetStateAction<UserAgent[]>>;
  setCredentials: Dispatch<SetStateAction<any[]>>;
  setExecutionStatuses: Dispatch<
    SetStateAction<Record<string, { status: string; nodeStatuses: Record<string, string> }>>
  >;
  setCurrentExecutionId: Dispatch<SetStateAction<string | null>>;
  setExecutionStatus: Dispatch<SetStateAction<string | null>>;
  setCurrentExecutingNodeId: Dispatch<SetStateAction<string | null>>;
  setNodes: (nodes: Node<AgentNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  setIsExecuting: Dispatch<SetStateAction<boolean>>;
  socketRef: React.MutableRefObject<Socket | null>;
  backendUrl: string;
  user: any;
  router: ReturnType<typeof useRouter>;
}) {
  // Autosave
  useAgentBuilderAutosave({
    nodes,
    edges,
    workflowName,
    agentDescription,
    selectedAgentId,
    currentAgentStatus,
  });

  // History management
  const { undo, redo } = useAgentBuilderHistory({ nodes, edges, setNodes, setEdges });

  // Keyboard shortcuts
  useAgentBuilderKeyboardShortcuts({ undo, redo });

  // Socket execution
  const { approvalRequest, submitApproval } = useAgentBuilderSocketExecution({
    backendUrl,
    nodes,
    setNodes,
    setExecutionStatuses,
    setCurrentExecutionId,
    setExecutionStatus,
    setCurrentExecutingNodeId,
    setLog,
    setIsExecuting,
  });

  // Data loading
  useAgentBuilderDataLoader({
    currentUser: user,
    setWorkflows,
    setUserAgents,
    setCredentials,
    setLog,
  });

  return { undo, redo, approvalRequest, submitApproval };
}
