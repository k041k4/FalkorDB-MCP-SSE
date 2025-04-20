import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Function to load environment variables from .env file
function loadEnv() {
    // First try to load the root .env file
    const rootEnvPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(rootEnvPath)) {
        console.log('Loading environment variables from root .env file');
        dotenv.config({ path: rootEnvPath });
        return;
    }

    // If root .env not found, try other environment-specific files
    const envFiles = [
        '.env.local',
        '.env.development',
        '.env.test',
        '.env.example'
    ];

    for (const file of envFiles) {
        const envPath = path.resolve(process.cwd(), file);
        if (fs.existsSync(envPath)) {
            console.log(`Loading environment variables from ${file}`);
            dotenv.config({ path: envPath });
            return;
        }
    }

    console.warn('No .env file found. Using default environment variables.');
}

// Load environment variables
loadEnv();

// Export environment variables with types
export const env = {
    port: process.env.PORT || '3000',
    nodeEnv: process.env.NODE_ENV || 'development',
    falkorDB: {
        host: process.env.FALKORDB_HOST || 'localhost',
        port: parseInt(process.env.FALKORDB_PORT || '6379', 10),
        username: process.env.FALKORDB_USERNAME || '',
        password: process.env.FALKORDB_PASSWORD || '',
        defaultGraph: process.env.FALKORDB_DEFAULT_GRAPH || 'default'
    },
    apiKey: process.env.MCP_API_KEY || 'falkordb_mcp_server_key_2024',
    cors: {
        origin: process.env.CORS_ORIGIN || '*'
    }
}; 