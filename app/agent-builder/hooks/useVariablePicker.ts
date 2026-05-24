'use client';

import { useMemo } from 'react';
import { Edge, Node } from 'reactflow';

export interface VariableOption {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  path: string;
  displayPath: string;
  description: string;
  preview?: string;
  category: 'output' | 'data' | 'meta';
}

const getPreviewValue = (executionResults: Record<string, any> | undefined, path: string) => {
  if (!executionResults) return '';

  const parts = path.split('.');
  let current: any = executionResults;
  for (const part of parts) {
    if (current === undefined || current === null) {
      return '';
    }
    current = current?.[part];
  }

  if (current === undefined || current === null) return '';

  const str = String(current);
  return str.length > 50 ? `${str.slice(0, 50)}...` : str;
};

const flattenObjectPaths = (obj: any, prefix = ''): string[] => {
  if (obj === null || obj === undefined) return [];
  if (typeof obj !== 'object') return [prefix];

  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenObjectPaths(value, path);
    }
    return [path];
  });
};

export function useVariablePicker(
  currentNodeId: string,
  nodes: Node[],
  edges: Edge[],
  executionResults?: Record<string, any>
) {
  const getPreviousNodes = (): Node[] => {
    const visited = new Set<string>();
    const previous: Node[] = [];

    const traverse = (nodeId: string) => {
      const incomingEdges = edges.filter(e => e.target === nodeId);
      for (const edge of incomingEdges) {
        if (!visited.has(edge.source)) {
          visited.add(edge.source);
          const node = nodes.find(n => n.id === edge.source);
          if (node) {
            traverse(edge.source);
            previous.push(node);
          }
        }
      }
    };

    if (currentNodeId) {
      traverse(currentNodeId);
    }

    return previous;
  };

  const getVariablesForNode = (node: Node): VariableOption[] => {
    const nodeId = node.id;
    const nodeType = node.data?.type || node.type || '';
    const nodeLabel = node.data?.label || nodeId;
    const vars: VariableOption[] = [];

    const addVariable = (
      path: string,
      displayPath: string,
      description: string,
      category: 'output' | 'data' | 'meta'
    ) => {
      const fullPath = `${nodeId}.${path}`;
      vars.push({
        nodeId,
        nodeLabel,
        nodeType,
        path: fullPath,
        displayPath: `${nodeId}.${displayPath}`,
        description,
        category,
        preview: getPreviewValue(executionResults, fullPath),
      });
    };

    addVariable('output.text', 'output.text', 'Main text output', 'output');
    addVariable('output.message', 'output.message', 'Status message', 'output');

    if (nodeType.startsWith('ai-')) {
      addVariable('output.text', 'output.text', 'AI generated response', 'output');
    }

    if (nodeType.includes('search')) {
      addVariable('output.text', 'output.text', 'Search results as text', 'output');
      addVariable(
        'output.data.resultCount',
        'output.data.resultCount',
        'Number of results found',
        'data'
      );
      addVariable('output.data.query', 'output.data.query', 'Search query used', 'data');
    }

    if (nodeType === 'trigger-manual') {
      addVariable('output.market', 'output.market', 'Market field', 'output');
      addVariable('output.topic', 'output.topic', 'Topic field', 'output');
      addVariable('output.timeScope', 'output.timeScope', 'Time scope field', 'output');
    }

    if (nodeType === 'core-set') {
      addVariable('output.data.market', 'output.data.market', 'Market variable', 'data');
      addVariable('output.data.topic', 'output.data.topic', 'Topic variable', 'data');
      addVariable('output.data.today', 'output.data.today', 'Today date', 'data');
    }

    if (nodeType === 'action-email') {
      addVariable('output.data.recipient', 'output.data.recipient', 'Email recipient', 'data');
    }

    if (nodeType.includes('http')) {
      addVariable('output.data.status', 'output.data.status', 'HTTP response status', 'data');
      addVariable('output.data.body', 'output.data.body', 'HTTP response body', 'data');
    }

    const nodeResult = executionResults?.[nodeId];
    const outputData = nodeResult?.output ?? nodeResult;
    if (outputData && typeof outputData === 'object') {
      const flattened = flattenObjectPaths(outputData, 'output');
      flattened.forEach(path => {
        addVariable(path, path, 'Resolved output field from execution result', 'data');
      });
    } else {
      addVariable(
        'output.data',
        'output.data',
        'Output data object; append .fieldName for a specific field',
        'data'
      );
    }

    const seen = new Set<string>();
    return vars.filter(v => {
      if (seen.has(v.path)) return false;
      seen.add(v.path);
      return true;
    });
  };

  const availableVariables: VariableOption[] = useMemo(() => {
    const previousNodes = getPreviousNodes();
    return previousNodes.flatMap(getVariablesForNode);
  }, [currentNodeId, nodes, edges, executionResults]);

  return { availableVariables, getPreviousNodes };
}
