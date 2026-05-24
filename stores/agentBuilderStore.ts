import { create } from 'zustand';
import { Edge, Node } from 'reactflow';

type AgentNodeType =
  | 'ai-gemini'
  | 'ai-openai'
  | 'ai-anthropic'
  | 'ai-grok'
  | 'ai-deepseek'
  | 'trigger-webhook'
  | 'trigger-email'
  | 'core-http-request'
  | 'action-telegram'
  | 'action-whatsapp'
  | 'action-linkedin'
  | 'action-youtube'
  | 'action-facebook'
  | 'calendar-google'
  | 'data-google-sheets'
  | 'data-gmail'
  | 'trigger-gmail';

export interface AgentNodeData {
  label: string;
  description?: string;
  config?: Record<string, unknown>;
  executionState?: 'pending' | 'executing' | 'completed' | 'failed' | null;
  executionError?: string | null;
  icon?: any;
  level?: string;
}

export interface AgentBuilderState {
  nodes: Node<AgentNodeData>[];
  edges: Edge[];
  selectedNodeId?: string;
  setNodes: (nodes: Node<AgentNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  selectNode: (nodeId?: string) => void;
  reset: () => void;
}

const normalizeNode = <T>(node: Node<T>): Node<T> => ({
  ...node,
  position: node.position ?? { x: 0, y: 0 },
});

const normalizeNodes = <T>(nodes: Node<T>[]): Node<T>[] => nodes.map(node => normalizeNode(node));

const normalizeEdges = (edges: Edge[]): Edge[] =>
  edges.filter(edge => !!edge && !!edge.source && !!edge.target && !!edge.id);

export const useAgentBuilderStore = create<AgentBuilderState>(set => ({
  nodes: [],
  edges: [],
  selectedNodeId: undefined,
  setNodes: nodes => set({ nodes: normalizeNodes(nodes) }),
  setEdges: edges => set({ edges: normalizeEdges(edges) }),
  selectNode: selectedNodeId => set({ selectedNodeId }),
  reset: () => set({ nodes: [], edges: [], selectedNodeId: undefined }),
}));
