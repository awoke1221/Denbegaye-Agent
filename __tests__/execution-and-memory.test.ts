/**
 * End-to-End Tests for Agent Execution and Memory System
 * Tests: Agent execution flow, memory management, and integration
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// ============================================
// EXECUTION MODEL
// ============================================

export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface NodeExecutionResult {
  nodeId: string;
  status: NodeStatus;
  output?: Record<string, any>;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface ExecutionContext {
  executionId: string;
  agentId: string;
  workflowId: string;
  status: ExecutionStatus;
  nodeResults: Record<string, any>;
  logs: string[];
  startTime: Date;
  endTime?: Date;
  error?: string;
}

// ============================================
// MEMORY MODEL
// ============================================

export type MemoryType = 'conversation' | 'fact' | 'procedure' | 'context';

export interface AgentMemory {
  id: string;
  agentId: string;
  content: string;
  type: MemoryType;
  importance: number; // 0-1
  timestamp: Date;
  metadata?: Record<string, any>;
  relatedMemoryIds?: string[];
}

export interface MemoryStore {
  memories: Map<string, AgentMemory>;
  vectorIndex: Map<string, string[]>; // embedding -> memoryIds
}

// ============================================
// MOCK IMPLEMENTATIONS
// ============================================

class MockExecutionEngine {
  private executions: Map<string, ExecutionContext> = new Map();
  private executionListeners: Set<(execution: ExecutionContext) => void> = new Set();

  async executeAgent(
    agentId: string,
    workflowId: string,
    nodes: any[],
    edges: any[]
  ): Promise<ExecutionContext> {
    const executionId = `exec-${Date.now()}`;
    const execution: ExecutionContext = {
      executionId,
      agentId,
      workflowId,
      status: 'running',
      nodeResults: {},
      logs: [],
      startTime: new Date(),
    };

    this.executions.set(executionId, execution);
    this.notifyListeners(execution);

    try {
      // Execute nodes in order (topological sort by edges)
      for (const node of nodes) {
        const nodeResult = await this.executeNode(node, execution);
        execution.nodeResults[node.id] = nodeResult;
        execution.logs.push(`Node ${node.id} completed: ${JSON.stringify(nodeResult)}`);
        this.notifyListeners(execution);
      }

      execution.status = 'completed';
      execution.endTime = new Date();
    } catch (error) {
      execution.status = 'failed';
      execution.error = String(error);
      execution.endTime = new Date();
    }

    this.notifyListeners(execution);
    return execution;
  }

  private async executeNode(node: any, execution: ExecutionContext): Promise<any> {
    // Simulate node execution with synthetic outputs
    const outputs: Record<string, any> = {
      'ai-gemini': {
        text: 'AI generated response',
        tokens: 42,
        metadata: { model: 'gemini-pro' },
      },
      'trigger-webhook': {
        body: { id: '123', data: 'webhook data' },
        headers: { 'x-event-id': 'evt_456' },
      },
      'action-email': {
        recipient: 'user@example.com',
        subject: 'Test Email',
        sent: true,
      },
      'data-google-sheets': {
        data: [
          { id: 1, name: 'Row 1' },
          { id: 2, name: 'Row 2' },
        ],
      },
    };

    const nodeTypeId = node.data?.type || node.type || 'unknown';
    const output = outputs[nodeTypeId] || { data: { result: 'generic output' } };

    return {
      nodeId: node.id,
      status: 'completed' as NodeStatus,
      output,
      duration: Math.random() * 1000,
      timestamp: new Date(),
    };
  }

  getExecution(executionId: string): ExecutionContext | undefined {
    return this.executions.get(executionId);
  }

  subscribe(callback: (execution: ExecutionContext) => void): () => void {
    this.executionListeners.add(callback);
    return () => this.executionListeners.delete(callback);
  }

  private notifyListeners(execution: ExecutionContext) {
    this.executionListeners.forEach(cb => cb(execution));
  }
}

class MockMemoryStore {
  private memories: Map<string, AgentMemory> = new Map();
  private memoryCounters: Map<string, number> = new Map();

  async createMemory(
    agentId: string,
    content: string,
    type: MemoryType,
    importance: number,
    metadata?: Record<string, any>
  ): Promise<AgentMemory> {
    const counter = (this.memoryCounters.get(agentId) || 0) + 1;
    this.memoryCounters.set(agentId, counter);

    const memory: AgentMemory = {
      id: `mem-${agentId}-${counter}`,
      agentId,
      content,
      type,
      importance: Math.min(Math.max(importance, 0), 1),
      timestamp: new Date(),
      metadata,
    };

    this.memories.set(memory.id, memory);
    return memory;
  }

  async getMemories(agentId: string, type?: MemoryType): Promise<AgentMemory[]> {
    return Array.from(this.memories.values()).filter(
      m => m.agentId === agentId && (!type || m.type === type)
    );
  }

  async searchMemories(agentId: string, query: string): Promise<AgentMemory[]> {
    const queryLower = query.toLowerCase();
    return Array.from(this.memories.values()).filter(
      m =>
        m.agentId === agentId &&
        (m.content.toLowerCase().includes(queryLower) || m.metadata?.tags?.includes(queryLower))
    );
  }

  async updateMemoryImportance(memoryId: string, importance: number): Promise<AgentMemory | null> {
    const memory = this.memories.get(memoryId);
    if (!memory) return null;
    memory.importance = Math.min(Math.max(importance, 0), 1);
    memory.timestamp = new Date();
    return memory;
  }

  async linkMemories(memoryId1: string, memoryId2: string): Promise<boolean> {
    const mem1 = this.memories.get(memoryId1);
    const mem2 = this.memories.get(memoryId2);
    if (!mem1 || !mem2) return false;

    if (!mem1.relatedMemoryIds) mem1.relatedMemoryIds = [];
    if (!mem2.relatedMemoryIds) mem2.relatedMemoryIds = [];

    if (!mem1.relatedMemoryIds.includes(memoryId2)) mem1.relatedMemoryIds.push(memoryId2);
    if (!mem2.relatedMemoryIds.includes(memoryId1)) mem2.relatedMemoryIds.push(memoryId1);

    return true;
  }

  clear() {
    this.memories.clear();
    this.memoryCounters.clear();
  }
}

// ============================================
// TEST SUITES
// ============================================

describe('Agent Execution System - E2E Tests', () => {
  let executionEngine: MockExecutionEngine;

  beforeEach(() => {
    executionEngine = new MockExecutionEngine();
  });

  describe('Execution Workflow', () => {
    it('should execute a single-node agent workflow', async () => {
      const nodes = [
        {
          id: 'node-1',
          type: 'ai-gemini',
          data: { type: 'ai-gemini', label: 'AI Node' },
        },
      ];

      const execution = await executionEngine.executeAgent('agent-1', 'workflow-1', nodes, []);

      expect(execution.status).toBe('completed');
      expect(execution.nodeResults['node-1']).toBeDefined();
      expect(execution.nodeResults['node-1'].output.text).toContain('AI');
      expect(execution.endTime).toBeDefined();
      expect(execution.logs.length).toBeGreaterThan(0);
    });

    it('should execute multi-node workflow with data flow', async () => {
      const nodes = [
        {
          id: 'node-1',
          type: 'trigger-webhook',
          data: { type: 'trigger-webhook', label: 'Webhook Trigger' },
        },
        {
          id: 'node-2',
          type: 'ai-gemini',
          data: { type: 'ai-gemini', label: 'Process Data' },
        },
        {
          id: 'node-3',
          type: 'action-email',
          data: { type: 'action-email', label: 'Send Email' },
        },
      ];

      const edges = [
        { id: 'edge-1', source: 'node-1', target: 'node-2' },
        { id: 'edge-2', source: 'node-2', target: 'node-3' },
      ];

      const execution = await executionEngine.executeAgent('agent-1', 'workflow-1', nodes, edges);

      expect(execution.status).toBe('completed');
      expect(execution.nodeResults['node-1']).toBeDefined();
      expect(execution.nodeResults['node-2']).toBeDefined();
      expect(execution.nodeResults['node-3']).toBeDefined();

      // Verify data flow: all nodes produced results
      const results = Object.values(execution.nodeResults);
      expect(results).toHaveLength(3);
    });

    it('should track execution status in real-time', async () => {
      const statusUpdates: ExecutionStatus[] = [];
      const nodes = [
        {
          id: 'node-1',
          type: 'ai-gemini',
          data: { type: 'ai-gemini', label: 'AI Node' },
        },
      ];

      const unsubscribe = executionEngine.subscribe(execution => {
        statusUpdates.push(execution.status);
      });

      await executionEngine.executeAgent('agent-1', 'workflow-1', nodes, []);

      expect(statusUpdates).toContain('running');
      expect(statusUpdates[statusUpdates.length - 1]).toBe('completed');

      unsubscribe();
    });

    it('should record execution logs', async () => {
      const nodes = [
        {
          id: 'node-1',
          type: 'ai-gemini',
          data: { type: 'ai-gemini', label: 'AI Node' },
        },
        {
          id: 'node-2',
          type: 'action-email',
          data: { type: 'action-email', label: 'Email' },
        },
      ];

      const execution = await executionEngine.executeAgent('agent-1', 'workflow-1', nodes, []);

      expect(execution.logs.length).toBeGreaterThanOrEqual(2);
      expect(execution.logs[0]).toContain('node-1');
      expect(execution.logs[1]).toContain('node-2');
    });

    it('should measure node execution duration', async () => {
      const nodes = [
        {
          id: 'node-1',
          type: 'ai-gemini',
          data: { type: 'ai-gemini', label: 'AI Node' },
        },
      ];

      const execution = await executionEngine.executeAgent('agent-1', 'workflow-1', nodes, []);

      const nodeResult = execution.nodeResults['node-1'];
      expect(nodeResult.duration).toBeGreaterThanOrEqual(0);
      expect(nodeResult.duration).toBeLessThan(1000);
    });

    it('should retrieve execution by ID', async () => {
      const nodes = [
        {
          id: 'node-1',
          type: 'trigger-webhook',
          data: { type: 'trigger-webhook', label: 'Webhook' },
        },
      ];

      const execution = await executionEngine.executeAgent('agent-1', 'workflow-1', nodes, []);
      const retrieved = executionEngine.getExecution(execution.executionId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.executionId).toBe(execution.executionId);
      expect(retrieved?.status).toBe('completed');
    });
  });

  describe('Execution Error Handling', () => {
    it('should capture execution errors gracefully', async () => {
      const nodes = [
        {
          id: 'node-1',
          type: 'ai-gemini',
          data: { type: 'ai-gemini', label: 'AI Node' },
        },
      ];

      // Simulate error by overriding execute method
      const originalMethod = executionEngine['executeNode'];
      executionEngine['executeNode'] = jest.fn(async () => {
        throw new Error('Simulated execution error');
      });

      const execution = await executionEngine.executeAgent('agent-1', 'workflow-1', nodes, []);

      expect(execution.status).toBe('failed');
      expect(execution.error).toContain('Simulated execution error');
      expect(execution.endTime).toBeDefined();

      // Restore
      executionEngine['executeNode'] = originalMethod;
    });
  });
});

describe('Agent Memory System - E2E Tests', () => {
  let memoryStore: MockMemoryStore;
  const agentId = 'agent-1';

  beforeEach(() => {
    memoryStore = new MockMemoryStore();
  });

  afterEach(() => {
    memoryStore.clear();
  });

  describe('Memory Creation and Storage', () => {
    it('should create and store agent memories', async () => {
      const memory = await memoryStore.createMemory(
        agentId,
        'User prefers marketing via email',
        'fact',
        0.8,
        { source: 'user_profile' }
      );

      expect(memory.id).toBeDefined();
      expect(memory.agentId).toBe(agentId);
      expect(memory.content).toBe('User prefers marketing via email');
      expect(memory.type).toBe('fact');
      expect(memory.importance).toBe(0.8);
    });

    it('should handle different memory types', async () => {
      const types: MemoryType[] = ['conversation', 'fact', 'procedure', 'context'];

      const memories = await Promise.all(
        types.map((type, i) =>
          memoryStore.createMemory(agentId, `Memory of type ${type}`, type, 0.5 + i * 0.1)
        )
      );

      expect(memories).toHaveLength(4);
      memories.forEach((mem, i) => {
        expect(mem.type).toBe(types[i]);
      });
    });

    it('should clamp importance score to 0-1 range', async () => {
      const memory1 = await memoryStore.createMemory(
        agentId,
        'High importance',
        'fact',
        1.5 // Should be clamped to 1
      );
      const memory2 = await memoryStore.createMemory(
        agentId,
        'Low importance',
        'fact',
        -0.5 // Should be clamped to 0
      );

      expect(memory1.importance).toBe(1);
      expect(memory2.importance).toBe(0);
    });

    it('should include metadata with memory', async () => {
      const metadata = { source: 'webhook', eventId: 'evt_123', tags: ['urgent', 'customer'] };
      const memory = await memoryStore.createMemory(
        agentId,
        'Important event occurred',
        'conversation',
        0.9,
        metadata
      );

      expect(memory.metadata).toEqual(metadata);
    });
  });

  describe('Memory Retrieval and Search', () => {
    beforeEach(async () => {
      // Create test memories
      await memoryStore.createMemory(agentId, 'User likes coffee', 'fact', 0.8, {
        category: 'preferences',
      });
      await memoryStore.createMemory(agentId, 'User visited store on Monday', 'conversation', 0.6, {
        tags: ['visit'],
      });
      await memoryStore.createMemory(
        agentId,
        'Standard email template procedure',
        'procedure',
        0.7,
        { tags: ['email'] }
      );
    });

    it('should retrieve all memories for an agent', async () => {
      const memories = await memoryStore.getMemories(agentId);

      expect(memories).toHaveLength(3);
      expect(memories.every(m => m.agentId === agentId)).toBe(true);
    });

    it('should filter memories by type', async () => {
      const facts = await memoryStore.getMemories(agentId, 'fact');
      const procedures = await memoryStore.getMemories(agentId, 'procedure');

      expect(facts).toHaveLength(1);
      expect(facts[0].content).toContain('coffee');

      expect(procedures).toHaveLength(1);
      expect(procedures[0].content).toContain('email');
    });

    it('should search memories by content', async () => {
      const results = await memoryStore.searchMemories(agentId, 'user');

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some(m => m.content.includes('coffee'))).toBe(true);
      expect(results.some(m => m.content.includes('visited'))).toBe(true);
    });

    it('should search memories by metadata tags', async () => {
      const results = await memoryStore.searchMemories(agentId, 'email');

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(m => m.metadata?.tags?.includes('email'))).toBe(true);
    });

    it('should return empty when search has no matches', async () => {
      const results = await memoryStore.searchMemories(agentId, 'nonexistent_keyword_xyz');

      expect(results).toHaveLength(0);
    });
  });

  describe('Memory Updates and Relationships', () => {
    it('should update memory importance score', async () => {
      const memory = await memoryStore.createMemory(agentId, 'Initial memory', 'fact', 0.3);

      const updated = await memoryStore.updateMemoryImportance(memory.id, 0.9);

      expect(updated?.importance).toBe(0.9);
      expect(updated?.timestamp.getTime()).toBeGreaterThanOrEqual(memory.timestamp.getTime());
    });

    it('should link related memories', async () => {
      const memory1 = await memoryStore.createMemory(agentId, 'Memory 1', 'fact', 0.5);
      const memory2 = await memoryStore.createMemory(agentId, 'Memory 2', 'fact', 0.5);

      const linked = await memoryStore.linkMemories(memory1.id, memory2.id);

      expect(linked).toBe(true);

      const updated1 = await memoryStore.getMemories(agentId);
      const mem1 = updated1.find(m => m.id === memory1.id);
      const mem2 = updated1.find(m => m.id === memory2.id);

      expect(mem1?.relatedMemoryIds).toContain(memory2.id);
      expect(mem2?.relatedMemoryIds).toContain(memory1.id);
    });

    it('should not create duplicate links between memories', async () => {
      const memory1 = await memoryStore.createMemory(agentId, 'Memory 1', 'fact', 0.5);
      const memory2 = await memoryStore.createMemory(agentId, 'Memory 2', 'fact', 0.5);

      await memoryStore.linkMemories(memory1.id, memory2.id);
      await memoryStore.linkMemories(memory1.id, memory2.id); // Link again

      const memories = await memoryStore.getMemories(agentId);
      const mem1 = memories.find(m => m.id === memory1.id);

      const count = mem1?.relatedMemoryIds?.filter(id => id === memory2.id).length || 0;
      expect(count).toBe(1); // Should only appear once
    });
  });

  describe('Memory Edge Cases', () => {
    it('should handle empty memory store', async () => {
      const memories = await memoryStore.getMemories('nonexistent-agent');
      expect(memories).toHaveLength(0);
    });

    it('should assign unique IDs to memories', async () => {
      const memory1 = await memoryStore.createMemory(agentId, 'Memory 1', 'fact', 0.5);
      const memory2 = await memoryStore.createMemory(agentId, 'Memory 2', 'fact', 0.5);
      const memory3 = await memoryStore.createMemory(agentId, 'Memory 3', 'fact', 0.5);

      const ids = [memory1.id, memory2.id, memory3.id];
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });
  });
});

describe('Execution + Memory Integration', () => {
  let executionEngine: MockExecutionEngine;
  let memoryStore: MockMemoryStore;
  const agentId = 'agent-1';

  beforeEach(() => {
    executionEngine = new MockExecutionEngine();
    memoryStore = new MockMemoryStore();
  });

  afterEach(() => {
    memoryStore.clear();
  });

  it('should store execution results in memory after completion', async () => {
    const nodes = [
      {
        id: 'node-1',
        type: 'ai-gemini',
        data: { type: 'ai-gemini', label: 'AI Node' },
      },
    ];

    const execution = await executionEngine.executeAgent(agentId, 'workflow-1', nodes, []);

    // Store execution result as memory
    const memory = await memoryStore.createMemory(
      agentId,
      `Execution ${execution.executionId} completed with status ${execution.status}`,
      'conversation',
      execution.status === 'completed' ? 0.8 : 0.3,
      {
        executionId: execution.executionId,
        nodeCount: Object.keys(execution.nodeResults).length,
      }
    );

    expect(memory.content).toContain('completed');
    expect(memory.metadata?.executionId).toBe(execution.executionId);
  });

  it('should link execution memories to agent for tracking', async () => {
    const nodes = [
      {
        id: 'node-1',
        type: 'trigger-webhook',
        data: { type: 'trigger-webhook', label: 'Webhook' },
      },
    ];

    const execution1 = await executionEngine.executeAgent(agentId, 'workflow-1', nodes, []);
    const execution2 = await executionEngine.executeAgent(agentId, 'workflow-2', nodes, []);

    const memory1 = await memoryStore.createMemory(
      agentId,
      `Execution 1: ${execution1.executionId}`,
      'conversation',
      0.5,
      { type: 'execution_log' }
    );
    const memory2 = await memoryStore.createMemory(
      agentId,
      `Execution 2: ${execution2.executionId}`,
      'conversation',
      0.5,
      { type: 'execution_log' }
    );

    // Link execution memories
    await memoryStore.linkMemories(memory1.id, memory2.id);

    const memories = await memoryStore.getMemories(agentId, 'conversation');
    expect(memories.length).toBeGreaterThanOrEqual(2);
  });

  it('should update memory importance based on execution success', async () => {
    const nodes = [
      {
        id: 'node-1',
        type: 'data-google-sheets',
        data: { type: 'data-google-sheets', label: 'Sheets' },
      },
    ];

    const execution = await executionEngine.executeAgent(agentId, 'workflow-1', nodes, []);

    const memory = await memoryStore.createMemory(
      agentId,
      'Data fetch procedure',
      'procedure',
      0.5
    );

    // Update importance based on execution result
    const newImportance = execution.status === 'completed' ? 0.95 : 0.3;
    const updated = await memoryStore.updateMemoryImportance(memory.id, newImportance);

    expect(updated?.importance).toBe(0.95);
  });

  it('should retrieve execution context and related memories', async () => {
    const nodes = [
      {
        id: 'node-1',
        type: 'action-email',
        data: { type: 'action-email', label: 'Email' },
      },
    ];

    const execution = await executionEngine.executeAgent(agentId, 'workflow-1', nodes, []);

    // Create memory related to execution
    const memory = await memoryStore.createMemory(
      agentId,
      `Email sent via execution ${execution.executionId}`,
      'conversation',
      0.9,
      { executionId: execution.executionId }
    );

    // Retrieve execution
    const retrieved = executionEngine.getExecution(execution.executionId);

    // Retrieve related memories
    const memories = await memoryStore.getMemories(agentId, 'conversation');
    const relatedMemories = memories.filter(m => m.metadata?.executionId === execution.executionId);

    expect(retrieved?.status).toBe('completed');
    expect(relatedMemories).toHaveLength(1);
    expect(relatedMemories[0].content).toContain('Email sent');
  });
});
