import EventSource = require('eventsource');
import fetch from 'node-fetch';

async function testSSEConnection() {
    const baseUrl = 'http://localhost:3001/api/mcp';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer falkordb_mcp_server_key_2024'
    };

    // Create SSE connection
    console.log('Establishing SSE connection...');
    const eventSource = new EventSource(`${baseUrl}/stream`, {
        headers: {
            'Authorization': 'Bearer falkordb_mcp_server_key_2024'
        }
    });

    // Set up event listeners
    eventSource.onopen = () => {
        console.log('SSE Connection opened');
    };

    eventSource.onerror = (error: any) => {
        console.error('SSE Error:', error);
    };

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('\nReceived SSE event:', JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error parsing SSE event:', error);
        }
    };

    // After connection is established, send a query that will trigger events
    setTimeout(async () => {
        try {
            console.log('\nSending query to trigger events...');
            const response = await fetch(`${baseUrl}/context`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    query: 'MATCH (n:Industry) RETURN n.Name as industry ORDER BY industry',
                    graphName: 'Ecosided_Graph'
                })
            });

            if (!response.ok) {
                throw new Error(`Query failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('\nQuery result:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Error sending query:', error);
        }
    }, 1000);

    // Keep the connection open for a while to receive events
    setTimeout(() => {
        console.log('\nClosing SSE connection...');
        eventSource.close();
        process.exit(0);
    }, 5000);
}

testSSEConnection(); 