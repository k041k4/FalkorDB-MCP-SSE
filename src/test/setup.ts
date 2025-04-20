// Prevent main server from starting during tests
process.env.SKIP_MAIN_SERVER = 'true';
process.env.NODE_ENV = 'test';

import { Server } from 'http';
import { app } from '../app';
import { config } from '../config';
import { falkorDBService } from '../services/falkordb.service';
import { config as dotenvConfig } from 'dotenv';
import { afterAll, beforeAll, jest } from '@jest/globals';

// Load environment variables from .env file
dotenvConfig();

// Use a different port for tests
const TEST_PORT = 3001;

// Override config for testing
config.port = TEST_PORT.toString();
config.falkorDB.host = 'localhost';
config.falkorDB.port = 6379;
config.falkorDB.username = 'default';
config.falkorDB.password = '';
config.apiKey = 'test-api-key';

// Global server instance
let server: Server | null = null;

// Start test server
beforeAll(async () => {
  // Close any existing server
  if (server) {
    await new Promise<void>((resolve) => server?.close(() => resolve()));
  }

  // Start new server
  server = app.listen(TEST_PORT, () => {
    console.log(`Test server running on port ${TEST_PORT}`);
  });
});

// Cleanup after all tests
afterAll(async () => {
  try {
    if (server) {
      await new Promise<void>((resolve) => server?.close(() => resolve()));
      server = null;
    }
    await falkorDBService.close();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
});

// Set default timeout for all tests
jest.setTimeout(10000);

// Mock console methods to keep test output clean
const originalConsole = { ...console };
global.console = {
  ...console,
  // Uncomment these if you want to suppress specific console methods during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
}; 