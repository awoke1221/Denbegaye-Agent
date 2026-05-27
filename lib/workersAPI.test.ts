import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { WorkersAPI } from '../lib/workersAPI';

// Mock fetch
(global as any).fetch = jest.fn();

describe('WorkersAPI', () => {
  const mockFetch = jest.mocked(fetch as unknown as jest.MockedFunction<typeof fetch>);
  let api: WorkersAPI;

  beforeEach(() => {
    jest.clearAllMocks();
    api = new WorkersAPI('https://test-worker-api.com');
  });

  describe('constructor', () => {
    it('uses provided base URL', () => {
      const customApi = new WorkersAPI('https://custom-url.com');
      expect(customApi).toBeInstanceOf(WorkersAPI);
    });

    it('uses default base URL when none provided', () => {
      const defaultApi = new WorkersAPI();
      expect(defaultApi).toBeInstanceOf(WorkersAPI);
    });
  });

  describe('runAgent', () => {
    const mockAgentData = {
      agentId: 'agent-123',
      nodes: [{ id: 'node1', type: 'memory', config: {} }],
      edges: [],
      input: { test: 'data' },
      apiKeys: { openai: 'sk-123' },
      agentName: 'Test Agent',
    };

    it('makes successful API call', async () => {
      const mockResponse = { executionId: 'exec-123', reused: false };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await api.runAgent(mockAgentData, 'test-token');

      expect(mockFetch).toHaveBeenCalledWith('https://test-worker-api.com/api/agent-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify(mockAgentData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('throws error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(api.runAgent(mockAgentData, 'test-token')).rejects.toThrow(
        'API request failed: Internal Server Error'
      );
    });
  });

  describe('getHealth', () => {
    it('makes health check request', async () => {
      const mockResponse = { status: 'ok' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await api.getHealth();

      expect(mockFetch).toHaveBeenCalledWith('https://test-worker-api.com/health', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('throws error on health check failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Service Unavailable',
      } as Response);

      await expect(api.getHealth()).rejects.toThrow('API request failed: Service Unavailable');
    });
  });
});
