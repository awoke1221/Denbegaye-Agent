// Advanced LangGraph API client for the frontend
import { io, Socket } from 'socket.io-client';

export interface StreamEvent {
  type: string;
  nodeId?: string;
  data: any;
  timestamp: Date;
  executionId: string;
}

export interface ExecutionStreamOptions {
  onNodeStart?: (nodeId: string) => void;
  onNodeEnd?: (nodeId: string, data: any) => void;
  onNodeError?: (nodeId: string, error: string) => void;
  onToolCall?: (toolName: string, input: any) => void;
  onToolResult?: (toolName: string, result: any) => void;
  onMessage?: (message: any) => void;
  onDebug?: (message: string) => void;
  onStateUpdate?: (state: any) => void;
  onExecutionComplete?: (result: any) => void;
  onExecutionError?: (error: string) => void;
}

/**
 * Advanced LangGraph API Client
 * Handles streaming execution with real-time updates
 */
export class AdvancedLangGraphClient {
  private baseURL: string;
  private socket: Socket | null = null;
  private token: string = '';
  private activeExecutions: Map<string, Set<(event: StreamEvent) => void>> = new Map();

  constructor(baseURL: string = process.env.NEXT_PUBLIC_WORKERS_URL || 'http://localhost:3001') {
    this.baseURL = baseURL;
  }

  /**
   * Initialize WebSocket connection
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.token = token;
        this.socket = io(this.baseURL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
          console.log('[LangGraph] WebSocket connected');
          resolve();
        });

        this.socket.on('connect_error', error => {
          console.error('[LangGraph] Connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('[LangGraph] WebSocket disconnected');
        });

        this.socket.on('execution:update', (event: StreamEvent) => {
          this.handleStreamEvent(event);
        });

        this.socket.on('execution:cancelled', (data: any) => {
          console.log('[LangGraph] Execution cancelled:', data);
        });

        this.socket.on('execution:status', (data: any) => {
          console.log('[LangGraph] Execution status:', data);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Execute agent with LangGraph (REST endpoint)
   */
  async executeAgent(
    agentData: {
      agentId?: string;
      nodes: any[];
      edges: any[];
      input: Record<string, any>;
      apiKeys: Record<string, any>;
      agentName?: string;
    },
    enableStreaming: boolean = true
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/langgraph/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          ...agentData,
          enableStreaming,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[LangGraph] Execution started:', result.executionId);
      return result;
    } catch (error) {
      console.error('[LangGraph] Execution error:', error);
      throw error;
    }
  }

  /**
   * Execute agent with streaming
   */
  async executeAgentWithStreaming(
    agentData: {
      agentId?: string;
      nodes: any[];
      edges: any[];
      input: Record<string, any>;
      apiKeys: Record<string, any>;
      agentName?: string;
    },
    options: ExecutionStreamOptions
  ): Promise<any> {
    // Ensure WebSocket is connected
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    // Execute agent
    const result = await this.executeAgent(agentData, true);
    const executionId = result.executionId;

    // Subscribe to execution stream
    const unsubscribe = this.subscribeToExecution(executionId, event => {
      this.handleStreamEventWithCallbacks(event, options);
    });

    // Subscribe via WebSocket
    this.socket!.emit('subscribe:execution', executionId);

    return {
      ...result,
      unsubscribe,
    };
  }

  /**
   * Subscribe to execution stream
   */
  private subscribeToExecution(
    executionId: string,
    callback: (event: StreamEvent) => void
  ): () => void {
    if (!this.activeExecutions.has(executionId)) {
      this.activeExecutions.set(executionId, new Set());
    }

    const listeners = this.activeExecutions.get(executionId)!;
    listeners.add(callback);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.activeExecutions.delete(executionId);
      }
    };
  }

  /**
   * Handle stream event
   */
  private handleStreamEvent(event: StreamEvent): void {
    const listeners = this.activeExecutions.get(event.executionId);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          console.error('[LangGraph] Stream handler error:', error);
        }
      }
    }
  }

  /**
   * Handle stream event with callbacks
   */
  private handleStreamEventWithCallbacks(
    event: StreamEvent,
    options: ExecutionStreamOptions
  ): void {
    try {
      switch (event.type) {
        case 'node_start':
          options.onNodeStart?.(event.nodeId!);
          break;
        case 'node_end':
          options.onNodeEnd?.(event.nodeId!, event.data);
          break;
        case 'node_error':
          options.onNodeError?.(event.nodeId!, event.data.error);
          break;
        case 'tool_call':
          options.onToolCall?.(event.data.toolName, event.data.input);
          break;
        case 'tool_result':
          options.onToolResult?.(event.data.toolName, event.data.result);
          break;
        case 'message':
          options.onMessage?.(event.data);
          break;
        case 'debug':
          options.onDebug?.(event.data);
          break;
        case 'state_update':
          options.onStateUpdate?.(event.data);
          break;
        case 'execution_complete':
          options.onExecutionComplete?.(event.data);
          break;
        case 'execution_error':
          options.onExecutionError?.(event.data.error);
          break;
      }
    } catch (error) {
      console.error('[LangGraph] Callback error:', error);
    }
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/langgraph/cancel/${executionId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel execution`);
      }

      console.log('[LangGraph] Execution cancelled:', executionId);

      // Notify via WebSocket
      if (this.socket?.connected) {
        this.socket.emit('cancel:execution', executionId);
      }

      // Cleanup
      this.activeExecutions.delete(executionId);
    } catch (error) {
      console.error('[LangGraph] Cancel error:', error);
      throw error;
    }
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/langgraph/status/${executionId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get execution status`);
      }

      return response.json();
    } catch (error) {
      console.error('[LangGraph] Status error:', error);
      throw error;
    }
  }

  /**
   * Get all active executions
   */
  async getActiveExecutions(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/langgraph/active-executions`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get active executions`);
      }

      return response.json();
    } catch (error) {
      console.error('[LangGraph] Active executions error:', error);
      throw error;
    }
  }

  /**
   * Validate workflow
   */
  async validateWorkflow(nodes: any[], edges: any[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/langgraph/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed`);
      }

      return response.json();
    } catch (error) {
      console.error('[LangGraph] Validation error:', error);
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

/**
 * Global LangGraph client instance
 */
export const langGraphClient = new AdvancedLangGraphClient();
