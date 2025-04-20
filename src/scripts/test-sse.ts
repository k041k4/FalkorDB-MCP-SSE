import EventSource = require('eventsource');

interface SSEEvent {
    data: string;
}

async function testSSE() {
    const url = 'http://localhost:3000/api/mcp/stream';
    const eventSource = new EventSource(url);

    console.log('Connecting to SSE endpoint...');

    eventSource.onopen = () => {
        console.log('SSE Connection opened');
    };

    eventSource.onmessage = (event: SSEEvent) => {
        console.log('Received message:', event.data);
    };

    eventSource.onerror = (error: Event) => {
        console.error('SSE Error:', error);
        eventSource.close();
    };

    // After connecting, make a request to list graphs
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer falkordb_mcp_server_key_2024'
    };

    // First, let's get the list of graphs
    try {
        const graphsResponse = await fetch('http://localhost:3000/api/mcp/graphs', {
            method: 'GET',
            headers
        });

        const graphsData = await graphsResponse.json();
        console.log('\nAvailable graphs:', JSON.stringify(graphsData, null, 2));

        // Then, let's try to get the labels for Ecosided_Graph
        const body = {
            query: 'CALL db.labels()',
            graphName: 'Ecosided_Graph'
        };

        const labelsResponse = await fetch('http://localhost:3000/api/mcp/context', {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        const labelsData = await labelsResponse.json();
        console.log('\nGraph labels response:', JSON.stringify(labelsData, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }

    // Keep the connection open for a while to receive any events
    setTimeout(() => {
        console.log('\nClosing SSE connection...');
        eventSource.close();
    }, 5000);
}

testSSE(); 