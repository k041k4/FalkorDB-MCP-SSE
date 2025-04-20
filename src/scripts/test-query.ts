import fetch from 'node-fetch';

async function testQuery() {
    const baseUrl = 'http://localhost:3000/api/mcp';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer falkordb_mcp_server_key_2024'
    };

    try {
        // First check server health
        console.log('Checking server health...');
        const healthResponse = await fetch(`${baseUrl}/health`, {
            method: 'GET',
            headers
        });

        if (!healthResponse.ok) {
            throw new Error(`Health check failed! status: ${healthResponse.status}`);
        }

        const healthData = await healthResponse.json();
        console.log('Server health:', JSON.stringify(healthData, null, 2));

        // Then list available graphs
        console.log('\nListing available graphs...');
        const graphsResponse = await fetch(`${baseUrl}/graphs`, {
            method: 'GET',
            headers
        });

        if (!graphsResponse.ok) {
            throw new Error(`Failed to list graphs! status: ${graphsResponse.status}`);
        }

        const graphsData = await graphsResponse.json();
        console.log('Available graphs:', JSON.stringify(graphsData, null, 2));

        // Finally, execute the query
        console.log('\nSending query to MCP server...');
        const queryResponse = await fetch(`${baseUrl}/context`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query: 'MATCH (n) RETURN count(n) as count',
                graphName: 'Ecosided_Graph'
            })
        });

        if (!queryResponse.ok) {
            const errorText = await queryResponse.text();
            throw new Error(`Query failed! status: ${queryResponse.status}, error: ${errorText}`);
        }

        const queryData = await queryResponse.json();
        console.log('Query result:', JSON.stringify(queryData, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testQuery(); 