import { falkorDBService } from '../services/falkordb.service';

async function listIndustries() {
    try {
        // Connect to FalkorDB
        await falkorDBService.connect();
        console.log('Connected to FalkorDB');

        // Get all industries ordered by name
        const query = 'MATCH (n:Industry) RETURN n.Name as industry ORDER BY industry';
        const result = await falkorDBService.executeRawCommand(['GRAPH.QUERY', 'Ecosided_Graph', query]);
        
        console.log('\nIndustries in Ecosided_Graph:');
        if (result[1] && Array.isArray(result[1])) {
            result[1].forEach((row: any[]) => {
                if (row[0]) console.log(`- ${row[0]}`);
            });
        }
        
        console.log(`\nTotal number of industries: ${result[1]?.length || 0}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close the connection
        await falkorDBService.close();
        console.log('Disconnected from FalkorDB');
    }
}

listIndustries(); 