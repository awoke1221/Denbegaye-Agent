import { describe, expect, it, beforeEach } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { useAgentBuilderStore } from '../stores/agentBuilderStore';

describe('useAgentBuilderStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useAgentBuilderStore());
    act(() => {
      result.current.reset();
    });
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAgentBuilderStore());

    expect(result.current.nodes).toEqual([]);
    expect(result.current.edges).toEqual([]);
    expect(result.current.selectedNodeId).toBeUndefined();
  });

  it('sets nodes', () => {
    const { result } = renderHook(() => useAgentBuilderStore());

    const newNodes = [
      {
        id: 'node-1',
        type: 'memory',
        position: { x: 100, y: 100 },
        data: { label: 'Test Node' },
      },
    ];

    act(() => {
      result.current.setNodes(newNodes);
    });

    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.nodes[0]).toEqual(newNodes[0]);
  });

  it('sets edges', () => {
    const { result } = renderHook(() => useAgentBuilderStore());

    const newEdges = [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
      },
    ];

    act(() => {
      result.current.setEdges(newEdges);
    });

    expect(result.current.edges).toHaveLength(1);
    expect(result.current.edges[0]).toEqual(newEdges[0]);
  });

  it('selects a node', () => {
    const { result } = renderHook(() => useAgentBuilderStore());

    act(() => {
      result.current.selectNode('node-1');
    });

    expect(result.current.selectedNodeId).toBe('node-1');
  });

  it('resets store to initial state', () => {
    const { result } = renderHook(() => useAgentBuilderStore());

    // Make some changes
    act(() => {
      result.current.setNodes([
        {
          id: 'node-1',
          type: 'memory',
          position: { x: 100, y: 100 },
          data: { label: 'Test Node' },
        },
      ]);
      result.current.setEdges([
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
        },
      ]);
      result.current.selectNode('node-1');
    });

    // Verify changes were made
    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.edges).toHaveLength(1);
    expect(result.current.selectedNodeId).toBe('node-1');

    // Reset
    act(() => {
      result.current.reset();
    });

    // Verify reset
    expect(result.current.nodes).toEqual([]);
    expect(result.current.edges).toEqual([]);
    expect(result.current.selectedNodeId).toBeUndefined();
  });
});
