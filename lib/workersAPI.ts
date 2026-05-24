// API client for calling the workers service
const WORKERS_BASE_URL = process.env.NEXT_PUBLIC_WORKERS_URL || 'http://localhost:3001';

export class WorkersAPI {
  private baseURL: string;

  constructor(baseURL: string = WORKERS_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async runAgent(
    agentData: {
      agentId?: string;
      nodes: any[];
      edges: any[];
      input: Record<string, any>;
      apiKeys: Record<string, any>;
      agentName?: string;
    },
    token: string
  ) {
    return this.request('/api/agent-run', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(agentData),
    });
  }

  async getHealth() {
    return this.request('/health');
  }
}

export const workersAPI = new WorkersAPI();
