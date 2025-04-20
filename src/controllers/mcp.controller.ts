import { Request, Response } from 'express';
import { falkorDBService } from '../services/falkordb.service';
import { eventEmitter } from '../index';
import { EventEmitter } from 'events';
import { config } from '../config';

import { 
  MCPContextRequest, 
  MCPResponse, 
  MCPProviderMetadata 
} from '../models/mcp.types';

export class MCPController {
  constructor() {}

  /**
   * Health check endpoint
   */
  healthCheck(req: Request, res: Response) {
    res.json({ status: 'ok' });
  }

  /**
   * Process MCP context requests
   */
  async processContextRequest(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    try {
      const { query, params } = req.body;
      const graphName = process.env.MCP_DEFAULT_GRAPH || config.falkorDB.defaultGraph;
      const result = await falkorDBService.executeQuery(query, params, graphName);
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
      const graphName = process.env.MCP_DEFAULT_GRAPH || config.falkorDB.defaultGraph;
      const result = await falkorDBService.executeQuery(query, params, graphName);
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

  async getResources(req: Request, res: Response): Promise<void> {
    try {
      const graphName = process.env.MCP_DEFAULT_GRAPH || config.falkorDB.defaultGraph;
      const query = 'MATCH (n) RETURN DISTINCT labels(n) as labels';
      const result = await falkorDBService.executeQuery(query, {}, graphName);
      res.json(result);
    } catch (error) {
      console.error('Error getting resources:', error);
      res.status(500).json({ error: 'Failed to get resources' });
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
                description: `Name of the graph to query (default: "${process.env.MCP_DEFAULT_GRAPH || config.falkorDB.defaultGraph}")`
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
                description: `Name of the graph to get resources for (default: "${process.env.MCP_DEFAULT_GRAPH || config.falkorDB.defaultGraph}")`
              }
            }
          }
        }
      ]
    });
  }

  async getContext(req: Request, res: Response) {
    try {
      const { query, parameters = {} } = req.body;
      const graphName = process.env.MCP_DEFAULT_GRAPH || config.falkorDB.defaultGraph;
      
      if (!query) {
        return res.status(400).json({
          type: 'context',
          status: 'error',
          error: 'Query is required'
        });
      }

      const result = await falkorDBService.executeQuery(query, parameters, graphName);
      
      // Emit the result as an SSE event
      eventEmitter.emit('mcpEvent', {
        type: 'query_result',
        status: 'success',
        data: result
      });

      res.json({
        type: 'context',
        status: 'success',
        data: result
      });
    } catch (error) {
      const errorResponse = {
        type: 'context',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      // Emit the error as an SSE event
      eventEmitter.emit('mcpEvent', {
        type: 'query_error',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(errorResponse);
    }
  }

  async executeQuery(req: Request, res: Response) {
    try {
      const { query, parameters = {} } = req.body;
      const graphName = process.env.MCP_DEFAULT_GRAPH || config.falkorDB.defaultGraph;
      
      if (!query) {
        return res.status(400).json({
          type: 'query',
          status: 'error',
          error: 'Query is required'
        });
      }

      const result = await falkorDBService.executeQuery(query, parameters, graphName);
      res.json({
        type: 'query',
        status: 'success',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        type: 'query',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async processQuery(query: string, context: any = {}, graphName: string = process.env.MCP_DEFAULT_GRAPH || config.falkorDB.defaultGraph) {
    const result = await falkorDBService.executeQuery(query, context, graphName);
    return {
      headers: result.headers,
      data: result.data,
      metadata: result.metadata
    };
  }
}

export const mcpController = new MCPController();