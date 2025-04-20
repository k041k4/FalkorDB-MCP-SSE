import axios from 'axios';
import EventSource = require('eventsource');
import { config } from '../config';
import request from 'supertest';
import { app } from '../index';
import { Server } from 'http';
import { MCPResponse as BaseMCPResponse } from '../models/mcp.types';

interface MCPResponse extends BaseMCPResponse {
  status: string;
  version: string;
  protocol: string;
  capabilities: {
    context: boolean;
    metadata: boolean;
    streaming: boolean;
    tools: boolean;
    resources: boolean;
  };
  type?: string;
  error?: string;
  tools?: Array<{
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
    };
  }>;
}

const BASE_URL = `http://localhost:${config.port}`;
const MCP_BASE_URL = `${BASE_URL}/api/mcp`;

describe('FalkorDB MCP Server Tests', () => {
  let eventSource: (EventSource & { close: () => void }) | null = null;

  beforeAll(async () => {
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(() => {
    if (eventSource) {
      eventSource.close();
    }
  });

  test('Health Check', async () => {
    const response = await axios.get<MCPResponse>(`${MCP_BASE_URL}/health`);
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('ok');
  });

  test('Authentication', async () => {
    // Test without API key
    const response1 = await axios.get(`${MCP_BASE_URL}/health`, {
      validateStatus: (status) => status === 401
    });
    expect(response1.status).toBe(401);

    // Test with invalid API key
    const response2 = await axios.get(`${MCP_BASE_URL}/health`, {
      headers: { Authorization: 'Bearer invalid_key' },
      validateStatus: (status) => status === 401
    });
    expect(response2.status).toBe(401);

    // Test with valid API key
    const response3 = await axios.get<MCPResponse>(`${MCP_BASE_URL}/health`, {
      headers: { Authorization: `Bearer ${config.apiKey}` }
    });
    expect(response3.status).toBe(200);
  });

  test('Get Capabilities', async () => {
    const response = await axios.get<MCPResponse>(`${MCP_BASE_URL}/capabilities`);
    expect(response.status).toBe(200);
    expect(response.data.capabilities).toBeDefined();
    expect(response.data.capabilities?.context).toBe(true);
    expect(response.data.capabilities?.streaming).toBe(true);
  });

  test('Get Tools', async () => {
    const response = await axios.get<MCPResponse>(`${MCP_BASE_URL}/tools`);
    expect(response.status).toBe(200);
    expect(response.data.tools).toBeDefined();
    expect(Array.isArray(response.data.tools)).toBe(true);
    expect(response.data.tools?.length).toBeGreaterThan(0);
  });

  test('Get Metadata', async () => {
    const response = await axios.get<MCPResponse>(`${MCP_BASE_URL}/metadata`);
    expect(response.status).toBe(200);
    expect(response.data.type).toBe('metadata');
    expect(response.data.status).toBe('success');
    expect(response.data.data?.provider).toBe('FalkorDB');
  });

  test('List Graphs', async () => {
    const response = await axios.get<MCPResponse>(`${MCP_BASE_URL}/graphs`);
    expect(response.status).toBe(200);
    expect(response.data.type).toBe('graphs');
    expect(response.data.status).toBe('success');
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  test('Streaming Context Request', async () => {
    return new Promise<void>((resolve, reject) => {
      const events: MCPResponse[] = [];
      
      try {
        eventSource = new EventSource(`${MCP_BASE_URL}/stream`, {
          headers: {
            'Authorization': `Bearer ${process.env.MCP_API_KEY}`
          }
        }) as EventSource & { close: () => void };
        
        if (!eventSource) {
          reject(new Error('Failed to create EventSource'));
          return;
        }

        const timeout = setTimeout(() => {
          eventSource?.close();
          reject(new Error('Test timeout'));
        }, 10000); // Increased timeout to 10 seconds

        eventSource.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data) as MCPResponse;
            events.push(data);
            
            // Check for any context-related event
            if (data.type === 'context') {
              if (data.status === 'success') {
                expect(data.data).toBeDefined();
                clearTimeout(timeout);
                eventSource?.close();
                resolve();
              } else if (data.status === 'error') {
                clearTimeout(timeout);
                eventSource?.close();
                reject(new Error(data.error || 'Unknown error'));
              }
            }
          } catch (error) {
            clearTimeout(timeout);
            eventSource?.close();
            reject(error);
          }
        };

        eventSource.onerror = (error: Event) => {
          clearTimeout(timeout);
          eventSource?.close();
          reject(error);
        };

        // Send a test query
        axios.post(`${MCP_BASE_URL}/context`, {
          query: 'MATCH (n) RETURN count(n) as count',
          parameters: {}
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.MCP_API_KEY}`
          }
        }).catch(error => {
          clearTimeout(timeout);
          eventSource?.close();
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  });

  test('Error Handling', async () => {
    expect.assertions(2);
    try {
      await axios.post(`${MCP_BASE_URL}/context`, {
        query: 'INVALID QUERY',
        parameters: {}
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.MCP_API_KEY}`
        }
      });
      throw new Error('Expected request to fail');
    } catch (error: any) {
      // Check if it's an axios error with a response
      if (error.isAxiosError && error.response) {
        expect(error.response.status).toBe(500);
        expect(error.response.data).toHaveProperty('error');
      } else {
        // Re-throw if it's not the expected error type
        throw error;
      }
    }
  });

  // SuperTest tests
  test('should process context request', async () => {
    const response = await request(app)
      .post('/api/mcp/context')
      .send({ query: 'test' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('type', 'context');
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('data');
  });

  test('should process metadata request', async () => {
    const response = await request(app)
      .get('/api/mcp/metadata');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('type', 'metadata');
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('provider', 'FalkorDB');
  });

  test('should get capabilities', async () => {
    const response = await request(app)
      .get('/api/mcp/capabilities');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('capabilities');
    expect(response.body.capabilities).toMatchObject({
      context: true,
      metadata: true,
      streaming: true,
      tools: true,
      resources: true
    });
  });

  test('should get tools', async () => {
    const response = await request(app)
      .get('/api/mcp/tools');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tools');
    expect(Array.isArray(response.body.tools)).toBe(true);
    expect(response.body.tools.length).toBeGreaterThan(0);
  });
}); 