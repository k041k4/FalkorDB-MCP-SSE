import { Request, Response } from 'express';
import { falkorDBService } from '../services/falkordb.service';
import { eventEmitter } from '../index';
import { EventEmitter } from 'events';

import { 
  MCPContextRequest, 
  MCPResponse, 
  MCPProviderMetadata 
} from '../models/mcp.types';

export class MCPController {
  constructor() {}

  /**
   * Process MCP context requests
   */
  async processContextRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    try {
      const { query, params } = req.body;
      const result = await falkorDBService.executeQuery(query, params);
      return res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: 'An unknown error occurred' });
    }
  }

  /**
   * Process MCP metadata requests
   */
  async processMetadataRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    try {
      const { query, params } = req.body;
      const result = await falkorDBService.executeQuery(query, params);
      return res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: 'An unknown error occurred' });
    }
  }

  /**
   * List available graphs in FalkorDB
   */
  async listGraphs(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    try {
      const graphs = await falkorDBService.listGraphs();
      return res.json({
        type: 'graphs',
        status: 'success',
        data: graphs
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: 'An unknown error occurred' });
    }
  }

  async getCapabilities(req: Request, res: Response) {
    res.json({
      status: 'success',
      version: '1.0.0',
      protocol: 'StreamableHTTP',
      capabilities: {
        context: true,
        metadata: true,
        tools: true,
        resources: true,
        streaming: true,
        graphs: true
      }
    });
  }

  async getMetadata(req: Request, res: Response) {
    try {
      const metadata = await falkorDBService.getMetadata();
      res.json({
        type: 'metadata',
        status: 'success',
        data: metadata
      });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to get metadata' });
    }
  }

  async getResources(req: Request, res: Response) {
    try {
      const { graphName = 'default' } = req.query;
      const resources = await falkorDBService.getResources(graphName as string);
      res.json({
        type: 'resources',
        status: 'success',
        data: resources
      });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Failed to get resources' });
    }
  }

  async getTools(req: Request, res: Response) {
    res.json({
      status: 'success',
      tools: [
        {
          name: 'executeQuery',
          description: 'Execute a Cypher query against FalkorDB',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The Cypher query to execute'
              },
              parameters: {
                type: 'object',
                description: 'Query parameters'
              },
              graphName: {
                type: 'string',
                description: 'Name of the graph to query (default: "default")'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'getMetadata',
          description: 'Get metadata about the FalkorDB instance',
          parameters: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'listGraphs',
          description: 'List all available graphs',
          parameters: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'getResources',
          description: 'Get resources for a specific graph',
          parameters: {
            type: 'object',
            properties: {
              graphName: {
                type: 'string',
                description: 'Name of the graph to get resources for (default: "default")'
              }
            }
          }
        }
      ]
    });
  }

  async handleContextRequest(req: Request, res: Response) {
    try {
      const { query, context, graphName = 'default' } = req.body;
      
      // Emit initial processing event
      eventEmitter.emit('mcpEvent', {
        type: 'context',
        status: 'processing',
        data: { query, graphName }
      });

      // Process the query and context
      const result = await this.processQuery(query, context, graphName);

      // Emit completion event
      eventEmitter.emit('mcpEvent', {
        type: 'context',
        status: 'success',
        data: result
      });

      res.json({
        type: 'context',
        status: 'success',
        data: result
      });
    } catch (error: any) {
      // Emit error event
      eventEmitter.emit('mcpEvent', {
        type: 'error',
        status: 'error',
        error: error?.message || 'An unknown error occurred'
      });

      res.status(500).json({ error: error?.message || 'An unknown error occurred' });
    }
  }

  private async processQuery(query: string, context: any = {}, graphName: string = 'default') {
    const result = await falkorDBService.executeQuery(query, context, graphName);
    return {
      headers: result.headers,
      data: result.data,
      metadata: result.metadata
    };
  }
}

export const mcpController = new MCPController();