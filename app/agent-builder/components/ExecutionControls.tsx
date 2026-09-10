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
  Play,
  Plus,
  Save,
  Star,
  Cpu,
  GitBranch,
  RefreshCw,
  Layers,
  MoreHorizontal,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    <div className="bg-[var(--bg-surface)] border-b border-[var(--border-default)] flex flex-col gap-2 px-4 py-2.5 shadow-[0_8px_18px_var(--shadow-soft)]">
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="relative min-w-[200px] flex-1">
            <Input
              value={workflowName}
              onChange={e => setWorkflowName(e.target.value)}
              className="h-8 text-base font-bold border-none bg-transparent px-0 focus-visible:ring-0 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
              placeholder="Untitled Agent Workflow"
            />
          </div>
          <Badge
            className={`px-2 py-0.5 text-[11px] font-semibold border ${
              currentAgentStatus === 'active'
                ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border-[var(--border-default)]'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]'
            }`}
          >
            {currentAgentStatus === 'active' ? 'Active' : 'Draft'}
          </Badge>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">Strategy</span>
            <Select value={selectedAgentType} onValueChange={setSelectedAgentType}>
              <SelectTrigger className="w-[156px] h-8 rounded-lg text-xs border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-primary)] shadow-sm hover:bg-[var(--bg-hover)] focus:ring-2 focus:ring-[var(--color-primary)]/30">
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent className="min-w-[210px] rounded-xl border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5 text-[var(--text-primary)] shadow-[0_12px_30px_var(--shadow-soft)]">
                {AGENT_TYPE_OPTIONS.map(option => {
                  const Icon = option.icon;
                  return (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="rounded-lg px-2.5 py-2 text-xs text-[var(--text-primary)] focus:bg-[var(--bg-hover)] focus:text-[var(--text-primary)]"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        {executionStatus ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-primary)] border border-[var(--border-default)]">
              {executionStatus === 'queued' && 'Queued — waiting for worker'}
              {executionStatus === 'running' && 'Running — worker has started'}
              {executionStatus === 'completed' && 'Completed'}
              {executionStatus === 'failed' && 'Failed'}
            </span>
            {currentExecutionId ? (
              <span className="text-[11px] text-[var(--text-secondary)]">
                Execution ID: {currentExecutionId}
              </span>
            ) : null}
          </div>
        ) : null}
        {executionError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700 shadow-sm">
            <span className="font-semibold">Validation error:</span> {executionError}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={showNodePalette ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowNodePalette(!showNodePalette)}
          className={`h-8 transition-all duration-200 ${
            showNodePalette
              ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)]'
              : 'border-[var(--border-default)] bg-[var(--bg-soft)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
          }`}
        >
          {showNodePalette ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showNodePalette ? 'Hide Nodes' : 'Show Nodes'}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-[var(--border-default)] bg-[var(--bg-soft)] text-[var(--text-primary)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--bg-hover)] transition-all duration-200"
            >
              <MoreHorizontal className="w-4 h-4 mr-2" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="min-w-[200px] rounded-xl border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5 text-[var(--text-primary)] shadow-[0_12px_30px_var(--shadow-soft)]"
          >
            <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              Manage Agent
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-[var(--border-default)]" />
            <DropdownMenuItem
              onClick={saveAgentAsDraft}
              className="rounded-lg px-2.5 py-2 text-sm text-[var(--text-primary)] focus:bg-[var(--bg-hover)] focus:text-[var(--text-primary)]"
            >
              <Save className="w-4 h-4" />
              Save Agent
            </DropdownMenuItem>
            {isAdmin && openSaveAsTemplateDialog ? (
              <DropdownMenuItem
                onClick={openSaveAsTemplateDialog}
                className="rounded-lg px-2.5 py-2 text-sm text-[var(--text-primary)] focus:bg-[var(--bg-hover)] focus:text-[var(--text-primary)]"
              >
                <Star className="w-4 h-4" />
                Save as Template
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={publishAgent}
              className="rounded-lg px-2.5 py-2 text-sm text-[var(--text-primary)] focus:bg-[var(--bg-hover)] focus:text-[var(--text-primary)]"
            >
              <Play className="w-4 h-4" />
              Publish
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-[var(--border-default)]" />
            <DropdownMenuItem
              onClick={reset}
              className="rounded-lg px-2.5 py-2 text-sm text-[var(--text-secondary)] focus:bg-[var(--bg-hover)] focus:text-[var(--text-primary)]"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          onClick={executeWorkflow}
          disabled={isExecuting}
          className="h-8 border-[var(--border-default)] bg-[var(--color-primary)] text-white hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 mr-2" />
          {isExecuting ? 'Running...' : 'Run Agent'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={createNewAgentWorkflow}
          className="h-8 border-[var(--border-default)] bg-[var(--bg-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Agent
        </Button>
      </div>
    </div>
  );
}
