'use client';

import { useMemo, useState, useEffect } from 'react';
import { Edge, Node } from 'reactflow';
import { availableNodeTypes } from '../constants/nodeTypes';

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
  const resolvedExecutionResults =
    executionResults &&
    typeof executionResults === 'object' &&
    'nodeResults' in executionResults &&
    executionResults.nodeResults &&
    typeof executionResults.nodeResults === 'object'
      ? executionResults.nodeResults
      : executionResults;

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

  // state cache for fetched sample outputs from backend
  const [sampleCache, setSampleCache] = useState<Record<string, any>>({});

  useEffect(() => {
    // fetch sample outputs for previous nodes that lack execution results
    const prev = getPreviousNodes();
    prev.forEach(node => {
      const nodeId = node.id;
      if (resolvedExecutionResults?.[nodeId] !== undefined) return;
      if (sampleCache[nodeId]) return;

      const nodeTypeId = node.data?.type || node.type || '';
      const url = `http://localhost:3001/api/sample-outputs?nodeType=${encodeURIComponent(nodeTypeId)}`;
      fetch(url)
        .then(r => (r.ok ? r.json() : Promise.reject(new Error('fetch failed'))))
        .then(json => {
          if (json && json.sample) {
            setSampleCache(prevCache => ({ ...prevCache, [nodeId]: json.sample }));
          }
        })
        .catch(err => {
          // ignore fetch errors — fallback heuristics handle it
          // console.warn('sample fetch failed for', nodeTypeId, err.message);
        });
    });
    // intentionally depend on currentNodeId/nodes/edges/executionResults
  }, [currentNodeId, nodes, edges, executionResults]);

  const getVariablesForNode = (node: Node): VariableOption[] => {
    const nodeId = node.id;
    const nodeType = node.data?.type || node.type || '';
    const nodeLabel = node.data?.label || nodeId;
    const vars: VariableOption[] = [];

    let synthesizedExample = false;

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
        description: synthesizedExample ? 'Expected output (schema)' : description,
        category,
        preview: synthesizedExample ? '' : getPreviewValue(resolvedExecutionResults, fullPath),
      });
    };

    let nodeResult = resolvedExecutionResults?.[nodeId] ?? sampleCache[nodeId];

    // If there's no runtime result, synthesize an "expected output" example
    // based on node type metadata so users can insert variables before running.
    if (nodeResult === undefined || nodeResult === null) {
      const nodeTypeId = node.data?.type || node.type || '';
      const metadata = availableNodeTypes.find(n => n.id === nodeTypeId);

      const buildExampleForType = (typeId: string | undefined) => {
        // default fallbacks
        if (!typeId) return { output: { data: {} } };
        const t = typeId.toString().toLowerCase();
        if (
          t.startsWith('ai-') ||
          t.includes('ai') ||
          t.includes('openai') ||
          t.includes('gemini')
        ) {
          return {
            output: { text: 'Example AI response', tokens: 123, metadata: { prompt: '...' } },
          };
        }
        if (t.includes('webhook') || t.includes('trigger')) {
          return { output: { body: { exampleField: 'value' }, headers: { 'x-id': 'abc' } } };
        }
        if (t.includes('http') || t.includes('fetch') || t.includes('request')) {
          return { output: { data: { status: 200, body: { message: 'ok' } }, status: 200 } };
        }
        if (t.includes('sheet') || t.includes('database') || t.includes('query')) {
          return { output: { data: [{ id: 1, name: 'Example' }] } };
        }
        // If metadata provides hints, try to build something from configs
        if (metadata && metadata.configs && metadata.configs.length) {
          // create a small example shape using config keys
          const obj: any = { output: { data: {} } };
          metadata.configs.slice(0, 4).forEach((c: any) => {
            const key = (c.l || '').replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase() || 'field';
            obj.output.data[key] = c.d ?? `example_${key}`;
          });
          return obj;
        }

        return { output: { data: { example: 'value' } } };
      };

      // prefer fetched sample if available
      nodeResult = nodeResult ?? buildExampleForType(node.data?.type || node.type);
      synthesizedExample = true;
    }

    if (typeof nodeResult !== 'object') {
      addVariable('output', 'output', 'Main output value', 'output');
      return vars;
    }

    const flattened = flattenObjectPaths(nodeResult, '');
    const seenPaths = new Set<string>();

    flattened.forEach(path => {
      if (seenPaths.has(path)) return;
      seenPaths.add(path);
      const category = path.startsWith('output') ? 'output' : 'data';
      addVariable(path, path, 'Previous node data path', category);
    });

    if (nodeType.startsWith('ai-') && typeof nodeResult.output !== 'object') {
      addVariable('output', 'output', 'AI generated response', 'output');
    }

    if (nodeType.includes('search')) {
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
