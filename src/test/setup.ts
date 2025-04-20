// Prevent main server from starting during tests
process.env.SKIP_MAIN_SERVER = 'true';
process.env.NODE_ENV = 'test';

import { Server } from 'http';
import { app } from '../index';
import { config } from '../config';
import { falkorDBService } from '../services/falkordb.service';

// Use a different port for tests
const TEST_PORT = 3001;

// Override config for testing
config.port = TEST_PORT.toString();
config.falkorDB.host = 'localhost';
config.falkorDB.port = 6379;
config.falkorDB.username = 'default';
config.falkorDB.password = '';
config.apiKey = 'test_api_key';

// Start test server
const server: Server = app.listen(TEST_PORT, () => {
  console.log(`Test server running on port ${TEST_PORT}`);
});

// Close server after tests
afterAll(() => {
  return new Promise<void>((resolve, reject) => {
    try {
      // Close database connection
      falkorDBService.close().then(() => {
        // Close server
        server.close(() => {
          console.log('Test server closed');
          resolve();
        });
      }).catch(error => {
        console.error('Error closing database:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Error during cleanup:', error);
      reject(error);
    }
  });
}); 