export type ExecutionStatus =
  | 'queued'
  | 'accepted'
  | 'running'
  | 'partial'
  | 'waiting_for_approval'
  | 'failed'
  | 'completed'
  | 'cancelled';

export type ExecutionMode = 'auto' | 'plan' | 'execute' | 'report' | 'graph';

export type ExecutionArtifact = {
  id: string;
  type: 'report' | 'file' | 'chart' | 'artifact' | 'dataset';
  filename: string;
  storage_path: string;
  created_at: string;
  content_type?: string;
  size_bytes?: number;
};

export type ExecutionNodeStatus = {
  node_id: string;
  type: string;
  status: ExecutionStatus;
  started_at?: string;
  completed_at?: string;
  metadata?: Record<string, unknown>;
};

export type ExecutionInput = {
  prompt?: string;
  attachments?: string[];
  parameters?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ExecutionOutput = {
  answer?: string;
  summary?: string;
  artifacts?: ExecutionArtifact[];
  [key: string]: unknown;
};

export type ExecutionRecord = {
  execution_id: string;
  tenant_id: string;
  user_id: string;
  workflow_id?: string;
  agent_id: string;
  mode: ExecutionMode;
  status: ExecutionStatus;
  created_at: string;
  updated_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  input: ExecutionInput;
  output: ExecutionOutput;
  artifacts: ExecutionArtifact[];
  trace_id?: string;
  node_status: ExecutionNodeStatus[];
  error?: string | null;
  approved_by?: string | null;
  permissions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export const EXECUTION_STATUSES: ExecutionStatus[] = [
  'queued',
  'accepted',
  'running',
  'partial',
  'waiting_for_approval',
  'failed',
  'completed',
  'cancelled',
];

export function isTerminalExecutionStatus(status: ExecutionStatus): boolean {
  return status === 'failed' || status === 'completed' || status === 'cancelled';
}

export function createExecutionRecord(input: {
  tenant_id: string;
  user_id: string;
  agent_id: string;
  mode?: ExecutionMode;
  workflow_id?: string;
  input?: ExecutionInput;
  trace_id?: string;
  metadata?: Record<string, unknown>;
}): ExecutionRecord {
  const now = new Date().toISOString();

  return {
    execution_id: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tenant_id: input.tenant_id,
    user_id: input.user_id,
    workflow_id: input.workflow_id,
    agent_id: input.agent_id,
    mode: input.mode ?? 'auto',
    status: 'queued',
    created_at: now,
    updated_at: now,
    started_at: null,
    completed_at: null,
    input: input.input ?? {},
    output: { answer: '', summary: '', artifacts: [] },
    artifacts: [],
    trace_id: input.trace_id ?? `trace_${Date.now()}`,
    node_status: [],
    error: null,
    approved_by: null,
    permissions: {},
    metadata: input.metadata ?? {},
  };
}

export function buildExecutionRequest(payload: {
  prompt?: string;
  agent_id?: string;
  execution_id?: string;
  trace_id?: string;
  mode?: ExecutionMode;
  [key: string]: unknown;
}) {
  const agentId = payload.agent_id ?? 'office-intelligence';
  const mode = payload.mode ?? 'auto';

  return {
    ...payload,
    execution_id:
      payload.execution_id ??
      createExecutionRecord({
        tenant_id: 'default',
        user_id: 'anonymous',
        agent_id: agentId,
        mode,
        input: {
          prompt: typeof payload.prompt === 'string' ? payload.prompt : '',
          parameters: payload,
        },
        metadata: {
          source: 'frontend',
        },
      }).execution_id,
    trace_id: payload.trace_id ?? `trace_${Date.now()}`,
    agent_id: agentId,
    mode,
  };
}
