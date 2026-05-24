'use client';

import React from 'react';
import ReactFlow, { Edge, Node, NodeChange, OnConnect } from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Zap } from 'lucide-react';
import { WebhookManager } from '@/components/webhook-manager';
import { AgentBuilderTemplates } from '@/lib/agentBuilderTemplates';
import { BrandGlowEdge } from './BrandGlowEdge';
import { nodeTypes } from '../constants/nodeTypes';

export type AgentBuilderCanvasProps = {
  activeSection: string;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: OnConnect;
  onConnectStart: (
    _event: any,
    params: {
      nodeId: string | null;
      handleId: string | null;
      handleType: 'source' | 'target' | null;
    }
  ) => void;
  onConnectEnd: () => void;
  onNodeClick: (_event: any, node: Node) => void;
  onNodeDoubleClick: (_event: any, node: Node) => void;
  onPaneClick: () => void;
  onPaneContextMenu: (event: React.MouseEvent) => void;
  onNodeContextMenu: (event: React.MouseEvent, node: Node) => void;
  onEdgeContextMenu: (event: React.MouseEvent, edge: Edge) => void;
  filteredEdgeIds: string[];
  workflows: any[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setWorkflowName: (name: string) => void;
  setActiveSection: (section: string) => void;
  setLog: (updater: (prev: string[]) => string[]) => void;
};

export function AgentBuilderCanvas({
  activeSection,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onConnectStart,
  onConnectEnd,
  onNodeClick,
  onNodeDoubleClick,
  onPaneClick,
  onPaneContextMenu,
  onNodeContextMenu,
  onEdgeContextMenu,
  filteredEdgeIds,
  workflows,
  setNodes,
  setEdges,
  setWorkflowName,
  setActiveSection,
  setLog,
}: AgentBuilderCanvasProps) {
  return (
    <div className="flex-1 relative">
      {activeSection === 'templates' ? (
        <div className="h-full overflow-y-auto bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-900 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Agent Templates
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Choose a template to get started with your agent workflow
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {AgentBuilderTemplates.map(template => (
                <div
                  key={template.id}
                  className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                  onClick={() => {
                    setNodes(template.nodes);
                    setEdges(template.edges);
                    setWorkflowName(template.name);
                    setActiveSection('builder');
                    setLog(prev => [...prev, `Template "${template.name}" loaded successfully`]);
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {template.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {template.nodes.length} nodes
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    {template.description || 'A pre-built agent template to help you get started.'}
                  </p>
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeSection === 'webhooks' ? (
        <div className="h-full overflow-y-auto bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-900 p-6">
          <WebhookManager workflows={workflows} />
        </div>
      ) : (
        <ReactFlow
          nodes={nodes.map(node => ({ ...node, className: 'node' }))}
          edges={edges.map(edge => ({
            ...edge,
            className: filteredEdgeIds.includes(edge.id)
              ? 'stroke-4 stroke-cyan-400 animate-pulse'
              : edge.className || '',
            style:
              edge.data?.type === 'tool'
                ? {
                    ...edge.style,
                    stroke: '#0ea5e9',
                    strokeDasharray: '6 6',
                    strokeWidth: edge.style?.strokeWidth || 2,
                  }
                : edge.style,
          }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onPaneClick={onPaneClick}
          fitView
          nodeTypes={nodeTypes}
          edgeTypes={{ 'brand-glow': BrandGlowEdge }}
          className="reactflow-builder-canvas bg-gradient-to-br from-cyan-50 via-slate-100 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950"
          panOnDrag
          zoomOnScroll
          minZoom={0.3}
          maxZoom={1.5}
          snapToGrid
          snapGrid={[24, 24]}
          selectionOnDrag
          multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
        >
          {/* Controls are provided by the parent wrapper if needed */}
        </ReactFlow>
      )}
    </div>
  );
}
