import dotenv from 'dotenv';
import { Config, ConfigType } from '../types/config';

// Load environment variables from .env file
dotenv.config();

export const config: ConfigType = {
  port: process.env.PORT || '3000',
  falkorDB: {
    host: process.env.FALKORDB_HOST || 'localhost',
    port: parseInt(process.env.FALKORDB_PORT || '6379'),
    username: process.env.FALKORDB_USERNAME || '',
    password: process.env.FALKORDB_PASSWORD || '',
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    defaultGraph: 'default',
  },
  apiKey: process.env.MCP_API_KEY || '',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
};