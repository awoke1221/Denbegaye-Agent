'use client';

import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import clsx from 'clsx';
import { getNodeTheme } from './NodeRegistry';
import {
  ChevronDown,
  ChevronUp,
  Settings,
  Lock,
  Check,
  AlertCircle,
  Brain,
  Zap,
  Code,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

export type AdvancedAgentNodeProps = NodeProps & {
  label?: string;
  logoSrc?: string;
  onClick?: (event: React.MouseEvent) => void;
  style?: React.CSSProperties;
  icon?: string;
  isDragging?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
};

// AI Models available
const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', advanced: true },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', advanced: true },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', advanced: true },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', advanced: true },
  { id: 'grok-2', name: 'Grok-2', provider: 'groq', advanced: true },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'deepseek', advanced: false },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', advanced: false },
  { id: 'gpt-4-mini', name: 'GPT-4 Mini', provider: 'openai', advanced: false },
];

// Configuration Templates
const CONFIG_TEMPLATES = {
  'creative-writing': {
    temperature: 0.9,
    maxTokens: 2048,
    topP: 0.95,
    topK: 40,
    description: 'Optimized for creative and diverse outputs',
  },
  'technical-analysis': {
    temperature: 0.3,
    maxTokens: 1024,
    topP: 0.85,
    topK: 20,
    description: 'Focused for precise technical responses',
  },
  balanced: {
    temperature: 0.7,
    maxTokens: 1536,
    topP: 0.9,
    topK: 30,
    description: 'Balanced between creativity and accuracy',
  },
  research: {
    temperature: 0.5,
    maxTokens: 4096,
    topP: 0.92,
    topK: 40,
    description: 'Extended output for research tasks',
  },
};

interface NodeConfig {
  llmProvider: string;
  model: string;
  apiKey: string;
  systemPrompt: string;
  inputText: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  configTemplate: string;
  enableToolCalling: string;
  tools: string;
  enableMemory: string;
  memoryType: string;
  maxIterations: number;
  reasoningType: string;
  outputFormat: string;
  toolOutputs: string[];
  memoryOutputs: string[];
}

export const AdvancedAgentNode = memo((props: AdvancedAgentNodeProps) => {
  const { data = {}, selected, dragging, isConnectable, onClick, style, id } = props;
  const reactFlowInstance = useReactFlow();
  const [isExpanded, setIsExpanded] = useState(selected);
  const [activeTab, setActiveTab] = useState<'model' | 'config' | 'prompt'>('model');
  const [showApiKey, setShowApiKey] = useState(false);
  const [config, setConfig] = useState<NodeConfig>({
    llmProvider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKey: '',
    systemPrompt: 'You are a helpful AI assistant.',
    inputText: '',
    temperature: 0.7,
    maxTokens: 1536,
    topP: 0.9,
    topK: 30,
    configTemplate: 'balanced',
    enableToolCalling: 'yes',
    tools: 'tool-1, tool-2',
    enableMemory: 'yes',
    memoryType: 'semantic',
    maxIterations: 10,
    reasoningType: 'step-by-step',
    outputFormat: 'text',
    toolOutputs: ['tool-1', 'tool-2'],
    memoryOutputs: ['memory-1', 'memory-2'],
    ...data.config,
  });

  const colorTheme = getNodeTheme('denbegaye-agent');
  const nodeLabel = data.label || 'Advanced AI Node';

  // Sync node configuration back to React Flow node data
  useEffect(() => {
    reactFlowInstance.setNodes(nodes =>
      nodes.map(node => (node.id === id ? { ...node, data: { ...node.data, config } } : node))
    );
  }, [config, id, reactFlowInstance]);

  // Validation states
  const configStatus = useMemo(() => {
    const isValid =
      !!config.apiKey &&
      !!config.model &&
      !!config.systemPrompt &&
      !!config.inputText &&
      !!config.llmProvider &&
      !!config.enableToolCalling &&
      !!config.enableMemory &&
      !!config.maxIterations &&
      !!config.reasoningType &&
      !!config.outputFormat;
    const incomplete = !config.apiKey || !config.model;
    const warnings = !config.inputText ? ['Input text not set'] : [];
    return { isValid, incomplete, warnings };
  }, [config]);

  const handleConfigChange = useCallback((key: keyof NodeConfig, value: any) => {
    setConfig(prev => {
      const nextConfig = { ...prev, [key]: value };

      if (key === 'model') {
        const modelInfo = AI_MODELS.find(item => item.id === value);
        if (modelInfo) {
          nextConfig.llmProvider = modelInfo.provider.toLowerCase();
        }
      }

      if (key === 'llmProvider') {
        const matchingModel = AI_MODELS.find(
          item => item.provider.toLowerCase() === (value as string).toLowerCase()
        );
        if (matchingModel && matchingModel.id !== nextConfig.model) {
          nextConfig.model = matchingModel.id;
        }
      }

      if (key === 'toolOutputs') {
        nextConfig.tools = nextConfig.toolOutputs.join(', ');
      }

      if (key === 'enableToolCalling' && value === 'no') {
        nextConfig.tools = '';
      }

      return nextConfig;
    });
  }, []);

  const addToolOutput = useCallback(() => {
    setConfig(prev => {
      const toolOutputs = [...prev.toolOutputs, `tool-${prev.toolOutputs.length + 1}`];
      return {
        ...prev,
        toolOutputs,
        tools: toolOutputs.join(', '),
      };
    });
  }, []);

  const removeToolOutput = useCallback((index: number) => {
    setConfig(prev => {
      const toolOutputs = prev.toolOutputs.filter((_, i) => i !== index);
      return {
        ...prev,
        toolOutputs,
        tools: toolOutputs.join(', '),
      };
    });
  }, []);

  const addMemoryOutput = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      memoryOutputs: [...prev.memoryOutputs, `memory-${prev.memoryOutputs.length + 1}`],
    }));
  }, []);

  const removeMemoryOutput = useCallback((index: number) => {
    setConfig(prev => ({
      ...prev,
      memoryOutputs: prev.memoryOutputs.filter((_, i) => i !== index),
    }));
  }, []);

  const handleTemplateChange = useCallback((templateKey: string) => {
    const template = CONFIG_TEMPLATES[templateKey as keyof typeof CONFIG_TEMPLATES];
    if (template) {
      setConfig(prev => ({
        ...prev,
        ...template,
        configTemplate: templateKey,
      }));
    }
  }, []);

  const selectedModel = AI_MODELS.find(m => m.id === config.model);

  const nodeBaseStyle = {
    boxShadow: selected
      ? `0 0 24px rgba(139, 92, 246, 0.4), 0 0 48px rgba(99, 102, 241, 0.2), ${colorTheme.glow}`
      : colorTheme.glow,
  };

  return (
    <div
      className={clsx(
        'relative border-2 shadow-2xl transition-all duration-300',
        'flex flex-col overflow-hidden',
        'node-base node-interactive group cursor-pointer',
        {
          'rounded-2xl': !isExpanded,
          'rounded-xl': isExpanded,
          'border-indigo-400 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900':
            selected,
          'border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900': !selected,
          'scale-105 shadow-[0_0_40px_rgba(99,102,241,0.25)]': dragging,
          'opacity-95': dragging,
          'hover:-translate-y-0.5 hover:shadow-[0_20px_80px_-30px_rgba(99,102,241,0.7)]': !dragging,
        }
      )}
      style={{
        width: isExpanded ? '420px' : '280px',
        height: isExpanded ? '580px' : '220px',
        ...nodeBaseStyle,
        ...style,
      }}
      tabIndex={0}
      aria-label={nodeLabel}
      onClick={event => {
        event.stopPropagation();
        onClick?.(event as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>);
      }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
      </div>

      {/* Header Section */}
      <div className="relative z-10 px-4 py-3 border-b border-indigo-500/30 bg-black/40 backdrop-blur-sm group-hover:bg-slate-900/80 transition-colors duration-300">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={clsx(
                'p-2 rounded-lg transition-all duration-300',
                configStatus.isValid ? 'bg-emerald-500/20' : 'bg-amber-500/20'
              )}
            >
              <Brain
                className={clsx(
                  'w-4 h-4',
                  configStatus.isValid ? 'text-emerald-400' : 'text-amber-400'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{nodeLabel}</h3>
              <p className="text-xs text-slate-400 truncate">
                {selectedModel?.name || 'Select Model'}
              </p>
            </div>
          </div>
          <button
            onClick={e => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1.5 bg-slate-950/80 hover:bg-indigo-500/30 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-indigo-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        </div>

        {/* Status Bar */}
        {!isExpanded && (
          <div className="mt-2 flex gap-2 text-xs">
            {configStatus.isValid && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Check className="w-3 h-3" /> Ready
              </span>
            )}
            {configStatus.incomplete && (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertCircle className="w-3 h-3" /> Incomplete
              </span>
            )}
          </div>
        )}

        {data.executionState === 'failed' && data.executionError && (
          <div
            role="alert"
            className="mt-3 max-h-20 overflow-y-auto rounded-md border border-red-400/40 bg-red-950/70 px-2 py-1.5 text-xs leading-snug text-red-100"
            title={String(data.executionError)}
          >
            <span className="font-semibold text-red-300">Node error: </span>
            {String(data.executionError)}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden bg-slate-900/50 backdrop-blur-sm">
          {/* Tab Navigation */}
          <div className="flex border-b border-indigo-500/30 px-3 pt-2">
            {(['model', 'config', 'prompt'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'px-3 py-2 text-xs font-semibold transition-colors',
                  activeTab === tab
                    ? 'text-indigo-400 border-b-2 border-indigo-400'
                    : 'text-slate-400 hover:text-slate-300'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {/* Model Tab */}
            {activeTab === 'model' && (
              <div className="space-y-3">
                {/* Provider Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    LLM Provider
                  </label>
                  <select
                    value={config.llmProvider}
                    onChange={e => handleConfigChange('llmProvider', e.target.value)}
                    className="w-full bg-slate-800 border border-indigo-500/30 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                  >
                    {Array.from(new Set(AI_MODELS.map(model => model.provider.toLowerCase()))).map(
                      provider => (
                        <option key={provider} value={provider}>
                          {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Model Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Model</label>
                  <select
                    value={config.model}
                    onChange={e => handleConfigChange('model', e.target.value)}
                    className="w-full bg-slate-800 border border-indigo-500/30 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                  >
                    {AI_MODELS.filter(
                      model => model.provider.toLowerCase() === config.llmProvider
                    ).map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* API Key Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={config.apiKey}
                      onChange={e => handleConfigChange('apiKey', e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-slate-800 border border-indigo-500/30 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 pr-8"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Config Tab */}
            {activeTab === 'config' && (
              <div className="space-y-3">
                {/* Config Template */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Preset</label>
                  <select
                    value={config.configTemplate}
                    onChange={e => handleTemplateChange(e.target.value)}
                    className="w-full bg-slate-800 border border-indigo-500/30 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                  >
                    {Object.entries(CONFIG_TEMPLATES).map(([key, template]) => (
                      <option key={key} value={key}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} - {template.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Temperature */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">Temperature</label>
                    <span className="text-xs text-indigo-400 font-mono">
                      {config.temperature.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature}
                    onChange={e => handleConfigChange('temperature', parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Max Tokens */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">Max Tokens</label>
                    <span className="text-xs text-indigo-400 font-mono">{config.maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min="256"
                    max="4096"
                    step="256"
                    value={config.maxTokens}
                    onChange={e => handleConfigChange('maxTokens', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Top P */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">Top P</label>
                    <span className="text-xs text-indigo-400 font-mono">
                      {config.topP.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.topP}
                    onChange={e => handleConfigChange('topP', parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Top K */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">Top K</label>
                    <span className="text-xs text-indigo-400 font-mono">{config.topK}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={config.topK}
                    onChange={e => handleConfigChange('topK', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Enable Tool Calling
                    </label>
                    <select
                      value={config.enableToolCalling}
                      onChange={e => handleConfigChange('enableToolCalling', e.target.value)}
                      className="w-full bg-slate-800 border border-indigo-500/30 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Enable Memory
                    </label>
                    <select
                      value={config.enableMemory}
                      onChange={e => handleConfigChange('enableMemory', e.target.value)}
                      className="w-full bg-slate-800 border border-indigo-500/30 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>

                {config.enableToolCalling === 'yes' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Tools</label>
                    <textarea
                      value={config.tools}
                      onChange={e => handleConfigChange('tools', e.target.value)}
                      placeholder="tool-1, tool-2"
                      className="w-full h-20 bg-slate-800 border border-indigo-500/30 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 resize-none"
                    />
                  </div>
                )}

                {config.enableMemory === 'yes' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Memory Type
                    </label>
                    <select
                      value={config.memoryType}
                      onChange={e => handleConfigChange('memoryType', e.target.value)}
                      className="w-full bg-slate-800 border border-indigo-500/30 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    >
                      <option value="semantic">Semantic</option>
                      <option value="episodic">Episodic</option>
                      <option value="working">Working</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Max Iterations
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={config.maxIterations}
                      onChange={e =>
                        handleConfigChange('maxIterations', parseInt(e.target.value) || 1)
                      }
                      className="w-full bg-slate-800 border border-indigo-500/30 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Reasoning Type
                    </label>
                    <select
                      value={config.reasoningType}
                      onChange={e => handleConfigChange('reasoningType', e.target.value)}
                      className="w-full bg-slate-800 border border-indigo-500/30 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    >
                      <option value="step-by-step">Step-by-step</option>
                      <option value="chain-of-thought">Chain-of-thought</option>
                      <option value="tree-of-thought">Tree-of-thought</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Output Format
                    </label>
                    <select
                      value={config.outputFormat}
                      onChange={e => handleConfigChange('outputFormat', e.target.value)}
                      className="w-full bg-slate-800 border border-indigo-500/30 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    >
                      <option value="text">Text</option>
                      <option value="json">JSON</option>
                      <option value="structured">Structured</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Prompt Tab */}
            {activeTab === 'prompt' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    System Prompt
                  </label>
                  <textarea
                    value={config.systemPrompt}
                    onChange={e => handleConfigChange('systemPrompt', e.target.value)}
                    placeholder="You are a helpful AI assistant."
                    className="w-full h-24 bg-slate-800 border border-indigo-500/30 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Input Text
                  </label>
                  <textarea
                    value={config.inputText}
                    onChange={e => handleConfigChange('inputText', e.target.value)}
                    placeholder="Enter the text the agent should process..."
                    className="w-full h-24 bg-slate-800 border border-indigo-500/30 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 resize-none"
                  />
                </div>
                <div className="bg-slate-800/50 border border-indigo-500/20 rounded px-2 py-1.5 text-xs text-slate-400">
                  <div className="flex items-start gap-2">
                    <Zap className="w-3 h-3 mt-0.5 flex-shrink-0 text-indigo-400" />
                    <span>
                      Use the agent prompt to guide tasks and the input text to specify what to
                      process.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-indigo-500/30 bg-slate-950/70 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-300">Tool Connections</div>
                <div className="mt-1 text-[0.72rem] text-slate-400">
                  Create multiple tool outputs from this node and remove any unused ones.
                </div>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  addToolOutput();
                }}
                className="inline-flex items-center gap-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-1 text-[0.7rem] text-indigo-300 hover:bg-indigo-500/20"
              >
                + Add Tool
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[0.72rem] text-slate-300">
              {config.toolOutputs.map((tool, index) => (
                <div
                  key={tool}
                  className="group relative rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 transition hover:border-cyan-400 hover:bg-slate-800/95"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-100">{tool}</div>
                      <div className="text-slate-500">Tool output #{index + 1}</div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        removeToolOutput(index);
                      }}
                      className="text-slate-400 hover:text-white"
                      aria-label={`Remove ${tool}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-300">Memory Connections</div>
                <div className="mt-1 text-[0.72rem] text-slate-400">
                  Create multiple memory outputs from this node and remove unused memory channels.
                </div>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  addMemoryOutput();
                }}
                className="inline-flex items-center gap-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-1 text-[0.7rem] text-indigo-300 hover:bg-indigo-500/20"
              >
                + Add Memory
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[0.72rem] text-slate-300">
              {config.memoryOutputs.map((memory, index) => (
                <div
                  key={memory}
                  className="group relative rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 transition hover:border-fuchsia-400 hover:bg-slate-800/95"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-100">{memory}</div>
                      <div className="text-slate-500">Memory output #{index + 1}</div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        removeMemoryOutput(index);
                      }}
                      className="text-slate-400 hover:text-white"
                      aria-label={`Remove ${memory}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer with Validation Info */}
          <div className="border-t border-indigo-500/30 px-3 py-2 bg-black/40 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {configStatus.isValid ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-semibold">Ready to Use</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-amber-400 font-semibold">
                      Configuration Needed
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="px-2 py-1 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 rounded transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Status Indicators (when collapsed) */}
      {!isExpanded && (
        <div className="relative z-10 px-4 py-2 flex items-center justify-between border-t border-indigo-500/20 bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-xs">
            <div
              className={clsx(
                'p-1 rounded',
                config.model ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-500'
              )}
            >
              <Brain className="w-3 h-3" />
            </div>
            <div
              className={clsx(
                'p-1 rounded',
                config.apiKey
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-700/50 text-slate-500'
              )}
            >
              <Lock className="w-3 h-3" />
            </div>
            <div
              className={clsx(
                'p-1 rounded',
                config.inputText
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-slate-700/50 text-slate-500'
              )}
            >
              <Code className="w-3 h-3" />
            </div>
          </div>
        </div>
      )}

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="main-input"
        isConnectable={isConnectable}
        className="!w-3 !h-3 !rounded-full !bg-indigo-500 !border-2 !border-indigo-300 !shadow-lg hover:!bg-indigo-400"
        style={{ top: -6 }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="tool-target"
        isConnectable={isConnectable}
        className="!w-4 !h-4 !rounded-sm !bg-cyan-500 !border-2 !border-cyan-300 !shadow-lg hover:!bg-cyan-400"
        style={{ top: -6, left: 20 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="previous-node"
        isConnectable={isConnectable}
        className="!w-3 !h-3 !rounded-full !bg-blue-500 !border-2 !border-blue-300 !shadow-lg hover:!bg-blue-400"
        style={{ left: -6, top: 80 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="control-input"
        isConnectable={isConnectable}
        className="!w-3 !h-3 !rounded-full !bg-amber-500 !border-2 !border-amber-300 !shadow-lg hover:!bg-amber-400"
        style={{ left: -6, top: 140 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="next-node"
        isConnectable={isConnectable}
        className="!w-3 !h-3 !rounded-full !bg-emerald-500 !border-2 !border-emerald-300 !shadow-lg hover:!bg-emerald-400"
        style={{ right: -6, top: 80 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="memory-node"
        isConnectable={isConnectable}
        className="!w-3 !h-3 !rounded-full !bg-pink-500 !border-2 !border-pink-300 !shadow-lg hover:!bg-pink-400"
        style={{ right: -6, top: 140 }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="tool-source"
        isConnectable={isConnectable}
        className="!w-4 !h-4 !rounded-sm !bg-cyan-500 !border-2 !border-cyan-300 !shadow-lg hover:!bg-cyan-400"
        style={{ top: -6, right: 20 }}
      />
      {config.toolOutputs.map((tool, index) => (
        <Handle
          key={`tool-output-${index}`}
          type="source"
          position={Position.Bottom}
          id={`tool-output-${index}`}
          isConnectable={isConnectable}
          className="!w-3 !h-3 !rounded-full !bg-cyan-500 !border-2 !border-cyan-300 !shadow-lg hover:!bg-cyan-400"
          style={{ left: `${18 + index * 12}%`, bottom: -6 }}
        />
      ))}
      {config.memoryOutputs.map((memory, index) => (
        <Handle
          key={`memory-output-${index}`}
          type="source"
          position={Position.Bottom}
          id={`memory-output-${index}`}
          isConnectable={isConnectable}
          className="!w-3 !h-3 !rounded-full !bg-fuchsia-500 !border-2 !border-fuchsia-300 !shadow-lg hover:!bg-fuchsia-400"
          style={{ left: `${60 + index * 12}%`, bottom: -6 }}
        />
      ))}
    </div>
  );
});

AdvancedAgentNode.displayName = 'AdvancedAgentNode';
