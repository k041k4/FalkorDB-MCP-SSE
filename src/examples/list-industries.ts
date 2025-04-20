import { FalkorDBMCPClient } from '../FalkorDBMCPClient';
import { config } from '../config';

async function main() {
  const client = new FalkorDBMCPClient(config.server.baseUrl, config.server.apiKey);

  try {
    // Connect to the MCP server
    console.log('Connecting to MCP server...');
    await client.connect();

    // Set up event listeners
    client.on('message', (data) => {
      console.log('Received message:', data);
    });

    client.on('error', (error) => {
      console.error('Error:', error);
    });

    // Send a query to list industries
    console.log('Sending query to list industries...');
    const query = {
      query: 'MATCH (i:Industry) RETURN i.Name as industry ORDER BY industry',
      graphName: 'Ecosided_Graph'
    };

    const response = await client.sendQuery(query);
    console.log('Query result:', response);

    // Keep the connection open for a while to receive any additional events
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect from the MCP server
    client.disconnect();
  }
}

main().catch(console.error); 