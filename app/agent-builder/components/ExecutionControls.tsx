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
    <div className="min-h-[5rem] bg-white/90 dark:bg-slate-800/85 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 flex flex-col justify-between px-6 py-4 shadow-lg">
      <div className="flex flex-col gap-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
          <div className="relative min-w-0 flex-1">
            <Input
              value={workflowName}
              onChange={e => setWorkflowName(e.target.value)}
              className="text-lg font-bold border-none bg-transparent px-0 focus-visible:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              placeholder="Untitled Agent Workflow"
            />
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>
          <Badge
            className={`px-3 py-1 text-xs font-semibold text-white border-0 shadow-lg transition-all duration-200 ${
              currentAgentStatus === 'active'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-400/30'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-400/30'
            }`}
          >
            {currentAgentStatus === 'active' ? 'Active' : 'Draft'}
          </Badge>
        </div>
        {executionStatus ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {executionStatus === 'queued' && 'Queued — waiting for worker'}
              {executionStatus === 'running' && 'Running — worker has started'}
              {executionStatus === 'completed' && 'Completed'}
              {executionStatus === 'failed' && 'Failed'}
            </span>
            {currentExecutionId ? (
              <span className="text-xs text-slate-500 dark:text-slate-400">
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
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Title only — keep your agent name concise and easy to identify.
        </p>
      </div>

      {/* Agent Execution Strategy Selector */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
          Execution Strategy:
        </span>
        <Select value={selectedAgentType} onValueChange={setSelectedAgentType}>
          <SelectTrigger className="w-[180px] h-8 text-xs border-slate-300 dark:border-slate-600">
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
          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic max-w-[280px] truncate">
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
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
              : 'hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          {showNodePalette ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showNodePalette ? 'Hide Nodes' : 'Show Nodes'}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={saveAgentAsDraft}
          className="bg-blue-600 hover:bg-sky-700 text-white shadow-lg shadow-blue-500/20 transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Agent
        </Button>
        {isAdmin && openSaveAsTemplateDialog ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={openSaveAsTemplateDialog}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <Star className="w-4 h-4 mr-2" />
            Save as Template
          </Button>
        ) : null}
        <Button
          variant="default"
          size="sm"
          onClick={executeWorkflow}
          disabled={isExecuting}
          className="bg-green-600 hover:bg-emerald-700 text-white shadow-lg shadow-green-500/20 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 mr-2" />
          {isExecuting ? 'Running...' : 'Run Agent'}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={createNewAgentWorkflow}
          className="bg-purple-600 hover:bg-violet-700 text-white shadow-lg shadow-purple-500/20 transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Agent
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={publishAgent}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <Play className="w-4 h-4 mr-2" />
          Publish
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="border-red-400 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20 transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button
          size="sm"
          onClick={executeWorkflow}
          disabled={isExecuting}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
        >
          <Zap className="w-4 h-4 mr-2" />
          {isExecuting ? 'Running...' : 'Run'}
        </Button>
      </div>
    </div>
  );
}
