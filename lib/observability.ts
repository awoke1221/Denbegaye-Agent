import { getSharedSocket } from '@/lib/socket-client';

export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface NodeExecutionStatus {
  nodeId: string;
  status: NodeStatus;
  label?: string;
  type?: string;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  duration?: number;
  retryCount?: number;
  progress?: number;
  output?: any;
}

export interface ObservableExecutionLog {
  id: string;
  executionId: string;
  nodeId?: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, any>;
  data?: Record<string, any>; // alias for metadata
}

export interface ExecutionDetails {
  id: string;
  executionId?: string;
  workflowId?: string;
  status: ExecutionStatus;
  logs: ObservableExecutionLog[];
  nodeStatuses: Record<string, NodeExecutionStatus>;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  errors?: string[];
  metrics?: Record<string, any>;
  progress?: number;
  duration?: number;
}

const executionCache = new Map<string, ExecutionDetails>();
const logCache = new Map<string, ObservableExecutionLog[]>();
const executionSubscribers = new Map<string, Set<(status: ExecutionDetails) => void>>();
let socketListenersInitialized = false;

function createExecutionState(executionId: string): ExecutionDetails {
  return {
    id: executionId,
    executionId,
    status: 'queued',
    logs: [],
    nodeStatuses: {},
  };
}

function normalizeTimestamp(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function getExecutionState(executionId: string): ExecutionDetails {
  return executionCache.get(executionId) ?? createExecutionState(executionId);
}

function setExecutionState(executionId: string, state: ExecutionDetails) {
  executionCache.set(executionId, state);
  return state;
}

function getExecutionLogsSync(executionId: string): ObservableExecutionLog[] {
  return logCache.get(executionId) ?? [];
}

function addLogEntry(executionId: string, log: ObservableExecutionLog): ObservableExecutionLog[] {
  const existingLogs = getExecutionLogsSync(executionId);
  const duplicate = existingLogs.some(
    existing =>
      existing.id === log.id ||
      (existing.message === log.message &&
        existing.nodeId === log.nodeId &&
        normalizeTimestamp(existing.timestamp).getTime() ===
          normalizeTimestamp(log.timestamp).getTime())
  );

  if (duplicate) {
    return existingLogs;
  }

  const updatedLogs = [...existingLogs, log];
  logCache.set(executionId, updatedLogs);
  return updatedLogs;
}

function notifyExecutionSubscribers(executionId: string) {
  const subscribers = executionSubscribers.get(executionId);
  if (!subscribers || subscribers.size === 0) {
    return;
  }

  const execution = getExecutionState(executionId);
  const snapshot = {
    ...execution,
    logs: [...execution.logs],
    nodeStatuses: { ...execution.nodeStatuses },
  };

  subscribers.forEach(callback => callback(snapshot));
}

function updateExecutionFromEvent(eventName: string, data: any) {
  if (!data?.executionId) {
    return;
  }

  const executionId = data.executionId as string;
  const current = getExecutionState(executionId);
  const nodeStatuses = { ...current.nodeStatuses };
  let status = current.status;
  let message = '';
  let level: ObservableExecutionLog['level'] = 'info';

  switch (eventName) {
    case 'execution-started':
      status = 'running';
      message = `Execution started: ${executionId}`;
      break;
    case 'node-started':
      if (data.nodeId) {
        nodeStatuses[data.nodeId] = {
          nodeId: data.nodeId,
          status: 'running',
        };
      }
      message = `Executing node: ${data.nodeId}`;
      break;
    case 'node-completed':
      if (data.nodeId) {
        nodeStatuses[data.nodeId] = {
          nodeId: data.nodeId,
          status: data.success ? 'completed' : 'failed',
          error: data.error || data.errorStack,
        };
      }
      message = data.success
        ? `Node completed: ${data.nodeId}`
        : `Node failed: ${data.nodeId} - ${data.error || data.errorStack || 'Unknown error'}`;
      level = data.success ? 'info' : 'error';
      break;
    case 'execution-completed':
      status = data.success ? 'completed' : 'failed';
      message = `Execution ${status}: ${executionId}`;
      break;
    default:
      message = `Received execution event: ${eventName}`;
  }

  const nextExecution: ExecutionDetails = {
    ...current,
    status,
    nodeStatuses,
  };

  const logEntry: ObservableExecutionLog = {
    id: `${executionId}-${eventName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    executionId,
    nodeId: data.nodeId,
    timestamp: new Date(),
    level,
    message,
    data,
  };

  nextExecution.logs = addLogEntry(executionId, logEntry);
  setExecutionState(executionId, nextExecution);
  notifyExecutionSubscribers(executionId);
}

function ensureSocketListeners() {
  if (socketListenersInitialized) {
    return;
  }

  const socket = getSharedSocket();

  socket.on('execution-started', data => {
    console.log('[socket → observability] execution-started', data);
    updateExecutionFromEvent('execution-started', data);
  });
  socket.on('node-started', data => {
    console.log('[socket → observability] node-started', data);
    updateExecutionFromEvent('node-started', data);
  });
  socket.on('node-completed', data => {
    console.log('[socket → observability] node-completed', data);
    updateExecutionFromEvent('node-completed', data);
  });
  socket.on('execution-completed', data => {
    console.log('[socket → observability] execution-completed', data);
    updateExecutionFromEvent('execution-completed', data);
  });

  socketListenersInitialized = true;
}

export const executionStore = {
  subscribe: (executionId: string, callback: (status: ExecutionDetails) => void) => {
    ensureSocketListeners();

    const subscribers = executionSubscribers.get(executionId) ?? new Set();
    subscribers.add(callback);
    executionSubscribers.set(executionId, subscribers);

    const currentState = getExecutionState(executionId);
    if (currentState.logs.length > 0 || currentState.status !== 'queued') {
      callback({
        ...currentState,
        logs: [...currentState.logs],
        nodeStatuses: { ...currentState.nodeStatuses },
      });
    }

    return () => {
      const subs = executionSubscribers.get(executionId);
      if (!subs) {
        return;
      }
      subs.delete(callback);
      if (subs.size === 0) {
        executionSubscribers.delete(executionId);
      }
    };
  },
  getExecution: async (executionId: string): Promise<ExecutionDetails | null> => {
    ensureSocketListeners();

    // Subscribe to socket room for real-time updates
    const socket = getSharedSocket();
    socket.emit('subscribe:execution', executionId);

    const cached = getExecutionState(executionId);
    try {
      const response = await fetch(`/api/langgraph/status/${executionId}`);
      if (!response.ok) {
        return cached.logs.length || Object.keys(cached.nodeStatuses).length ? cached : null;
      }

      const data = await response.json();
      const status = data?.isExecuting
        ? 'running'
        : cached.status === 'running'
          ? 'completed'
          : cached.status;
      const updatedState: ExecutionDetails = {
        ...cached,
        status,
        logs: getExecutionLogsSync(executionId),
        nodeStatuses: { ...cached.nodeStatuses },
      };

      setExecutionState(executionId, updatedState);
      return updatedState;
    } catch (error) {
      return cached.logs.length || Object.keys(cached.nodeStatuses).length ? cached : null;
    }
  },
};

export const getExecutionLogs = async (executionId: string): Promise<ObservableExecutionLog[]> => {
  return getExecutionLogsSync(executionId);
};

export const logExecutionEvent = async (
  executionId: string,
  level: string,
  message: string,
  metadata?: Record<string, any>
): Promise<void> => {
  const logEntry: ObservableExecutionLog = {
    id: `${executionId}-manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    executionId,
    timestamp: new Date(),
    level: level as 'info' | 'warn' | 'error',
    message,
    metadata,
    data: metadata,
  };

  addLogEntry(executionId, logEntry);
};
