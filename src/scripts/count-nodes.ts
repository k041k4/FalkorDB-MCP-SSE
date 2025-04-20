import { falkorDBService } from '../services/falkordb.service';

async function countNodes() {
  try {
    await falkorDBService.connect();
    const result = await falkorDBService.executeQuery('MATCH (n) RETURN count(n) as nodeCount', {}, 'Ecosided_Graph');
    console.log('Query result:', result);
    if (result && typeof result === 'object') {
      console.log('Full response:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await falkorDBService.close();
  }
}

countNodes(); 