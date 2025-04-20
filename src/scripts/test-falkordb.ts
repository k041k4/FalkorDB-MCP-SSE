import { falkorDBService } from '../services/falkordb.service';

async function testFalkorDB() {
  try {
    console.log('Testing FalkorDB Service...');
    
    // Test connection
    await falkorDBService.connect();
    console.log('Successfully connected to FalkorDB');

    // Test listing graphs
    console.log('\nListing available graphs:');
    const graphs = await falkorDBService.listGraphs();
    console.log(JSON.stringify(graphs, null, 2));

    // Test node count on Ecosided_Graph
    console.log('\nTesting node count on Ecosided_Graph:');
    const nodeCount = await falkorDBService.executeQuery(
      'MATCH (n) RETURN count(n) as count',
      {},
      'Ecosided_Graph'
    );
    console.log('Node count result:', JSON.stringify(nodeCount, null, 2));

    // Test node count on default graph
    console.log('\nTesting node count on default graph:');
    const defaultNodeCount = await falkorDBService.executeQuery(
      'MATCH (n) RETURN count(n) as count'
    );
    console.log('Default graph node count:', JSON.stringify(defaultNodeCount, null, 2));

    // Test getting resources for Ecosided_Graph
    console.log('\nTesting getResources for Ecosided_Graph:');
    const resources = await falkorDBService.getResources('Ecosided_Graph');
    console.log('Resources:', JSON.stringify(resources, null, 2));

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await falkorDBService.close();
    console.log('\nTest completed');
  }
}

testFalkorDB(); 