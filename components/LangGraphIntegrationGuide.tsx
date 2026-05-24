// Frontend Integration Guide for LangGraph
// Add this to your agent-builder/page.tsx or components

import React, { useState, useCallback } from 'react';
import { AgentExecutionMonitor } from '@/components/AgentExecutionMonitor';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Example: Integrating LangGraph into Agent Builder
 */
export function LangGraphIntegration() {
  // Your existing workflow state
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [input, setInput] = useState<Record<string, any>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, any>>({});

  // LangGraph execution mode state
  const [executionMode, setExecutionMode] = useState<'old' | 'langgraph'>('langgraph');

  /**
   * Handle workflow execution with appropriate system
   */
  const handleExecuteWorkflow = useCallback(async () => {
    if (executionMode === 'langgraph') {
      // New LangGraph system - handled by AgentExecutionMonitor
      return;
    } else {
      // Old system - keep existing implementation
      // Your existing executeWorkflow logic here
    }
  }, [executionMode]);

  return (
    <div className="w-full space-y-4">
      {/* Execution Mode Toggle */}
      <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <span className="text-sm font-medium">Execution Engine:</span>
        <Button
          size="sm"
          variant={executionMode === 'langgraph' ? 'default' : 'outline'}
          onClick={() => setExecutionMode('langgraph')}
        >
          LangGraph (Advanced)
        </Button>
        <Button
          size="sm"
          variant={executionMode === 'old' ? 'default' : 'outline'}
          onClick={() => setExecutionMode('old')}
        >
          Legacy
        </Button>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Builder Tab */}
        <TabsContent value="builder" className="space-y-4">
          {/* Your existing graph canvas component */}
          <div className="border rounded-lg p-4 h-96 bg-gray-50">
            {/* ReactFlow canvas here */}
            <p className="text-gray-500">Graph Canvas</p>
          </div>
        </TabsContent>

        {/* Execution Tab - LangGraph Monitor */}
        <TabsContent value="execution" className="space-y-4">
          {executionMode === 'langgraph' ? (
            <AgentExecutionMonitor nodes={nodes} edges={edges} input={input} apiKeys={apiKeys} />
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-gray-600">Using legacy execution engine</p>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {/* API Keys Configuration */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">API Keys</h3>
            {/* Your existing API key settings */}
          </div>

          {/* Execution Options */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Execution Options</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Enable Streaming</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Show Real-time Logs</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Auto-retry on Failure</span>
              </label>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Example Hook Usage in a Component
 */
export function ExampleHookUsage() {
  const { useLangGraphExecution, useLangGraphConnection } = require('@/hooks/use-langgraph');

  const { connect, isConnected } = useLangGraphConnection();
  const { state, executeAgent, cancelExecution } = useLangGraphExecution();

  React.useEffect(() => {
    // Initialize connection with user token
    const token = 'your-auth-token';
    connect(token);
  }, []);

  const handleExecute = async () => {
    await executeAgent({
      nodes: [],
      edges: [],
      input: { query: 'test' },
      apiKeys: { openai_api_key: 'sk-...' },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p>Connected: {isConnected ? '✓' : '✗'}</p>
        <p>Status: {state.status}</p>
        <p>Progress: {state.progress}%</p>
      </div>

      <Button onClick={handleExecute} disabled={!isConnected || state.status === 'running'}>
        Execute
      </Button>

      {state.status === 'running' && (
        <Button onClick={cancelExecution} variant="destructive">
          Cancel
        </Button>
      )}
    </div>
  );
}

/**
 * Migration Checklist
 *
 * To migrate from old system to LangGraph:
 *
 * 1. [ ] Update dependencies (npm install)
 *
 * 2. [ ] Initialize WebSocket connection in your app root:
 *      import { useLangGraphConnection } from '@/hooks/use-langgraph'
 *      const { connect } = useLangGraphConnection()
 *      useEffect(() => { connect(token) }, [])
 *
 * 3. [ ] Replace agent execution with new hook:
 *      OLD: await workersAPI.runAgent(agentData, token)
 *      NEW: const { executeAgent } = useLangGraphExecution()
 *           await executeAgent(agentData)
 *
 * 4. [ ] Add execution monitor to your UI:
 *      <AgentExecutionMonitor
 *        nodes={nodes}
 *        edges={edges}
 *        input={input}
 *        apiKeys={apiKeys}
 *      />
 *
 * 5. [ ] Update streaming handlers (if using custom):
 *      OLD: Long polling
 *      NEW: WebSocket + Stream events
 *
 * 6. [ ] Test end-to-end with a sample workflow
 *
 * 7. [ ] Update error handling to use new error format
 *
 * 8. [ ] Verify performance with streaming enabled
 *
 * 9. [ ] Update documentation/help text
 *
 * 10.[ ] Deploy to staging for testing
 */

/**
 * REST API Endpoints (Backward Compatible)
 *
 * POST /api/langgraph/execute
 *   Execute agent workflow with LangGraph
 *   Request: { nodes, edges, input, apiKeys, enableStreaming }
 *   Response: { success, executionId, output, logs, errors }
 *
 * GET /api/langgraph/status/:executionId
 *   Get execution status (for polling if needed)
 *   Response: { executionId, isExecuting }
 *
 * POST /api/langgraph/cancel/:executionId
 *   Cancel execution
 *   Response: { success, message }
 *
 * POST /api/langgraph/validate
 *   Validate workflow before execution
 *   Request: { nodes, edges }
 *   Response: { valid, errors, warnings }
 *
 * WebSocket Events:
 *   client → server: subscribe:execution(executionId)
 *   server → client: execution:update(streamEvent)
 */

/**
 * Configuration Examples
 */

// Minimal configuration
const minimalConfig = {
  nodes: [{ id: 'node1', type: 'ai-chat', config: { model: 'gpt-4' } }],
  edges: [],
  input: { query: 'hello' },
  apiKeys: { openai_api_key: 'sk-...' },
};

// Advanced configuration
const advancedConfig = {
  agentId: 'agent_123',
  nodes: [
    {
      id: 'node1',
      type: 'ai-chat',
      config: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      },
    },
    {
      id: 'node2',
      type: 'http-request',
      config: {
        url: 'https://api.example.com/data',
        method: 'POST',
      },
    },
  ],
  edges: [
    {
      source: 'node1',
      target: 'node2',
      condition: (state: any) => state.nodeResults.node1.success,
    },
  ],
  input: {
    query: 'analyze this data',
    data: {
      /* ... */
    },
  },
  apiKeys: {
    openai_api_key: 'sk-...',
    http_api_key: 'api_...',
  },
  variables: {
    userId: 'user_123',
    sessionId: 'sess_456',
  },
  maxRetries: 2,
  enableStreaming: true,
};
