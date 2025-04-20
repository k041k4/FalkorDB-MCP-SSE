import { createClient } from 'redis';
import { config } from '../config';

export interface GraphQueryResult {
  headers: string[];
  data: any[][];
  metadata: string[];
}

export class FalkorDBService {
  private client: any;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: `redis://${config.falkorDB.host}:${config.falkorDB.port}`,
      username: config.falkorDB.username,
      password: config.falkorDB.password
    });

    this.client.on('error', (err: Error) => {
      console.error('FalkorDB connection error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Connected to FalkorDB');
      this.isConnected = true;
    });
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async close() {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  async executeRawCommand(command: string[]): Promise<any> {
    await this.connect();
    try {
      return await this.client.sendCommand(command);
    } catch (error) {
      console.error('Error executing raw command:', error);
      throw error;
    }
  }

  async executeQuery(query: string, parameters: any = {}, graphName: string = 'default'): Promise<GraphQueryResult> {
    await this.connect();
    try {
      // Use Redis Graph's query method
      const result = await this.client.graph.query(graphName, query, parameters);
      return {
        headers: result.headers || [],
        data: result.data || [],
        metadata: result.metadata || []
      };
    } catch (error) {
      console.error(`Error executing query on graph ${graphName}:`, error);
      throw error;
    }
  }

  async listGraphs() {
    await this.connect();
    try {
      // Use Redis Graph's list method to get all graphs
      const graphs = await this.client.graph.list();
      return graphs.map((name: string) => ({
        name,
        type: 'property',
        directed: true
      }));
    } catch (error) {
      console.error('Error listing graphs:', error);
      throw error;
    }
  }

  async getResources(graphName: string = 'default') {
    await this.connect();
    try {
      const graphs = await this.listGraphs();
      const [nodeCount, relationshipCount] = await Promise.all([
        this.getNodeCount(graphName),
        this.getRelationshipCount(graphName)
      ]);

      return {
        graphs,
        nodes: nodeCount,
        relationships: relationshipCount
      };
    } catch (error) {
      console.error(`Error getting resources for graph ${graphName}:`, error);
      throw error;
    }
  }

  private async getNodeCount(graphName: string = 'default'): Promise<number> {
    const result = await this.executeQuery('MATCH (n) RETURN count(n) as count', {}, graphName);
    return result.data[0]?.[0] || 0;
  }

  private async getRelationshipCount(graphName: string = 'default'): Promise<number> {
    const result = await this.executeQuery('MATCH ()-[r]->() RETURN count(r) as count', {}, graphName);
    return result.data[0]?.[0] || 0;
  }

  async getMetadata() {
    await this.connect();
    try {
      const info = await this.client.info();
      return {
        provider: 'FalkorDB',
        version: info?.server?.redis_version || 'unknown',
        capabilities: [
          'graph.query',
          'graph.list',
          'node.properties',
          'relationship.properties'
        ],
        graphTypes: ['property', 'directed'],
        queryLanguages: ['cypher'],
        redisMode: info?.server?.redis_mode || 'standalone'
      };
    } catch (error) {
      console.error('Error getting metadata:', error);
      return {
        provider: 'FalkorDB',
        version: 'unknown',
        capabilities: [
          'graph.query',
          'graph.list',
          'node.properties',
          'relationship.properties'
        ],
        graphTypes: ['property', 'directed'],
        queryLanguages: ['cypher'],
        redisMode: 'unknown'
      };
    }
  }
}

export const falkorDBService = new FalkorDBService();