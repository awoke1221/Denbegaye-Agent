'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Edge,
  Node,
  NodeChange,
  applyNodeChanges,
  applyEdgeChanges,
  OnConnect,
  Connection,
  useReactFlow,
  ReactFlowProvider,
  getBezierPath,
  EdgeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { Socket } from 'socket.io-client';
import { getSharedSocket } from '@/lib/socket-client';
import { extractAvatarInitials } from '@/lib/avatar-utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getNodeIcon, getNodeTheme } from '@/components/agent-nodes/NodeRegistry';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentBuilderStore, AgentNodeData } from '@/stores/agentBuilderStore';
import { AgentBuilderTemplates as agentBuilderTemplates } from '@/lib/agentBuilderTemplates';
import { AgentWorkflow, UserAgent } from '@/types/agent';
import { supabase } from '@/lib/supabaseClient';
import { WebhookManager } from '@/components/webhook-manager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  LayoutDashboard,
  FileText,
  Settings,
  ShoppingBag,
  Clock,
  Play,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Zap,
  Cpu,
  MessageSquare,
  Mail,
  Send,
  Database,
  Webhook,
  Smartphone,
  Globe,
  Youtube,
  Facebook,
  Twitter,
  Linkedin,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Download,
} from 'lucide-react';

import { availableNodeTypes, sidebarItems, nodeTypes } from '../constants/nodeTypes';
import { BrandGlowEdge } from './BrandGlowEdge';
import { AgentBuilderSidebar } from './AgentBuilderSidebar';
import { ExecutionControls } from './ExecutionControls';
import { AgentBuilderCanvas } from './AgentBuilderCanvas';
import { NodeManagement } from './NodeManagement';
import { AgentBuilderDashboard } from './AgentBuilderDashboard';
import { AgentBuilderTemplates } from './AgentBuilderTemplates';
import { AgentBuilderVault } from './AgentBuilderVault';
import { AgentBuilderSettings } from './AgentBuilderSettings';
import { AgentBuilderLogPanel } from './AgentBuilderLogPanel';
import { useAgentBuilderEffects } from './useAgentBuilderEffects';

function AgentBuilderContent() {
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    type: 'node' | 'edge' | 'canvas' | null;
    id?: string;
    x: number;
    y: number;
    data?: any;
  }>({ type: null, x: 0, y: 0 });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'Agentic Workflow',
    is_public: true,
    version: '1.0.0',
  });
  const [savingTemplate, setSavingTemplate] = useState(false);

  const templateCategories = [
    'Agentic Workflow',
    'Business Automation',
    'Content Creation',
    'Marketing',
    'Customer Service',
    'Productivity',
    'Sales',
    'E-commerce',
    'Finance',
    'Data Analysis',
    'Operations',
    'Education',
    'Healthcare',
    'Other',
  ];

  // Execution state
  const [executionStatuses, setExecutionStatuses] = useState<
    Record<string, { status: string; nodeStatuses: Record<string, string> }>
  >({});
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const router = useRouter();
  const { user, loading } = useAuth();
  const { nodes, edges, selectedNodeId, setNodes, setEdges, selectNode, reset } =
    useAgentBuilderStore();
  const nodesRef = useRef(nodes);
  const oauthRedirectHandledRef = useRef(false);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Search/filter state (must be after nodes/edges)
  const [searchQuery, setSearchQuery] = useState('');
  // Compute filtered/highlighted nodes/edges
  const filteredNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return nodes
      .filter(
        (n: Node) =>
          (n.data?.label?.toLowerCase?.() || '').includes(q) ||
          n.id.toLowerCase().includes(q) ||
          (n.type?.toLowerCase?.() || '').includes(q)
      )
      .map(n => n.id);
  }, [searchQuery, nodes]);
  const filteredEdgeIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return edges
      .filter(
        (e: Edge) =>
          e.id.toLowerCase().includes(q) ||
          (e.source && e.source.toLowerCase().includes(q)) ||
          (e.target && e.target.toLowerCase().includes(q))
      )
      .map(e => e.id);
  }, [searchQuery, edges]);

  // Templates state
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const filteredTemplates = useMemo(() => {
    return agentBuilderTemplates.filter(template => {
      const matchesSearch =
        templateSearchQuery === '' ||
        template.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(templateSearchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templateSearchQuery, selectedCategory]);

  // Helper function to render icons consistently
  const renderIcon = (icon: any, className: string = '') => {
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return <IconComponent className={className} />;
    } else if (typeof icon === 'string' && icon.startsWith('<svg')) {
      return <div className={className} dangerouslySetInnerHTML={{ __html: icon }} />;
    } else if (typeof icon === 'string') {
      // It's a Lucide icon name
      const IconComponent = getNodeIcon(icon);
      return <IconComponent className={className} />;
    } else {
      // Fallback
      return <div className={className}>⚙️</div>;
    }
  };

  // Utility: duplicate node
  const duplicateNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const position = node.position ?? { x: 0, y: 0 };
    const newNode = {
      ...node,
      id: `${Date.now()}`,
      position: { x: position.x + 40, y: position.y + 40 },
      data: { ...node.data, label: node.data.label + ' (Copy)' },
    };
    setNodes([...nodes, newNode]);
  };
  // Utility: clone edge
  const duplicateEdge = (edgeId: string) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    const newEdge = {
      ...edge,
      id: `${Date.now()}`,
    };
    setEdges([...edges, newEdge]);
  };
  // Utility: copy config
  const copyConfig = (config: any) => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setLog(prev => [...prev, 'Config copied to clipboard']);
  };

  const formatErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && error !== null) {
      try {
        return JSON.stringify(error);
      } catch {
        return 'Unknown error object';
      }
    }
    return String(error);
  };

  const parseResponseBody = async (response: Response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const extractValidationNodeIds = (messages: string[]) => {
    const nodeIds: Record<string, string[]> = {};

    messages.forEach(message => {
      const match = message.match(/Node\s+([\w-]+):\s*(.*)/i);
      if (match) {
        const nodeId = match[1];
        const text = match[2] || message;
        nodeIds[nodeId] = nodeIds[nodeId] || [];
        nodeIds[nodeId].push(text);
      }
    });

    return nodeIds;
  };

  const applyValidationErrorsToNodes = (errors: string[]) => {
    const nodesWithErrors = extractValidationNodeIds(errors);
    if (Object.keys(nodesWithErrors).length === 0) return;

    const updatedNodes = nodes.map(node => {
      const nodeErrors = nodesWithErrors[node.id];
      if (!nodeErrors) return node;

      return {
        ...node,
        data: {
          ...node.data,
          executionState: 'failed' as const,
          executionError: nodeErrors.join('; '),
        },
      };
    });

    setNodes(updatedNodes);
  };

  const getNodeConfigurationErrors = (node: Node): string[] => {
    const config = node.data?.config || {};
    const input = node.data?.input || {};
    const type = node.type;
    const errors: string[] = [];

    if (type && (type === 'ai' || type.startsWith('ai-'))) {
      if (!config.systemPrompt && !config.messages && !input.prompt && !config.inputText) {
        errors.push(`Node ${node.id}: AI nodes require a prompt or messages configuration`);
      }
      if (!config.inputText && !input.inputText) {
        errors.push(`Node ${node.id}: Input Text is required`);
      }
    }

    if (type && (type === 'api' || type === 'core-http-request')) {
      if (!config.url && !config.endpoint) {
        errors.push(`Node ${node.id}: API nodes require a URL or endpoint configuration`);
      }
    }

    if (type === 'action-email') {
      if (!config.to && !config.recipients && !input.to) {
        errors.push(`Node ${node.id}: Email action nodes require recipient configuration`);
      }

      // Provider-specific validation
      const provider = config.provider;
      if (provider === 'smtp') {
        if (!config.smtpHost) {
          errors.push(`Node ${node.id}: SMTP Host is required`);
        }
        if (!config.smtpPort) {
          errors.push(`Node ${node.id}: SMTP Port is required`);
        }
        if (!config.smtpUser) {
          errors.push(`Node ${node.id}: SMTP User is required`);
        }
        if (!config.smtpPassword) {
          errors.push(`Node ${node.id}: SMTP Password is required`);
        }
      } else if (provider === 'sendgrid') {
        if (!config.sendgridApiKey) {
          errors.push(`Node ${node.id}: SendGrid API Key is required`);
        }
        if (!config.sendgridFromEmail) {
          errors.push(`Node ${node.id}: SendGrid From Email is required`);
        }
      } else if (provider === 'mailgun') {
        if (!config.mailgunApiKey) {
          errors.push(`Node ${node.id}: Mailgun API Key is required`);
        }
        if (!config.mailgunDomain) {
          errors.push(`Node ${node.id}: Mailgun Domain is required`);
        }
      } else if (provider === 'ses') {
        if (!config.awsRegion) {
          errors.push(`Node ${node.id}: AWS Region is required`);
        }
        if (!config.awsAccessKey) {
          errors.push(`Node ${node.id}: AWS Access Key is required`);
        }
        if (!config.awsSecretKey) {
          errors.push(`Node ${node.id}: AWS Secret Key is required`);
        }
      }
    }

    if (type === 'action-webhook') {
      if (!config.url && !input.url) {
        errors.push(`Node ${node.id}: Webhook action nodes require a URL configuration`);
      }
    }

    if (type === 'trigger-schedule') {
      if (!config.cronExpression && !config.interval) {
        errors.push(
          `Node ${node.id}: Schedule trigger nodes require a cron expression or interval`
        );
      }
    }

    if (type === 'core-code-js' || type === 'core-code-python') {
      if (!config.code && !input.code) {
        errors.push(`Node ${node.id}: Code execution nodes require a code block configuration`);
      }
    }

    if (type === 'logic-delay') {
      if (!config.duration && !input.duration) {
        errors.push(`Node ${node.id}: Delay nodes require a duration configuration`);
      }
    }

    if (type === 'logic-if' || type === 'core-if') {
      if (!config.condition && !input.condition) {
        errors.push(`Node ${node.id}: Logic nodes require a condition configuration`);
      }
    }

    if (type === 'logic-loop') {
      if (!config.iterations && !config.condition) {
        errors.push(
          `Node ${node.id}: Loop nodes require either iterations count or exit condition`
        );
      }
    }

    if (type === 'core-set' || type === 'core-transform') {
      if (!config.expression) {
        errors.push(`Node ${node.id}: Transform nodes require an expression configuration`);
      }
    }

    if (type === 'action-save-db') {
      if (!config.table && !config.collection) {
        errors.push(
          `Node ${node.id}: Database action nodes require table/collection configuration`
        );
      }
    }

    const metadata = getNodeTypeMetadata(type);
    if (metadata?.configs?.length) {
      metadata.configs.forEach(field => {
        // Skip validation if field has a condition and it evaluates to false
        if (field.condition && !field.condition(config)) {
          return;
        }

        if (field.required === false) return;
        const key = normalizeConfigKey(field.l);
        const message = `Node ${node.id}: ${field.l} is required`;
        if (!isConfiguredValue(config[key]) && !errors.includes(message)) {
          errors.push(message);
        }
      });
    }

    return errors;
  };

  const validateWorkflowGraph = (nodes: Node[], edges: Edge[]) => {
    const errors: string[] = [];
    const nodeIds = new Set(nodes.map(node => node.id));

    edges.forEach(edge => {
      if (!edge.source || !nodeIds.has(edge.source)) {
        errors.push(`Edge ${edge.id} has invalid source: ${edge.source}`);
      }
      if (!edge.target || !nodeIds.has(edge.target)) {
        errors.push(`Edge ${edge.id} has invalid target: ${edge.target}`);
      }
    });

    const missingTypes = nodes
      .filter(node => !node.type || !(node.type in nodeTypes))
      .map(node => node.type || 'unknown');
    if (missingTypes.length > 0) {
      errors.push(
        `Missing or unsupported node types: ${Array.from(new Set(missingTypes)).join(', ')}`
      );
    }

    const inDegree: Record<string, number> = {};
    nodes.forEach(node => {
      inDegree[node.id] = 0;
    });
    edges.forEach(edge => {
      if (edge.target && inDegree[edge.target] !== undefined) {
        inDegree[edge.target]++;
      }
    });

    const roots = nodes.filter(node => inDegree[node.id] === 0);
    if (roots.length === 0) {
      errors.push('No starting node found; the graph may contain a cycle or have no entry point.');
    }

    nodes.forEach(node => {
      errors.push(...getNodeConfigurationErrors(node));
    });

    return errors;
  };
  // Inline node editing state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeLabel, setEditingNodeLabel] = useState<string>('');

  // Start editing on double click
  const onNodeDoubleClick = (_event: any, node: Node) => {
    setEditingNodeId(node.id);
    setEditingNodeLabel(node.data.label || '');
  };

  // Save label on blur or Enter
  const saveInlineEdit = () => {
    if (editingNodeId) {
      const updatedNodes = nodes.map(n =>
        n.id === editingNodeId ? { ...n, data: { ...n.data, label: editingNodeLabel } } : n
      );
      setNodes(updatedNodes);
    }
    setEditingNodeId(null);
    setEditingNodeLabel('');
  };

  // Undo/Redo state (must be after nodes/edges/setNodes/setEdges)
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [future, setFuture] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const isTimeTravelRef = useRef(false);

  const [workflowName, setWorkflowName] = useState('Untitled Agent Workflow');
  const [agentDescription, setAgentDescription] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [currentAgentStatus, setCurrentAgentStatus] = useState<
    'draft' | 'active' | 'archived' | 'error' | 'published' | 'published' | string
  >('draft');
  const [log, setLog] = useState<string[]>([]);
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    gemini: '',
    deepseek: '',
    gmail: '',
  });
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
  const [credentials, setCredentials] = useState<
    Array<{
      id: string;
      provider: string;
      label?: string;
      is_active: boolean;
      created_at: string;
      last_used_at?: string;
    }>
  >([]);
  const [credentialForm, setCredentialForm] = useState({
    provider: 'openai',
    label: '',
    apiKey: '',
  });
  const [activeSection, setActiveSection] = useState<
    'builder' | 'dashboard' | 'settings' | 'templates' | 'webhooks' | 'vault'
  >('builder');
  const [showNodePalette, setShowNodePalette] = useState(true);
  const [nodePalettePosition, setNodePalettePosition] = useState({ x: 80, y: 80 });
  const [settingsPosition, setSettingsPosition] = useState({ x: 80, y: 80 });
  const [nodeConfigPosition, setNodeConfigPosition] = useState({ x: 80, y: 80 });
  const [draggingPane, setDraggingPane] = useState<null | 'palette' | 'settings' | 'nodeConfig'>(
    null
  );
  const [showLogPanel, setShowLogPanel] = useState(false);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const draftUserAgents = userAgents.filter(agent => agent.status === 'draft');
  const activeUserAgents = userAgents.filter(agent => agent.status === 'active');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNodeConfigPosition({ x: window.innerWidth - 400, y: 80 });
    }
  }, []);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<Record<string, any> | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [pollingExecution, setPollingExecution] = useState(false);
  const [currentExecutingNodeId, setCurrentExecutingNodeId] = useState<string | null>(null);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  // Use the extracted effects hook
  const { undo, redo, approvalRequest, submitApproval } = useAgentBuilderEffects({
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
  });

  // Persist state to localStorage (autosave)
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
  }, [nodes, edges, workflowName, selectedAgentId, currentAgentStatus]);

  // Push to history on every node/edge change (but skip during undo/redo)
  useEffect(() => {
    if (isTimeTravelRef.current) {
      isTimeTravelRef.current = false;
      return;
    }
    setHistory(h => [...h.slice(-49), { nodes, edges }]); // cap 50 entries
    setFuture([]);
  }, [nodes, edges]);

  // Undo handler
  const undoHandler = () => {
    if (history.length < 2) return;
    const prev = history[history.length - 2];
    isTimeTravelRef.current = true;
    setFuture(f => [{ nodes, edges }, ...f].slice(0, 50));
    setHistory(h => h.slice(0, h.length - 1));
    setNodes(prev.nodes);
    setEdges(prev.edges);
  };

  // Redo handler
  const redoHandler = () => {
    if (future.length === 0) return;
    const next = future[0];
    isTimeTravelRef.current = true;
    setHistory(h => [...h.slice(-49), next]);
    setHistory(h => [...h.slice(-49), next]);
    setNodes(next.nodes);
    setEdges(next.edges);
    setFuture(f => f.slice(1));
  };
  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undoHandler();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redoHandler();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auth hook
  const { user: currentUser } = useAuth();

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
  }, [draggingPane, dragOffset]);

  // Socket.IO connection for real-time execution updates
  useEffect(() => {
    const socket = getSharedSocket();
    socketRef.current = socket;

    const appendLog = (message: string) => {
      setLog(prev => {
        if (prev.some(entry => entry === message)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    const initializeExecutionState = (executionId: string) => {
      setCurrentExecutionId(executionId);
      setExecutionStatuses(prev => ({
        ...prev,
        [executionId]: {
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
      appendLog(`Execution started: ${executionId}`);
    };

    socket.on('execution-started', (data: { executionId: string }) => {
      console.log('[socket → agentBuilder] execution-started', data);
      initializeExecutionState(data.executionId);
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
        error?: string;
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
                      : data.error || data.errorStack || 'Unknown error',
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

    return () => {
      // Shared socket is reused across components, so do not disconnect here.
    };
  }, []);

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

  const getAuthToken = async () => {
    const session = await supabase.auth.getSession();
    return session?.data?.session?.access_token || null;
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

  const createCredential = async () => {
    if (!currentUser?.id) {
      setLog(prev => [...prev, 'Please sign in to save credentials']);
      return;
    }
    const token = await getAuthToken();
    if (!token) {
      setLog(prev => [...prev, 'Unable to retrieve auth token']);
      return;
    }

    const response = await fetch('/api/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider: credentialForm.provider,
        label: credentialForm.label || `${credentialForm.provider} key`,
        apiKey: credentialForm.apiKey,
      }),
    });

    const data = await response.json();
    if (data.error) {
      setLog(prev => [...prev, `Credential save failed: ${data.error}`]);
      return;
    }
    setCredentialForm({ provider: 'openai', label: '', apiKey: '' });
    loadCredentials();
    setLog(prev => [...prev, `Credential saved for ${credentialForm.provider}`]);
  };

  const saveApiKeys = () => {
    // TODO: implement saving API keys to localStorage or backend
    localStorage.setItem('agent-builder-api-keys', JSON.stringify(apiKeys));
    setLog(prev => [...prev, 'API keys saved']);
  };

  const exportAgentJson = (agent: UserAgent) => {
    const payload = {
      name: agent.name || 'Untitled Agent',
      nodes: agent.config?.nodes || [],
      edges: agent.config?.edges || [],
      updatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${agent.name || 'agent-workflow'}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setLog(prev => [...prev, `Exported agent JSON: ${agent.name || 'Untitled Agent'}`]);
  };

  const normalizeAgentStatus = (status: string) => (status === 'active' ? 'active' : 'draft');

  const loadCredentialIntoNode = (provider: string, nodeId?: string) => {
    const targetNode = nodes.find(n => n.id === nodeId || selectedNodeId);
    if (!targetNode) return;
    const updatedNodes = nodes.map(n =>
      n.id === targetNode.id
        ? {
            ...n,
            data: {
              ...n.data,
              config: {
                ...(n.data.config || {}),
                credentialProvider: provider,
              },
            },
          }
        : n
    );
    setNodes(updatedNodes);
  };

  const loadUserAgent = (agent: UserAgent) => {
    setSelectedAgentId(agent.id);
    setWorkflowName(agent.name || 'Untitled Agent Workflow');
    setAgentDescription(agent.description || '');
    setCurrentAgentStatus(normalizeAgentStatus(agent.status || 'draft'));
    setNodes(agent.config?.nodes || []);
    setEdges(agent.config?.edges || []);
    setActiveSection('builder');
    setLog(prev => [...prev, `Loaded agent "${agent.name}" into the builder.`]);
  };

  const exportDashboardReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      agents: userAgents,
      workflows,
      executionStatuses,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `agent-dashboard-report-${new Date().toISOString()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setLog(prev => [...prev, 'Exported dashboard report successfully']);
  };

  const clearExecutions = () => {
    setExecutionStatuses({});
    setLog(prev => [...prev, 'Cleared execution history']);
  };

  const createNewAgentWorkflow = () => {
    selectNode(undefined);
    setSelectedAgentId(null);
    setCurrentAgentStatus('draft');
    setWorkflowName('Untitled Agent Workflow');
    setAgentDescription('');
    setNodes([]);
    setEdges([]);
    setActiveSection('builder');
    setLog(prev => [...prev, 'Started a new agent workflow']);
    localStorage.removeItem('agent-builder-workflow');
  };

  const publishAgent = async () => {
    if (!selectedAgentId) {
      setLog(prev => [...prev, 'Save draft first before publishing']);
      return;
    }
    const { error } = await supabase
      .from('user_agents')
      .update({
        status: 'active',
        name: workflowName,
        description: agentDescription,
        config: { nodes, edges },
      })
      .eq('id', selectedAgentId);

    if (error) {
      setLog(prev => [...prev, `Failed to publish agent: ${error.message}`]);
      return;
    }

    setCurrentAgentStatus('active');
    setLog(prev => [...prev, `Agent published: ${workflowName}`]);

    await loadUserAgents();
  };

  const deleteAgent = async (agentId: string) => {
    const confirmed = window.confirm('Delete this agent permanently?');
    if (!confirmed) return;

    const { error } = await supabase.from('user_agents').delete().eq('id', agentId);
    if (error) {
      setLog(prev => [...prev, `Delete failed: ${error.message}`]);
      return;
    }

    if (selectedAgentId === agentId) {
      setSelectedAgentId(null);
      setWorkflowName('Untitled Agent Workflow');
      setNodes([]);
      setEdges([]);
      setCurrentAgentStatus('draft');
    }

    await loadUserAgents();
    setLog(prev => [...prev, 'Agent deleted successfully']);
  };

  const setAgentStatus = async (agentId: string, status: string) => {
    const { error } = await supabase.from('user_agents').update({ status }).eq('id', agentId);
    if (error) {
      setLog(prev => [...prev, `Failed to set status: ${error.message}`]);
      return;
    }
    await loadUserAgents();
    if (selectedAgentId === agentId) {
      setCurrentAgentStatus(status);
    }
  };

  // Load saved workflows for Scheduler/Webhooks and user agents for dashboard
  useEffect(() => {
    const loadWorkflows = async () => {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setWorkflows(data as AgentWorkflow[]);
      }
    };

    loadWorkflows();
    loadUserAgents();
    loadCredentials();
  }, [currentUser]);

  const nodeTypeCategory = (nodeType: string) => {
    const info = availableNodeTypes.find(item => item.id === nodeType);
    return info?.category || 'Unknown';
  };

  const normalizeConfigKey = (label: string) =>
    label
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .map((part, index) =>
        index === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join('');

  const isConfiguredValue = (value: any) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  };

  const getNodeTypeMetadata = (type?: string) =>
    type ? availableNodeTypes.find(item => item.id === type) : undefined;

  const isNodeConfigured = (node: Node<any>) => {
    const config = node.data?.config || {};
    const metadata = getNodeTypeMetadata(node.type);
    if (metadata?.configs?.length) {
      return metadata.configs.every(field => {
        if (field.required === false) return true;
        const key = normalizeConfigKey(field.l);
        return isConfiguredValue(config[key]);
      });
    }

    switch (node.type) {
      case 'ai-gemini':
        return !!(config.action && config.model && (config.credentialProvider || config.apiKey));
      case 'trigger-webhook':
        return !!(config.method && config.url);
      case 'trigger-email':
        return !!(config.mailbox && config.provider);
      case 'core-http-request':
        return !!(config.url && config.method);
      case 'action-telegram':
        return !!(config.botToken && config.chatId && config.message);
      case 'action-whatsapp':
        return !!(
          config.accountSid &&
          config.authToken &&
          config.from &&
          config.to &&
          config.message
        );
      case 'action-linkedin':
        return !!(config.accessToken && config.authorUrn && config.message);
      case 'action-youtube':
        return !!(config.accessToken && config.videoId && config.message);
      case 'action-facebook':
        return !!(config.pageId && config.accessToken && config.message);
      case 'calendar-google':
        return !!(config.calendarId && config.eventSummary && config.startISO && config.endISO);
      case 'data-google-sheets':
        switch (config.action) {
          case 'createSpreadsheet':
            return !!config.title;
          case 'listSpreadsheets':
            return true;
          case 'getMetadata':
          case 'createSheet':
          case 'deleteSheet':
          case 'batchUpdate':
          case 'formatCells':
          case 'bulkDeleteRows':
          case 'find':
          case 'clear':
          case 'append':
          case 'update':
          case 'delete':
          case 'upsert':
          case 'read':
            return !!config.spreadsheetId;
          default:
            return !!config.spreadsheetId;
        }
      default:
        return !!Object.keys(config).length;
    }
  };

  const formatGoogleSheetsActionLabel = (action?: string) => {
    switch (action) {
      case 'read':
        return 'Read Data';
      case 'append':
        return 'Append Rows';
      case 'update':
        return 'Update Range';
      case 'delete':
        return 'Delete Rows';
      case 'clear':
        return 'Clear Range';
      case 'find':
        return 'Find Rows';
      case 'upsert':
        return 'Upsert Row';
      case 'createSpreadsheet':
        return 'Create Spreadsheet';
      case 'createSheet':
        return 'Create Sheet';
      case 'deleteSheet':
        return 'Delete Sheet';
      case 'getMetadata':
        return 'Get Metadata';
      case 'listSpreadsheets':
        return 'List Spreadsheets';
      case 'batchUpdate':
        return 'Batch Update';
      case 'formatCells':
        return 'Format Cells';
      case 'bulkDeleteRows':
        return 'Bulk Delete Rows';
      default:
        return 'Google Sheets';
    }
  };

  const formatGeminiActionLabel = (action?: string) => {
    switch (action) {
      case 'generateText':
        return 'Generate Text';
      case 'sendChatMessage':
        return 'Chat Message';
      case 'analyzeImage':
        return 'Analyze Image';
      case 'generateJson':
        return 'Generate JSON';
      case 'countTokens':
        return 'Count Tokens';
      case 'createEmbedding':
        return 'Create Embedding';
      case 'summarizeContent':
        return 'Summarize Content';
      case 'classifyText':
        return 'Classify Text';
      case 'extractStructuredData':
        return 'Extract Data';
      case 'translateText':
        return 'Translate Text';
      case 'textToSpeech':
        return 'Text to Speech';
      case 'generateImage':
        return 'Generate Image';
      case 'generateVideo':
        return 'Generate Video';
      case 'analyzeVideo':
        return 'Analyze Video';
      case 'analyzeAudio':
        return 'Analyze Audio';
      case 'codeGeneration':
        return 'Code Generation';
      case 'codeExecution':
        return 'Code Execution';
      case 'functionCalling':
        return 'Function Calling';
      case 'groundingWithGoogleSearch':
        return 'Grounded Search';
      default:
        return 'Google Gemini';
    }
  };

  const getGeminiActionLevel = (action?: string) => {
    const beginnerActions = ['generateText', 'sendChatMessage'];
    const intermediateActions = [
      'analyzeImage',
      'generateJson',
      'countTokens',
      'createEmbedding',
      'summarizeContent',
      'classifyText',
      'extractStructuredData',
      'translateText',
    ];
    const advancedActions = [
      'textToSpeech',
      'generateImage',
      'generateVideo',
      'analyzeVideo',
      'analyzeAudio',
      'codeGeneration',
      'codeExecution',
      'functionCalling',
      'groundingWithGoogleSearch',
    ];

    if (beginnerActions.includes(action || '')) return 'Beginner';
    if (intermediateActions.includes(action || '')) return 'Intermediate';
    if (advancedActions.includes(action || '')) return 'Advanced';
    return 'Beginner';
  };

  const updateNodeConfig = (nodeId: string, configUpdates: Record<string, any>) => {
    const updatedNodes = nodes.map(n => {
      if (n.id !== nodeId) return n;

      const newConfig = { ...n.data.config, ...configUpdates };
      let updatedLabel = n.data.label;

      if (n.type === 'data-google-sheets' && configUpdates.action) {
        updatedLabel = `Google Sheets — ${formatGoogleSheetsActionLabel(configUpdates.action)}`;
      } else if (n.type === 'ai-gemini' && configUpdates.action) {
        updatedLabel = `Gemini — ${formatGeminiActionLabel(configUpdates.action)}`;
      }

      const updatedData: AgentNodeData = {
        ...n.data,
        label: updatedLabel,
        config: {
          ...newConfig,
          isConfigured: isNodeConfigured({
            ...n,
            data: { ...n.data, config: newConfig },
          }),
        },
      };

      if (n.type === 'ai-gemini' && configUpdates.action) {
        updatedData.level = getGeminiActionLevel(configUpdates.action);
      }

      return {
        ...n,
        data: updatedData,
      };
    });

    setNodes(updatedNodes);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || oauthRedirectHandledRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const oauthService = params.get('oauth_service');
    const oauthNodeId = params.get('oauth_node');

    if (!oauthService) return;

    const restoreServiceToken = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session as any;
        const token = session?.provider_token;

        if (token) {
          const storedToken = {
            access_token: token,
            timestamp: Date.now(),
          };
          window.localStorage.setItem(`serviceToken:${oauthService}`, JSON.stringify(storedToken));

          if (oauthNodeId) {
            const targetNode = nodes.find(n => n.id === oauthNodeId);
            if (targetNode) {
              const serviceTokens = {
                ...(targetNode.data.config?.serviceTokens || {}),
                [oauthService]: storedToken,
              };
              updateNodeConfig(oauthNodeId, { serviceTokens });
            }
          }

          setLog(prev => [...prev, `Connected ${oauthService} account successfully.`]);
        }
      } catch (error) {
        console.error('Failed to restore OAuth service token', error);
      } finally {
        oauthRedirectHandledRef.current = true;
        params.delete('oauth_service');
        params.delete('oauth_node');
        const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    };

    restoreServiceToken();
  }, [nodes, setLog, updateNodeConfig]);

  const startVisualExecutionStepper = (execOrder: string[], executionId: string) => {
    let currentIndex = 0;

    const stepThroughExecution = () => {
      if (currentIndex >= execOrder.length) {
        // All nodes have been visually stepped through
        setCurrentExecutingNodeId(null);
        return;
      }

      const nodeId = execOrder[currentIndex];
      const node = nodes.find(n => n.id === nodeId);

      if (node) {
        // Set current node as executing
        setCurrentExecutingNodeId(nodeId);

        // Update node state to executing
        setNodes(
          nodes.map(n =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, executionState: 'executing' as const } }
              : n
          )
        );

        setLog(prev => [...prev, `Executing node: ${node.data?.label || nodeId}`]);

        // Simulate execution time (adjust based on node type)
        const executionTime = getNodeExecutionTime(node.type || '');

        setTimeout(() => {
          // Mark node as completed
          setNodes(
            nodes.map(n =>
              n.id === nodeId
                ? { ...n, data: { ...n.data, executionState: 'completed' as const } }
                : n
            )
          );

          setLog(prev => [...prev, `Node completed: ${node.data?.label || nodeId}`]);
          currentIndex++;
          stepThroughExecution(); // Continue to next node
        }, executionTime);
      } else {
        currentIndex++;
        stepThroughExecution();
      }
    };

    // Start the visual stepping
    stepThroughExecution();
  };

  const getNodeExecutionTime = (nodeType: string): number => {
    // Simulate different execution times based on node type
    const baseTime = 800; // Base execution time in ms

    switch (nodeType) {
      case 'aiNode':
        return baseTime * 2; // AI nodes take longer
      case 'toolNode':
        return baseTime * 1.5; // Tool nodes moderate time
      case 'logicNode':
        return baseTime * 0.5; // Logic nodes faster
      case 'memoryNode':
        return baseTime * 0.7; // Memory operations moderate
      case 'orchestrationNode':
        return baseTime * 1.2; // Orchestration moderate
      case 'humanNode':
        return baseTime * 3; // Human interaction longest
      default:
        return baseTime;
    }
  };

  const fetchExecutionStatus = async (executionIdToPoll: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error('Unable to poll execution: user is not authenticated');
      }

      const { data: execution, error } = await supabase
        .from('agent_executions')
        .select('*')
        .eq('id', executionIdToPoll)
        .single();

      if (error) {
        throw error;
      }

      if (!execution) {
        throw new Error('Execution not found');
      }

      setExecutionStatus(execution.status);
      setExecutionResult(execution.output_data || execution.result || null);
      setExecutionError(execution.error_message || null);
      setLog(prev => [...prev, `Execution ${executionIdToPoll} status: ${execution.status}`]);

      if (execution.status === 'completed' || execution.status === 'failed') {
        setPollingExecution(false);
        setCurrentExecutingNodeId(null);
        // Reset all node execution states
        setNodes(
          nodes.map(node => ({
            ...node,
            data: { ...node.data, executionState: null },
          }))
        );
      }
    } catch (error) {
      setLog(prev => [
        ...prev,
        `Execution poll error: ${error instanceof Error ? error.message : error}`,
      ]);
    }
  };

  useEffect(() => {
    if (!executionId || !pollingExecution) return;

    const intervalId = window.setInterval(() => {
      fetchExecutionStatus(executionId);
    }, 2000);

    fetchExecutionStatus(executionId);

    return () => window.clearInterval(intervalId);
  }, [executionId, pollingExecution]);

  const computeExecOrder = (): string[] => {
    // Simple topological sort using Kahn's algorithm
    const inDegree: { [key: string]: number } = {};
    const graph: { [key: string]: string[] } = {};
    const queue: string[] = [];
    const result: string[] = [];

    // Initialize graph and in-degree
    nodes.forEach(node => {
      inDegree[node.id] = 0;
      graph[node.id] = [];
    });

    // Build graph and calculate in-degrees
    edges.forEach(edge => {
      if (graph[edge.source]) {
        graph[edge.source].push(edge.target);
        inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
      }
    });

    // Find nodes with no incoming edges
    nodes.forEach(node => {
      if (inDegree[node.id] === 0) {
        queue.push(node.id);
      }
    });

    // Process queue
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      graph[current].forEach(neighbor => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }

    // If there are cycles, return all nodes in some order
    if (result.length !== nodes.length) {
      // Add remaining nodes (cycle detected)
      nodes.forEach(node => {
        if (!result.includes(node.id)) {
          result.push(node.id);
        }
      });
    }

    return result;
  };

  const sanitizeWorkflowForExecution = (nodes: Node[], edges: Edge[]) => {
    const sanitizedNodes = nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      config: node.data?.config ?? {},
    }));

    const sanitizedEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default',
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      data: edge.data,
    }));

    return { sanitizedNodes, sanitizedEdges };
  };

  const executeWorkflow = async () => {
    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);
    setExecutionStatus('queued');
    setCurrentExecutingNodeId(null);
    setLog(prev => [...prev, 'Starting workflow execution...']);

    try {
      // Calculate execution order for visual feedback
      const execOrder = computeExecOrder();

      // Reset all node execution states
      const nodesWithResetState = nodes.map(node => ({
        ...node,
        data: { ...node.data, executionState: null },
      }));
      setNodes(nodesWithResetState);

      const validationErrors = validateWorkflowGraph(nodes, edges);
      if (validationErrors.length > 0) {
        const message = `Invalid workflow graph: ${validationErrors.join('; ')}`;
        setExecutionError(message);
        setLog(prev => [...prev, message]);
        return;
      }

      const { sanitizedNodes, sanitizedEdges } = sanitizeWorkflowForExecution(nodes, edges);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error('Unable to run workflow: user is not authenticated');
      }

      const proposedExecutionId = crypto.randomUUID();
      const socket = getSharedSocket();
      socket.emit('subscribe:execution', proposedExecutionId);

      const payload = {
        agentId: undefined, // Always create new agent for execution to avoid ID conflicts
        agentName: workflowName || 'Unnamed Agent',
        nodes: sanitizedNodes,
        edges: sanitizedEdges,
        input: {},
        apiKeys,
        executionId: proposedExecutionId,
      };

      const response = await fetch(`${backendUrl}/api/agent-run`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await parseResponseBody(response);
      if (!response.ok) {
        socket.emit('unsubscribe:execution', proposedExecutionId);

        if (
          responseBody &&
          typeof responseBody === 'object' &&
          Array.isArray((responseBody as any).details?.errors)
        ) {
          const validationErrors = (responseBody as any).details.errors.filter(
            (item: unknown) => typeof item === 'string'
          ) as string[];
          if (validationErrors.length > 0) {
            const message = `Workflow validation failed: ${validationErrors.join('; ')}`;
            setExecutionError(message);
            setLog(prev => [...prev, message]);
            applyValidationErrorsToNodes(validationErrors);
            return;
          }
        }

        const serverError =
          responseBody && typeof responseBody === 'object'
            ? (responseBody.error as string) ||
              (responseBody.message as string) ||
              JSON.stringify(responseBody)
            : String(responseBody || `${response.statusText}`);
        const message = `Agent execution request failed (${response.status} ${response.statusText}) - ${serverError}`;
        throw new Error(message);
      }

      const data = responseBody as { executionId?: string; reused?: boolean };
      const actualExecutionId = data?.executionId;
      if (!actualExecutionId) {
        socket.emit('unsubscribe:execution', proposedExecutionId);
        throw new Error(
          `Agent execution succeeded but no executionId returned. Response body: ${JSON.stringify(data)}`
        );
      }

      if (actualExecutionId !== proposedExecutionId) {
        socket.emit('unsubscribe:execution', proposedExecutionId);
        socket.emit('subscribe:execution', actualExecutionId);
      }

      setExecutionId(actualExecutionId);
      setExecutionStatus('queued');
      setCurrentExecutionId(actualExecutionId); // Set for socket updates
      setPollingExecution(false); // Disable polling since we use sockets
      setLog(prev => [...prev, `Agent execution queued successfully: ${actualExecutionId}`]);
      if (data.reused) {
        setLog(prev => [...prev, 'Existing execution reused due to idempotency.']);
      }

      // Real-time updates will come from socket
    } catch (error) {
      const message = formatErrorMessage(error);
      setExecutionError(message);
      setLog(prev => [...prev, `Execution error: ${message}`]);
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      const checkAdmin = async () => {
        try {
          console.log('Checking admin status for user:', user?.id);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          console.log('Admin check result:', { profile, error, role: profile?.role });

          if (!error && profile?.role === 'admin') {
            console.log('User is admin, setting isAdmin to true');
            setIsAdmin(true);
          } else {
            console.log('User is not admin or error occurred');
          }
        } catch (error) {
          console.error('Failed to verify admin role', error);
        }
      };

      checkAdmin();
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Check if we should load a template from the templates page first
    const templateData = localStorage.getItem('load-template-data');
    const newWorkflowData = localStorage.getItem('new-workflow');

    if (templateData) {
      localStorage.removeItem('load-template-data'); // Clear it after loading
      setIsLoadingTemplate(true);
      // Small delay to show loading state
      setTimeout(() => {
        try {
          const template = JSON.parse(templateData);
          setNodes(template.nodes || []);
          setEdges(template.edges || []);
          setWorkflowName(template.name || 'Loaded Template');
          setSelectedAgentId(null);
          setCurrentAgentStatus('draft');
          setLog(prev => [...prev, `Template "${template.name}" loaded successfully`]);
          // Clear any existing saved workflow
          localStorage.removeItem('agent-builder-workflow');
        } catch (error) {
          console.error('Error loading template:', error);
          setLog(prev => [...prev, 'Error loading template: Invalid template data']);
        }
        setIsLoadingTemplate(false);
      }, 100);
    } else if (newWorkflowData) {
      localStorage.removeItem('new-workflow'); // Clear it after loading
      setIsLoadingTemplate(true);
      // Small delay to show loading state
      setTimeout(() => {
        try {
          const parsed = JSON.parse(newWorkflowData);
          setNodes(parsed.nodes || []);
          setEdges(parsed.edges || []);
          setWorkflowName(parsed.name || 'New Workflow');
          setSelectedAgentId(null);
          setCurrentAgentStatus('draft');
          setLog(prev => [
            ...prev,
            `New workflow "${parsed.name || 'Untitled'}" created successfully`,
          ]);
          // Clear any existing saved workflow
          localStorage.removeItem('agent-builder-workflow');
        } catch (e) {
          console.error('Invalid new workflow data', e);
          setLog(prev => [...prev, 'Failed to create new workflow']);
        }
        setIsLoadingTemplate(false);
      }, 100);
    } else {
      // No template to load, check for saved workflow
      const stored = localStorage.getItem('agent-builder-workflow');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setNodes(parsed.nodes || []);
          setEdges(parsed.edges || []);
          if (parsed.name) setWorkflowName(parsed.name);
          if (parsed.description) setAgentDescription(parsed.description);
          if (parsed.selectedAgentId) {
            setSelectedAgentId(parsed.selectedAgentId);
          }
          if (parsed.currentAgentStatus) {
            setCurrentAgentStatus(parsed.currentAgentStatus);
          }
        } catch (e) {
          console.error('Invalid saved workflow', e);
        }
      } else {
        // No saved workflow either, load default template
        const defaultTemplate = agentBuilderTemplates.find(
          t => t.id === 'social-content-generator'
        );
        if (defaultTemplate) {
          setNodes(defaultTemplate.nodes);
          setEdges(defaultTemplate.edges);
          setWorkflowName(defaultTemplate.name);
          setLog(prev => [...prev, `Default template "${defaultTemplate.name}" loaded`]);
        }
      }
    }

    const storedKeys = localStorage.getItem('agent-builder-api-keys');
    if (storedKeys) {
      try {
        const parsed = JSON.parse(storedKeys);
        setApiKeys({
          openai: parsed.openai || '',
          gemini: parsed.gemini || '',
          deepseek: parsed.deepseek || '',
          gmail: parsed.gmail || '',
        });
      } catch (e) {
        console.error('Invalid API keys', e);
      }
    }
  }, []);

  const onNodesChange = (changes: NodeChange[]) => {
    setNodes(applyNodeChanges(changes, nodes));
  };

  // Advanced: support edge removal via right-click
  const onEdgesChange = (changes: any[]) => {
    setEdges(applyEdgeChanges(changes, edges));
  };

  // Advanced: allow users to disconnect edges by right-clicking
  const onEdgeContextMenu = (event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    if (window.confirm('Remove this connection?')) {
      setEdges(edges.filter(e => e.id !== edge.id));
    }
  };

  // Advanced: highlight compatible ports on connect
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  // React Flow's OnConnectStartParams: { nodeId: string | null; handleId: string | null; handleType: 'source' | 'target' | null }
  const onConnectStart = (_event: any, params: { nodeId: string | null }) => {
    setConnectingNodeId(params.nodeId ?? null);
  };
  const onConnectEnd = () => {
    setConnectingNodeId(null);
  };

  const getEdgeDataType = (connection: Connection) => {
    const handleId = connection.sourceHandle || connection.targetHandle || '';
    return handleId.toString().toLowerCase().includes('tool') ? 'tool' : 'flow';
  };

  const onConnect: OnConnect = (connection: Connection) => {
    const connectionType = getEdgeDataType(connection);
    setEdges(
      addEdge(
        {
          ...(connection as any),
          data: {
            ...((connection as any).data ?? {}),
            type: connectionType,
          },
          style:
            connectionType === 'tool'
              ? {
                  stroke: '#0ea5e9',
                  strokeDasharray: '6 6',
                }
              : undefined,
        } as any,
        edges
      )
    );
  };

  const onNodeClick = (_event: any, node: Node) => {
    selectNode(node.id);
  };

  const onPaneClick = () => {
    selectNode(undefined);
  };

  const onPaneContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      type: 'canvas',
      x: event.clientX,
      y: event.clientY,
    });
  };

  const onNodeContextMenu = (event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      type: 'node',
      id: node.id,
      x: event.clientX,
      y: event.clientY,
      data: node.data,
    });
  };

  // Group collapse/expand state
  const [collapsedGroups, setCollapsedGroups] = useState<{ [id: string]: boolean }>({});

  const addNode = (type: string) => {
    const nodeType = availableNodeTypes.find(t => t.id === type);
    if (!nodeType) return;

    // If adding a group node, set as extent: 'parent'
    if (type === 'group') {
      const groupId = `group-${Date.now()}`;
      const newGroup: Node = {
        id: groupId,
        type: 'group',
        position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
        data: {
          label: 'Group',
          description: 'Drag nodes here to group',
          collapsed: false,
          onToggleCollapse: (id: string) => {
            setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
            const updatedNodes = nodes.map((n: Node<AgentNodeData>) =>
              n.id === id ? { ...n, data: { ...n.data, collapsed: !collapsedGroups[id] } } : n
            );
            setNodes(updatedNodes);
          },
        },
        style: { zIndex: 1 },
        draggable: true,
        selectable: true,
        extent: 'parent',
      };
      setNodes([...nodes, newGroup]);
      return;
    }
    const newNode: Node<AgentNodeData> = {
      id: `${nodes.length + 1}`,
      type: nodeType.id,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        label: nodeType.label,
        config: {},
        icon: nodeType.icon,
      },
    };
    setNodes([...nodes, newNode]);
  };

  const loadTemplate = (templateId: string) => {
    const template = agentBuilderTemplates.find(t => t.id === templateId);
    if (template) {
      setNodes(template.nodes);
      setEdges(template.edges);
      setWorkflowName(template.name);
      setSelectedAgentId(null);
      setAgentDescription('');
      setCurrentAgentStatus('draft');
      setLog(prev => [...prev, `Template "${template.name}" loaded successfully`]);
    } else {
      setLog(prev => [...prev, `Template "${templateId}" not found`]);
    }
  };

  const renderCredentialSelect = (node: Node<any>, title: string) => {
    const nodeType = node.type || '';
    const saved = credentials.filter(
      cred =>
        cred.provider === nodeType.replace('ai-', '') ||
        cred.provider === nodeType.replace('comm-', '').replace('-oauth2', '').replace('-bot', '')
    );
    return (
      <div>
        <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">{title}</Label>
        <Select
          value={node.data.config?.credentialProvider || ''}
          onValueChange={value => updateNodeConfig(node.id, { credentialProvider: value })}
        >
          <SelectTrigger className="mt-1 w-full">
            <SelectValue placeholder="Choose saved credential" />
          </SelectTrigger>
          <SelectContent>
            {saved.map(cred => (
              <SelectItem key={cred.id} value={cred.provider}>
                {cred.label || cred.provider}
              </SelectItem>
            ))}
            <SelectItem value="">Manual / None</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };

  const saveAgentAsDraft = async () => {
    if (!currentUser?.id) {
      setLog(prev => [...prev, 'Cannot save: not signed in']);
      return;
    }

    // Ensure user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', currentUser.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 is "not found"
      setLog(prev => [...prev, `Failed to check profile: ${profileError.message}`]);
      return;
    }

    if (!profile) {
      // Create profile if it doesn't exist
      const { error: createError } = await supabase.from('profiles').insert({
        id: currentUser.id,
        email: currentUser.email,
        full_name: currentUser.user_metadata?.full_name || '',
        avatar_url: currentUser.user_metadata?.avatar_url || '',
      });

      if (createError) {
        setLog(prev => [...prev, `Failed to create profile: ${createError.message}`]);
        return;
      }
    }

    const agentStatus = selectedAgentId && currentAgentStatus === 'active' ? 'active' : 'draft';
    const agentPayload = {
      user_id: currentUser.id,
      name: workflowName || 'Untitled Agent',
      description: agentDescription,
      config: { nodes, edges },
      status: agentStatus,
      version: '1.0.0',
    };

    if (selectedAgentId) {
      const { error } = await supabase
        .from('user_agents')
        .update(agentPayload)
        .eq('id', selectedAgentId);

      if (error) {
        setLog(prev => [...prev, `Failed to update agent: ${error.message}`]);
        return;
      }
      localStorage.setItem(
        'agent-builder-workflow',
        JSON.stringify({
          nodes,
          edges,
          name: workflowName,
          description: agentDescription,
          selectedAgentId,
          currentAgentStatus: agentStatus,
        })
      );
      setLog(prev => [...prev, `Agent updated: ${workflowName}`]);
    } else {
      const { data, error } = await supabase
        .from('user_agents')
        .insert(agentPayload)
        .select('id')
        .single();
      if (error || !data) {
        setLog(prev => [...prev, `Failed to save draft: ${error?.message || 'unknown'}`]);
        return;
      }
      setSelectedAgentId(data.id);
      localStorage.setItem(
        'agent-builder-workflow',
        JSON.stringify({
          nodes,
          edges,
          name: workflowName,
          description: agentDescription,
          selectedAgentId: data.id,
          currentAgentStatus: agentStatus,
        })
      );
      setLog(prev => [...prev, `Draft saved: ${workflowName}`]);
    }

    setCurrentAgentStatus(agentStatus);
    await loadUserAgents();
  };

  const openSaveAsTemplateDialog = () => {
    if (!isAdmin) {
      setLog(prev => [...prev, 'Save as template is available only to admin users.']);
      return;
    }

    setTemplateForm(prev => ({
      ...prev,
      name: workflowName || prev.name || 'Untitled Agent Workflow',
      description: agentDescription || prev.description,
    }));
    setShowTemplateDialog(true);
  };

  const saveCurrentWorkflowAsTemplate = async () => {
    if (!isAdmin || !user) {
      setLog(prev => [...prev, 'Unable to save template: admin access required.']);
      return;
    }

    if (!workflowName?.trim()) {
      setLog(prev => [...prev, 'Please give your workflow a name before saving as a template.']);
      return;
    }

    if (!nodes || nodes.length === 0) {
      setLog(prev => [
        ...prev,
        'Cannot save empty workflow as template. Please add some nodes first.',
      ]);
      return;
    }

    setSavingTemplate(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error('Authentication required');
      }

      const templatePayload = {
        name: templateForm.name.trim() || workflowName.trim(),
        description:
          templateForm.description.trim() ||
          agentDescription.trim() ||
          'An admin-created agentic workflow template.',
        category: templateForm.category || 'Agentic Workflow',
        config: {
          nodes,
          edges,
        },
        ui_schema: null,
        is_public: templateForm.is_public,
        version: templateForm.version,
      };

      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(templatePayload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error', status: response.status }));
        const errorMessage =
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Template save failed:', errorMessage);
        console.error('Template save error details:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          token: token ? 'present' : 'missing',
          userId: user?.id,
        });
        if (errorData.details) {
          console.error('Validation details:', errorData.details);
        }
        throw new Error(errorMessage);
      }

      setLog(prev => [...prev, `Template saved successfully: ${templatePayload.name}`]);
      setShowTemplateDialog(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLog(prev => [...prev, `Failed to save template: ${message}`]);
      console.error('Template save error details:', {
        error: error,
        message: message,
        userId: user?.id,
        isAdmin: isAdmin,
        workflowName: workflowName,
        templateForm: templateForm,
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const executeWorkflowHandler = async () => {
    // TODO: implement workflow execution
    setLog(prev => [...prev, 'Workflow execution started']);
  };

  const createNewAgentWorkflowHandler = () => {
    // TODO: implement creating new workflow
    reset();
    setWorkflowName('Untitled Agent Workflow');
    setLog(prev => [...prev, 'New workflow created']);
  };
  const publishAgentHandler = async () => {
    // TODO: implement publishing agent
    setLog(prev => [...prev, 'Agent published']);
  };
  const resetHandler = () => {
    // TODO: implement reset
    setNodes([]);
    setEdges([]);
    setLog(prev => [...prev, 'Workflow reset']);
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-100 via-cyan-100 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <AgentBuilderSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection as (value: string) => void}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activeSection === 'builder' && (
          <>
            <ExecutionControls
              workflowName={workflowName}
              setWorkflowName={setWorkflowName}
              currentAgentStatus={currentAgentStatus}
              executionStatus={executionStatus}
              currentExecutionId={currentExecutionId}
              executionError={executionError}
              showNodePalette={showNodePalette}
              setShowNodePalette={setShowNodePalette}
              saveAgentAsDraft={saveAgentAsDraft}
              executeWorkflow={executeWorkflow}
              createNewAgentWorkflow={createNewAgentWorkflow}
              publishAgent={publishAgent}
              openSaveAsTemplateDialog={openSaveAsTemplateDialog}
              isAdmin={isAdmin}
              reset={reset}
              isExecuting={isExecuting}
            />

            <Dialog open={!!approvalRequest} onOpenChange={() => {}}>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Human approval required</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Execution ID: <span className="font-mono">{approvalRequest?.executionId}</span>
                  </p>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-base font-medium text-slate-900 dark:text-slate-100">
                      {approvalRequest?.question}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {approvalRequest?.options?.map(option => (
                      <Button
                        key={option}
                        variant="outline"
                        onClick={() => submitApproval(approvalRequest.executionId, option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Save Workflow as Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={templateForm.name}
                      onChange={e => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Agentic workflow template name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                      id="template-description"
                      value={templateForm.description}
                      onChange={e =>
                        setTemplateForm(prev => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Brief description of the workflow template"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-category">Category</Label>
                      <Select
                        value={templateForm.category}
                        onValueChange={value =>
                          setTemplateForm(prev => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {templateCategories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Checkbox
                        id="template-public"
                        checked={templateForm.is_public}
                        onCheckedChange={checked =>
                          setTemplateForm(prev => ({ ...prev, is_public: checked as boolean }))
                        }
                      />
                      <Label htmlFor="template-public">Public template</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveCurrentWorkflowAsTemplate} disabled={savingTemplate}>
                    {savingTemplate ? 'Saving...' : 'Save Template'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AgentBuilderCanvas
              activeSection={activeSection}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onConnectStart={onConnectStart}
              onConnectEnd={onConnectEnd}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onPaneClick={onPaneClick}
              onPaneContextMenu={onPaneContextMenu}
              onNodeContextMenu={onNodeContextMenu}
              onEdgeContextMenu={onEdgeContextMenu}
              filteredEdgeIds={filteredEdgeIds}
              workflows={workflows}
              setNodes={setNodes}
              setEdges={setEdges}
              setWorkflowName={setWorkflowName}
              setActiveSection={setActiveSection as (section: string) => void}
              setLog={setLog}
            />

            <NodeManagement
              activeSection={activeSection}
              showNodePalette={showNodePalette}
              setShowNodePalette={setShowNodePalette}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              nodePalettePosition={nodePalettePosition}
              settingsPosition={settingsPosition}
              nodeConfigPosition={nodeConfigPosition}
              draggingPane={draggingPane}
              setDraggingPane={setDraggingPane}
              dragOffset={dragOffset}
              setDragOffset={setDragOffset}
              selectedNode={selectedNode}
              selectedNodeId={selectedNodeId ?? null}
              nodes={nodes}
              edges={edges}
              credentials={credentials}
              credentialForm={credentialForm}
              setCredentialForm={setCredentialForm}
              loadCredentials={loadCredentials}
              loadCredentialIntoNode={loadCredentialIntoNode}
              updateNodeConfig={updateNodeConfig}
              apiKeys={apiKeys}
              setApiKeys={setApiKeys}
              saveApiKeys={saveApiKeys}
              renderIcon={renderIcon}
              selectNode={selectNode}
              copyConfig={copyConfig}
              duplicateNode={duplicateNode}
              duplicateEdge={duplicateEdge}
              undo={undoHandler}
              redo={redoHandler}
              setContextMenu={setContextMenu}
              contextMenu={contextMenu}
              setNodes={setNodes}
              setEdges={setEdges}
              setActiveSection={setActiveSection as (section: string) => void}
              setLog={setLog}
              nodeTypeCategory={nodeTypeCategory}
              isNodeConfigured={isNodeConfigured}
            />

            <AgentBuilderLogPanel
              showLogPanel={showLogPanel}
              setShowLogPanel={setShowLogPanel}
              log={log}
            />
          </>
        )}

        {activeSection === 'dashboard' && (
          <AgentBuilderDashboard
            user={user}
            workflows={workflows}
            userAgents={userAgents}
            executionStatuses={executionStatuses}
            draftUserAgents={draftUserAgents}
            activeUserAgents={activeUserAgents}
            loadUserAgent={loadUserAgent}
            createNewAgentWorkflow={createNewAgentWorkflow}
            exportDashboardReport={exportDashboardReport}
            clearExecutions={clearExecutions}
            setActiveSection={setActiveSection}
            exportAgentJson={exportAgentJson}
            deleteAgent={deleteAgent}
          />
        )}

        {activeSection === 'templates' && (
          <AgentBuilderTemplates
            filteredTemplates={filteredTemplates}
            templateSearchQuery={templateSearchQuery}
            setTemplateSearchQuery={setTemplateSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            loadTemplate={loadTemplate}
            setActiveSection={setActiveSection}
            renderIcon={renderIcon}
            setLog={setLog}
          />
        )}

        {activeSection === 'webhooks' && (
          <div className="flex-1 p-6">
            <WebhookManager workflows={workflows} />
          </div>
        )}

        {activeSection === 'vault' && (
          <AgentBuilderVault
            credentials={credentials}
            credentialForm={credentialForm}
            setCredentialForm={setCredentialForm}
            createCredential={createCredential}
          />
        )}

        {activeSection === 'settings' && (
          <AgentBuilderSettings
            apiKeys={apiKeys}
            setApiKeys={setApiKeys}
            saveApiKeys={saveApiKeys}
            showNodePalette={showNodePalette}
            setShowNodePalette={setShowNodePalette}
          />
        )}
      </div>
    </div>
  );
}

export { AgentBuilderContent };
