'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Eye,
  EyeOff,
  Save,
  Play,
  Plus,
  RotateCcw,
  Zap,
  Star,
  Cpu,
  GitBranch,
  RefreshCw,
  Layers,
} from 'lucide-react';

type ExecutionControlsProps = {
  workflowName: string;
  setWorkflowName: (value: string) => void;
  currentAgentStatus: string;
  executionStatus: string | null;
  currentExecutionId: string | null;
  executionError: string | null;
  showNodePalette: boolean;
  setShowNodePalette: (value: boolean) => void;
  saveAgentAsDraft: () => Promise<void>;
  executeWorkflow: () => Promise<void>;
  createNewAgentWorkflow: () => void;
  publishAgent: () => Promise<void>;
  openSaveAsTemplateDialog?: () => void;
  isAdmin?: boolean;
  reset: () => void;
  isExecuting: boolean;
  selectedAgentType: string;
  setSelectedAgentType: (value: string) => void;
};

const AGENT_TYPE_OPTIONS = [
  {
    value: 'workflow',
    label: 'Workflow (DAG)',
    icon: GitBranch,
    description: 'Standard parallel execution based on node connections',
  },
  {
    value: 'langgraph',
    label: 'LangGraph ReAct',
    icon: Zap,
    description:
      'True ReAct loop with tool calling, checkpointing, token tracking — uses actual LangGraph library',
  },
  {
    value: 'react',
    label: 'ReAct Agent',
    icon: RefreshCw,
    description: 'Reasoning + Acting loop — AI decides each step',
  },
  {
    value: 'plan-execute',
    label: 'Plan-Execute',
    icon: Layers,
    description: 'AI generates a plan, then executes step-by-step',
  },
  {
    value: 'reflexion',
    label: 'Reflexion Agent',
    icon: Cpu,
    description: 'Execute → Self-reflect → Improve → Re-execute',
  },
];

export function ExecutionControls({
  workflowName,
  setWorkflowName,
  currentAgentStatus,
  executionStatus,
  currentExecutionId,
  showNodePalette,
  setShowNodePalette,
  saveAgentAsDraft,
  executeWorkflow,
  createNewAgentWorkflow,
  publishAgent,
  openSaveAsTemplateDialog,
  executionError,
  isAdmin = false,
  reset,
  isExecuting,
  selectedAgentType,
  setSelectedAgentType,
}: ExecutionControlsProps) {
  return (
    <div className="min-h-[5rem] bg-[var(--bg-surface)] border-b border-[var(--border-default)] flex flex-col justify-between px-6 py-4 shadow-[0_10px_22px_var(--shadow-soft)]">
      <div className="flex flex-col gap-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
          <div className="relative min-w-0 flex-1">
            <Input
              value={workflowName}
              onChange={e => setWorkflowName(e.target.value)}
              className="text-lg font-bold border-none bg-transparent px-0 focus-visible:ring-0 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
              placeholder="Untitled Agent Workflow"
            />
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--border-strong)] transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-200 origin-left"></div>
          </div>
          <Badge
            className={`px-3 py-1 text-xs font-semibold border ${
              currentAgentStatus === 'active'
                ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border-[var(--border-default)]'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]'
            }`}
          >
            {currentAgentStatus === 'active' ? 'Active' : 'Draft'}
          </Badge>
        </div>
        {executionStatus ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[var(--bg-subtle)] px-3 py-1 text-xs font-medium text-[var(--text-primary)] border border-[var(--border-default)]">
              {executionStatus === 'queued' && 'Queued — waiting for worker'}
              {executionStatus === 'running' && 'Running — worker has started'}
              {executionStatus === 'completed' && 'Completed'}
              {executionStatus === 'failed' && 'Failed'}
            </span>
            {currentExecutionId ? (
              <span className="text-xs text-[var(--text-secondary)]">
                Execution ID: {currentExecutionId}
              </span>
            ) : null}
          </div>
        ) : null}
        {executionError ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm">
            <span className="font-semibold">Validation error:</span> {executionError}
          </div>
        ) : null}
        <p className="text-xs text-[var(--text-secondary)]">
          Title only — keep your agent name concise and easy to identify.
        </p>
      </div>

      {/* Agent Execution Strategy Selector */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-medium text-[var(--text-secondary)] mr-1">
          Execution Strategy:
        </span>
        <Select value={selectedAgentType} onValueChange={setSelectedAgentType}>
          <SelectTrigger className="w-[180px] h-8 text-xs border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-primary)]">
            <SelectValue placeholder="Select strategy" />
          </SelectTrigger>
          <SelectContent>
            {AGENT_TYPE_OPTIONS.map(option => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {AGENT_TYPE_OPTIONS.find(o => o.value === selectedAgentType) && (
          <span className="text-[10px] text-[var(--text-tertiary)] italic max-w-[280px] truncate">
            {AGENT_TYPE_OPTIONS.find(o => o.value === selectedAgentType)?.description}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={showNodePalette ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowNodePalette(!showNodePalette)}
          className={`transition-all duration-200 ${
            showNodePalette
              ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)]'
              : 'border-[var(--border-default)] bg-[var(--bg-soft)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
          }`}
        >
          {showNodePalette ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showNodePalette ? 'Hide Nodes' : 'Show Nodes'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={saveAgentAsDraft}
          className="border-[var(--border-default)] bg-[var(--bg-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Agent
        </Button>
        {isAdmin && openSaveAsTemplateDialog ? (
          <Button
            variant="outline"
            size="sm"
            onClick={openSaveAsTemplateDialog}
            className="border-[var(--border-default)] bg-[var(--bg-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200"
          >
            <Star className="w-4 h-4 mr-2" />
            Save as Template
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={executeWorkflow}
          disabled={isExecuting}
          className="border-[var(--border-default)] bg-[var(--bg-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 mr-2" />
          {isExecuting ? 'Running...' : 'Run Agent'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={createNewAgentWorkflow}
          className="border-[var(--border-default)] bg-[var(--bg-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Agent
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={publishAgent}
          className="border-[var(--border-default)] bg-[var(--bg-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200"
        >
          <Play className="w-4 h-4 mr-2" />
          Publish
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={executeWorkflow}
          disabled={isExecuting}
          className="border-[var(--border-default)] bg-[var(--bg-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Zap className="w-4 h-4 mr-2" />
          {isExecuting ? 'Running...' : 'Run'}
        </Button>
      </div>
    </div>
  );
}
