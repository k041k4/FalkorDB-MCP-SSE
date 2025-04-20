import { env } from './env';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: env.port,
  falkorDB: {
    host: env.falkorDB.host,
    port: env.falkorDB.port,
    username: env.falkorDB.username,
    password: env.falkorDB.password,
    // Redis Graph specific settings
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    // Default graph name if not specified
    defaultGraph: env.falkorDB.defaultGraph
  },
  apiKey: env.apiKey,
  cors: {
    origin: env.cors.origin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  server: {
    baseUrl: process.env.MCP_SERVER_URL || 'http://localhost:3000',
    apiKey: process.env.MCP_API_KEY || 'falkordb_mcp_server_key_2024'
  }
}; 