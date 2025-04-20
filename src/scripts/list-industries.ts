import fetch from 'node-fetch';

interface QueryResponse {
    type: string;
    status: string;
    data: {
        headers: string[];
        data: string[][];
        metadata: string[];
    };
}

async function listIndustries() {
    const baseUrl = 'http://localhost:3001/api/mcp';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer falkordb_mcp_server_key_2024'
    };

    try {
        console.log('Sending query to MCP server...');
        const response = await fetch(`${baseUrl}/context`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query: 'MATCH (n:Industry) RETURN n.Name as industry ORDER BY industry',
                graphName: 'Ecosided_Graph'
            })
        });

        if (!response.ok) {
            throw new Error(`Query failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json() as QueryResponse;
        
        console.log('\nIndustries in Ecosided_Graph:');
        if (result.data?.data) {
            result.data.data.forEach((row) => {
                if (row[0]) console.log(`- ${row[0]}`);
            });
            console.log(`\nTotal number of industries: ${result.data.data.length}`);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

listIndustries(); 