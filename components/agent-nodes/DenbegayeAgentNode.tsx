import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { AdvancedAgentNode } from './AdvancedAgentNode';

/**
 * DenbegayeAgentNode - Autonomous AI Agent Node with Advanced Port Connections
 *
 * Features:
 * - LLM provider selection (Gemini, OpenAI, Anthropic, DeepSeek, Groq)
 * - Model selection per provider
 * - Tool calling capabilities via dedicated ports
 * - Memory system integration with input/output ports
 * - Advanced reasoning and planning
 * - Multiple input ports: Trigger, Input Data, Tools, Memory
 * - Multiple output ports: Tool Calls, Memory Update, Actions, Flow Control
 * - Expandable interface to show/hide connection ports
 * - Visual port categorization by type and color
 *
 * Similar to n8n and make.com workflow platforms:
 * - Left side: Input connections (triggers, data, tools, memory)
 * - Center: Node configuration and execution status
 * - Right side: Output connections (tool calls, memory updates, actions)
 */
export const DenbegayeAgentNode = memo((props: NodeProps) => {
  const { data = {}, selected, dragging } = props;

  return (
    <AdvancedAgentNode
      {...props}
      icon={data.icon || 'agent-multi'}
      label={data.label || 'Denbegaye Agent'}
      selected={selected}
      isDragging={dragging}
      expanded={data.expanded ?? false}
      onToggleExpand={() => {
        if (data.onExpandToggle) {
          data.onExpandToggle();
        }
      }}
    />
  );
});

DenbegayeAgentNode.displayName = 'DenbegayeAgentNode';
