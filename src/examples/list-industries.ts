import { FalkorDBMCPClient } from './FalkorDBMCPClient';
import { config } from '../config';
import axios from 'axios';

interface Graph {
  name: string;
  type: string;
  directed: boolean;
}

async function main() {
  try {
    // Get list of available graphs
    console.log('Getting list of available graphs...');
    const graphsResponse = await axios.get('http://localhost:3001/api/mcp/graphs', {
      headers: {
        'Authorization': `Bearer ${config.server.apiKey}`
      }
    });

    console.log('\nAvailable graphs:');
    if (graphsResponse.data.data && Array.isArray(graphsResponse.data.data)) {
      graphsResponse.data.data.forEach((graph: Graph, index: number) => {
        console.log(`${index + 1}. ${graph.name} (${graph.type}, ${graph.directed ? 'directed' : 'undirected'})`);
      });
    } else {
      console.log('No graphs found or error in response:', JSON.stringify(graphsResponse.data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error); 