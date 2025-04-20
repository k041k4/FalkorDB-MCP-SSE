import { config } from '../config';
import request from 'supertest';
import { app } from '../app';
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

describe('FalkorDB MCP Server Tests', () => {
  it('should return health check', async () => {
    const response = await request(app)
      .get('/api/mcp/health')
      .set('Authorization', `Bearer ${config.apiKey}`)
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok'
    });
  });

  test('Authentication', async () => {
    // Test without API key
    const response1 = await request(app)
      .get('/api/mcp/health')
      .expect(401);

    // Test with invalid API key
    const response2 = await request(app)
      .get('/api/mcp/health')
      .set('Authorization', 'Bearer invalid-key')
      .expect(401);

    // Test with valid API key
    const response3 = await request(app)
      .get('/api/mcp/health')
      .set('Authorization', `Bearer ${config.apiKey}`)
      .expect(200);

    expect(response3.body).toEqual({
      status: 'ok'
    });
  });

  test('Get Capabilities', async () => {
    const response = await request(app)
      .get('/api/mcp/capabilities')
      .set('Authorization', `Bearer ${config.apiKey}`)
      .expect(200);

    expect(response.body.capabilities).toBeDefined();
    expect(response.body.capabilities).toMatchObject({
      context: true,
      metadata: true,
      streaming: true,
      tools: true,
      resources: true
    });
  });

  test('Get Tools', async () => {
    const response = await request(app)
      .get('/api/mcp/tools')
      .set('Authorization', `Bearer ${config.apiKey}`)
      .expect(200);

    expect(response.body.tools).toBeDefined();
    expect(Array.isArray(response.body.tools)).toBe(true);
    expect(response.body.tools.length).toBeGreaterThan(0);
  });

  test('Get Metadata', async () => {
    const response = await request(app)
      .get('/api/mcp/metadata')
      .set('Authorization', `Bearer ${config.apiKey}`)
      .expect(200);

    expect(response.body.type).toBe('metadata');
    expect(response.body.status).toBe('success');
  });

  test('List Graphs', async () => {
    const response = await request(app)
      .get('/api/mcp/graphs')
      .set('Authorization', `Bearer ${config.apiKey}`)
      .expect(200);

    expect(response.body.type).toBe('graphs');
    expect(response.body.status).toBe('success');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('Streaming Context Request', async () => {
    const response = await request(app)
      .get('/api/mcp/context/stream')
      .set('Authorization', `Bearer ${config.apiKey}`)
      .expect(200);

    expect(response.headers['content-type']).toBe('text/event-stream');
    expect(response.headers['cache-control']).toBe('no-cache');
    expect(response.headers['connection']).toBe('keep-alive');
  });

  test('Error Handling', async () => {
    const response = await request(app)
      .post('/api/mcp/context')
      .set('Authorization', `Bearer ${config.apiKey}`)
      .send({
        query: 'INVALID QUERY'
      })
      .expect(500);

    expect(response.body.status).toBe('error');
    expect(response.body.error).toBeDefined();
  });

  test('should process context request', async () => {
    const response = await request(app)
      .post('/api/mcp/context')
      .set('Authorization', `Bearer ${config.apiKey}`)
      .send({ query: 'MATCH (n) RETURN count(n) as count' })
      .expect(200);

    expect(response.body).toHaveProperty('type', 'context');
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('data');
  });

  test('should process metadata request', async () => {
    const response = await request(app)
      .get('/api/mcp/metadata')
      .set('Authorization', `Bearer ${config.apiKey}`)
      .expect(200);

    expect(response.body).toHaveProperty('type', 'metadata');
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('data');
  });

  test('should get capabilities', async () => {
    const response = await request(app)
      .get('/api/mcp/capabilities')
      .set('Authorization', `Bearer ${config.apiKey}`)
      .expect(200);

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
      .get('/api/mcp/tools')
      .set('Authorization', `Bearer ${config.apiKey}`)
      .expect(200);

    expect(response.body).toHaveProperty('tools');
    expect(Array.isArray(response.body.tools)).toBe(true);
    expect(response.body.tools.length).toBeGreaterThan(0);
  });
}); 