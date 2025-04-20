import EventSource from 'eventsource';
import { config } from '../config';

interface GraphInfo {
  name: string;
  type: string;
  directed: boolean;
}

interface QueryResponse {
  type: string;
  status: string;
  data: {
    headers: string[];
    data: GraphInfo[][];
    metadata: string[];
  };
}

const BASE_URL = `http://localhost:${config.port}/api/mcp`;

async function testSSEConnection() {
  console.log('Testing SSE connection to MCP server...');
  
  // Create SSE connection
  const eventSource = new EventSource(`${BASE_URL}/stream`, {
    headers: {
      'Authorization': `Bearer ${config.apiKey}`
    }
  });

  // Handle connection open
  eventSource.onopen = () => {
    console.log('SSE connection opened');
    
    // Send query to get default graph information
    const query = {
      query: 'MATCH (n) RETURN DISTINCT labels(n) as labels LIMIT 1',
      parameters: {}
    };

    // Send query via POST request
    fetch(`${BASE_URL}/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(query)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json() as Promise<QueryResponse>;
    })
    .then(data => {
      console.log('Query response:', data);
      console.log('\nDefault graph information:');
      console.log('------------------------');
      console.log('Default graph from config:', config.falkorDB.defaultGraph);
      console.log('Default graph from env:', process.env.MCP_DEFAULT_GRAPH);
      console.log('Sample node labels from graph:', data.data.data);
    })
    .catch(error => {
      console.error('Error sending query:', error);
    });
  };

  // Handle SSE events
  eventSource.onmessage = (event: MessageEvent) => {
    console.log('Received SSE event:', event.data);
  };

  // Handle errors
  eventSource.onerror = (error: Event) => {
    console.error('SSE connection error:', error);
    eventSource.close();
  };

  // Keep connection open for 10 seconds
  setTimeout(() => {
    console.log('Closing SSE connection...');
    eventSource.close();
  }, 10000);
}

// Run the test
testSSEConnection().catch(console.error); 