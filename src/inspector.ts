import axios from 'axios';

async function main() {
  try {
    console.log('Getting metadata...');
    const metadataResponse = await axios.get('http://localhost:3001/api/mcp/metadata', {
      headers: {
        'Authorization': 'Bearer falkordb_mcp_server_key_2024',
        'X-API-Key': 'falkordb_mcp_server_key_2024'
      }
    });
    console.log('Metadata:', metadataResponse.data);

    console.log('\nListing graphs...');
    const graphsResponse = await axios.get('http://localhost:3001/api/mcp/graphs', {
      headers: {
        'Authorization': 'Bearer falkordb_mcp_server_key_2024',
        'X-API-Key': 'falkordb_mcp_server_key_2024'
      }
    });
    console.log('Graphs:', graphsResponse.data);
  } catch (error) {
    console.error('Error during inspection:', error);
  }
}

main(); 