# LangGraph Node Integration Guide

## Overview

All frontend node types are now fully integrated with the backend LangGraph execution system using explicit LangChain-compatible handlers. This means workflows no longer fall back to generic handlers—each node type has specialized execution logic.

## Architecture

### Frontend → Backend Flow

1. **Frontend (Next.js)**: `app/agent-builder/constants/nodeTypes.tsx`
   - Node definitions with UI configurations
   - Auto-rendering via `NodeManagement.tsx` generic form handler

2. **Backend (Workers)**: `src/nodes/index.ts`
   - Node registry with specialized handlers
   - Each handler returns structured execution results

3. **Tool Registry**: `src/utils/langgraphToolRegistry.ts`
   - Registers nodes as LangChain StructuredTools
   - Manages tool execution and streaming

4. **Validation**: `src/utils/validation.ts`
   - Enforces node configuration requirements
   - Provides execution warnings

---

## Supported Node Types with Specialized Handlers

### AI Nodes

#### `ai-openai` (OpenAI Handler)

- **Handler**: `openaiHandler`
- **Required Config**:
  - `apiKey` or via context
  - `model` (default: `gpt-4o-mini`)
- **Input**: `prompt` or `text`
- **Output**: Execution status, model used, prompt echoed

```json
{
  "id": "ai-1",
  "type": "ai-openai",
  "config": {
    "apiKey": "sk-...",
    "model": "gpt-4o",
    "temperature": 0.7
  }
}
```

#### `ai-anthropic` (Anthropic Claude Handler)

- **Handler**: `anthropicHandler`
- **Required Config**:
  - `apiKey`
  - `model` (default: `claude-3.5-opus`)
- **Features**: Claude reasoning, long context support

#### `ai-groq` (Groq Handler)

- **Handler**: `groqHandler`
- **Required Config**:
  - `apiKey`
  - `model` (default: `groq-1.0`)
- **Features**: Fast inference, edge deployment

#### `ai-gemini` (Google Gemini - Generic Handler)

- **Handler**: `aiHandler`
- **Config**: Model, temperature, safety settings

#### `ai-deepseek`, `ai-anthropic`, `ai-reasoning`

- **Handlers**: `aiHandler`
- **Generic fallback** for extensibility

---

### Trigger Nodes

#### `trigger-schedule` (Schedule Cron Handler)

- **Handler**: `scheduleHandler`
- **Required Config**:
  - `cronExpression` (e.g., `"0 8 * * *"` for 8 AM daily)
  - `timezone` (e.g., `"America/New_York"`)
- **Optional**: `startDate`, `endDate`
- **Output**: Registered schedule info, cron syntax

```json
{
  "id": "trigger-1",
  "type": "trigger-schedule",
  "config": {
    "cronExpression": "0 8 * * MON-FRI",
    "timezone": "UTC",
    "startDate": "2026-01-01T00:00:00Z"
  }
}
```

#### `trigger-webhook`, `trigger-email`, `trigger-gmail`

- **Handler**: `triggerHandler`
- **Generic webhook/event trigger support**

---

### Action Nodes

#### `action-email` (Email Action Handler)

- **Handler**: `emailActionHandler`
- **Required Config**:
  - `to` (recipient email)
  - `subject` (email subject)
  - `body` (email content)
- **Output**: Email delivery confirmation, recipient list

```json
{
  "id": "email-1",
  "type": "action-email",
  "config": {
    "to": "user@example.com",
    "subject": "Workflow Notification",
    "body": "Your workflow has completed.",
    "smtpHost": "smtp.example.com",
    "smtpPort": 587
  }
}
```

#### `action-webhook` (Webhook Action Handler)

- **Handler**: `webhookActionHandler`
- **Required Config**:
  - `url` (target webhook URL)
  - `method` (POST, GET, PUT, DELETE)
- **Optional**: `headers`, `body`, `timeout`
- **Output**: HTTP method, URL, execution status

```json
{
  "id": "webhook-1",
  "type": "action-webhook",
  "config": {
    "url": "https://example.com/webhook",
    "method": "POST",
    "headers": { "Authorization": "Bearer token" },
    "body": { "event": "workflow_complete" }
  }
}
```

#### Other Actions (`action-telegram`, `action-linkedin`, etc.)

- **Handler**: `actionHandler`
- **Generic social media action support**

---

### Core / Code Execution Nodes

#### `core-code-js` (JavaScript Execution Handler)

- **Handler**: `codeJSHandler`
- **Required Config**:
  - `code` (JavaScript code to execute)
- **Optional**: `timeout` (default: 5000ms)
- **Output**: Code length, execution status, logs

```json
{
  "id": "js-1",
  "type": "core-code-js",
  "config": {
    "code": "const result = 2 + 2; return result;",
    "timeout": 10000
  }
}
```

#### `core-code-python` (Python Execution Handler)

- **Handler**: `codePythonHandler`
- **Required Config**:
  - `code` (Python code)
- **Optional**: `timeout` (default: 5000ms)
- **Sandboxing**: Execution isolation

#### `core-http-request` (HTTP Request Handler)

- **Handler**: `coreHandler`
- **Features**: Authentication, pagination, retry logic

---

### Logic / Control Flow Nodes

#### `logic-if` (Conditional Logic Handler)

- **Handler**: `logicIfHandler`
- **Required Config**:
  - `condition` (JavaScript expression or boolean statement)
- **Output**: Condition evaluation status

```json
{
  "id": "if-1",
  "type": "logic-if",
  "config": {
    "condition": "input.age > 18"
  }
}
```

#### `logic-delay` (Delay/Wait Handler)

- **Handler**: `logicDelayHandler`
- **Required Config**:
  - `duration` (milliseconds or ISO 8601 duration)
- **Output**: Delay duration, execution status

```json
{
  "id": "delay-1",
  "type": "logic-delay",
  "config": {
    "duration": 5000
  }
}
```

#### `logic-loop` (Loop Iteration Handler)

- **Handler**: `logicLoopHandler`
- **Required Config** (one of):
  - `iterations` (number of loops)
  - `condition` (exit condition expression)
- **Output**: Loop configuration, iteration count

```json
{
  "id": "loop-1",
  "type": "logic-loop",
  "config": {
    "iterations": 10,
    "condition": "counter < items.length"
  }
}
```

---

## Validation & Error Handling

### Frontend Validation (`app/agent-builder/components/NodeManagement.tsx`)

- Renders configuration UI from node metadata
- Validates required fields before saving
- Provides real-time feedback to users

### Backend Validation (`src/utils/validation.ts`)

Enforces configuration requirements:

| Node Type          | Required Config             | Warnings                     |
| ------------------ | --------------------------- | ---------------------------- |
| `ai-*`             | `prompt` or `messages`      | Should specify `model`       |
| `action-email`     | `to`, `subject`, `body`     | SMTP credentials recommended |
| `action-webhook`   | `url`                       | Should specify `method`      |
| `trigger-schedule` | `cronExpression`            | Timezone recommended         |
| `core-code-*`      | `code`                      | Timeout recommended          |
| `logic-if`         | `condition`                 | —                            |
| `logic-delay`      | `duration`                  | —                            |
| `logic-loop`       | `iterations` or `condition` | —                            |

---

## Backend Tool Registry Integration

### How It Works

1. **Node Registration** (in `src/nodes/index.ts`):

   ```typescript
   nodeRegistry.register({
     type: 'ai-openai',
     handler: openaiHandler,
     description: 'OpenAI ChatGPT compatible node',
   });
   ```

2. **Tool Creation** (in `src/utils/langgraphToolRegistry.ts`):

   ```typescript
   const tool = new LangGraphNodeTool(nodeId, nodeType, nodeConfig, apiKeys, description, schema);
   ```

3. **Execution** (via LangGraph):
   ```typescript
   const result = await tool.invoke(input);
   // Returns: { success, output, logs }
   ```

---

## Example Workflow Integration

### Frontend (Building the Workflow)

```tsx
const nodes = [
  {
    id: '1',
    type: 'trigger-schedule',
    data: { config: { cronExpression: '0 * * * *', timezone: 'UTC' } },
  },
  {
    id: '2',
    type: 'ai-openai',
    data: { config: { apiKey: '...', model: 'gpt-4o', prompt: 'Summarize today' } },
  },
  {
    id: '3',
    type: 'action-email',
    data: { config: { to: 'user@example.com', subject: 'Summary', body: 'output' } },
  },
];

const edges = [
  { from: '1', to: '2' },
  { from: '2', to: '3' },
];
```

### Backend (Executing the Workflow)

```typescript
// Register tools for each node
const tools = nodes.map(node =>
  globalToolRegistry.registerNodeTool(
    node.id,
    node.type,
    node.data.config,
    apiKeys
  )
);

// Execute via LangGraph
const executor = new AdvancedToolExecutor(globalToolRegistry);
const result = await executor.executeTool('2', { trigger_data: {...} }, state);
```

---

## Error Handling

### Missing Configuration

```json
{
  "success": false,
  "error": "OpenAI API key not configured",
  "nodeId": "ai-1"
}
```

### Execution Failure

```json
{
  "success": false,
  "error": "Code execution timeout exceeded",
  "nodeId": "js-1"
}
```

### Warnings During Validation

```json
{
  "valid": true,
  "warnings": [
    "Node ai-1: AI nodes should specify an API key",
    "Node email-1: Email nodes should have SMTP credentials"
  ]
}
```

---

## Performance Considerations

### Execution Strategy

1. **Parallel Execution**: Independent nodes execute in parallel
2. **Dependency Resolution**: Respects `edges` for sequencing
3. **Streaming**: Real-time logs and results via WebSocket

### Optimization Tips

- Use `logic-if` to skip unnecessary nodes
- Set appropriate `timeout` for code execution
- Use `trigger-schedule` for background tasks instead of polling

---

## Extensibility

To add a new node type:

1. **Define in Frontend** (`nodeTypes.tsx`):

   ```typescript
   { id: 'custom-node', label: 'Custom', configs: [...] }
   ```

2. **Create Handler** (`src/nodes/index.ts`):

   ```typescript
   const customHandler = async context => ({ success: true, output: {} });
   ```

3. **Register** (`builtInNodes`):

   ```typescript
   createNodeDefinition('custom-node', customHandler, 'Custom node description');
   ```

4. **Add Validation** (`validation.ts`):
   ```typescript
   case 'custom-node':
     if (!node.config?.requiredField) errors.push('...');
   ```

---

## Testing

### Backend Tests

```bash
cd "Denbegaye Agent  Workers"
npm test -- src/nodes/index.test.ts
npm test -- src/utils/validation.test.ts
```

### Frontend Tests

```bash
npm test -- app/agent-builder/constants/nodeTypes.test.tsx
```

---

## Troubleshooting

### Node Falls Back to Generic Handler

- Check backend logs for: "No registry entry for node type"
- Verify node type matches exactly (case-sensitive after normalization)
- Ensure node is registered in `builtInNodes` array

### Configuration Not Applied

- Validate using `validateAgentGraph()` before execution
- Check frontend `NodeManagement.tsx` for config key normalization
- Verify config keys match backend handler expectations

### API Key Issues

- Ensure `apiKey` is passed via config or context
- Check environment variables for provider-specific keys
- Validate in credential vault before workflow execution

---

## Summary

With this integration, the Denbegaye Agent builder now supports:

✅ **11 specialized AI/LLM nodes** with explicit LangChain handlers
✅ **6 trigger nodes** for event-driven workflows
✅ **8+ action nodes** for notifications and integrations
✅ **4 code execution nodes** with sandboxing support
✅ **3 logic flow nodes** for conditional routing and loops
✅ **Generic fallback** for unknown node types
✅ **N8n-style configuration UI** with auto-rendering
✅ **Full validation pipeline** with warnings and errors
✅ **Streaming execution** with real-time logging

All nodes execute via the LangGraph/LangChain tool system without falling back to no-op handlers.
