import express from 'express';
import { config } from './config';
import { mcpRoutes } from './routes/mcp.routes';
import { authenticate } from './middleware/auth.middleware';
import { falkorDBService } from './services/falkordb.service';
import path from 'path';
import cors from 'cors';
import { Server } from 'http';
import { EventEmitter } from 'events';

// Initialize Express app
const app = express();
const eventEmitter = new EventEmitter();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Apply authentication to MCP routes
app.use('/api/mcp', authenticate, mcpRoutes);

// Basic routes
app.get('/', (req, res) => {
    res.json({
        name: 'FalkorDB MCP Server',
        version: '1.0.0',
        status: 'running',
    });
});

// SSE endpoint for MCP streaming
app.get('/api/mcp/stream', (req, res) => {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connected' })}\n\n`);

    const sendEvent = (data: any) => {
        try {
            if (!res.writableEnded) {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            }
        } catch (error: any) {
            // Ignore write errors when connection is closed
            if (error?.code !== 'ECONNRESET') {
                console.error('Error sending SSE event:', error);
            }
            eventEmitter.removeListener('mcpEvent', sendEvent);
        }
    };

    // Add event listener
    eventEmitter.on('mcpEvent', sendEvent);

    // Handle client disconnect
    req.on('close', () => {
        eventEmitter.removeListener('mcpEvent', sendEvent);
        res.end();
    });

    // Handle errors
    req.on('error', (error: any) => {
        // Ignore connection reset errors during testing
        if (error?.code !== 'ECONNRESET' || process.env.NODE_ENV !== 'test') {
            console.error('SSE connection error:', error);
        }
        eventEmitter.removeListener('mcpEvent', sendEvent);
        res.end();
    });
});

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);
let server: Server | null = null;

// Only start the server if we're not in test mode and SKIP_MAIN_SERVER is not set
if (process.env.NODE_ENV !== 'test' && !process.env.SKIP_MAIN_SERVER) {
    server = app.listen(PORT, () => {
        console.log(`FalkorDB MCP Server listening on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

// Handle graceful shutdown
const gracefulShutdown = async () => {
    console.log('Shutting down gracefully...');
    // Close database connections
    await falkorDBService.close();
    if (server) {
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export { app, eventEmitter };