import 'dotenv/config';
import express from 'express';
import { config } from './config';
import { mcpRouter } from './routes/mcp.routes';
import { authenticate } from './middleware/auth.middleware';
import { falkorDBService } from './services/falkordb.service';
import path from 'path';
import cors from 'cors';
import { Server } from 'http';
import { EventEmitter } from 'events';

// Initialize Express app
const app = express();
const eventEmitter = new EventEmitter();

// Increase max listeners to handle multiple SSE connections
eventEmitter.setMaxListeners(100);

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
app.use('/api/mcp', authenticate, mcpRouter);

// Basic routes
app.get('/', (req, res) => {
    res.json({
        name: 'FalkorDB MCP Server',
        version: '1.0.0',
        status: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check FalkorDB connection
        await falkorDBService.executeQuery('RETURN 1', {}, 'default');
        res.json({
            status: 'healthy',
            database: 'connected',
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
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
            cleanup();
        }
    };

    const cleanup = () => {
        eventEmitter.removeListener('mcpEvent', sendEvent);
        if (!res.writableEnded) {
            res.end();
        }
    };

    // Add event listener
    eventEmitter.on('mcpEvent', sendEvent);

    // Handle client disconnect
    req.on('close', () => {
        cleanup();
    });

    // Handle errors
    req.on('error', (error: any) => {
        // Only log non-ECONNRESET errors in production
        if (error?.code !== 'ECONNRESET' || process.env.NODE_ENV === 'development') {
            console.error('SSE connection error:', error);
        }
        cleanup();
    });

    // Send periodic heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
        try {
            if (!res.writableEnded) {
                res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
            }
        } catch (error) {
            clearInterval(heartbeat);
            cleanup();
        }
    }, 30000); // Send heartbeat every 30 seconds

    // Clean up heartbeat interval on connection close
    req.on('close', () => {
        clearInterval(heartbeat);
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

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use`);
        } else {
            console.error('Server error:', error);
        }
        process.exit(1);
    });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle graceful shutdown
const gracefulShutdown = async () => {
    console.log('Shutting down gracefully...');
    try {
        // Close database connections
        await falkorDBService.close();
        if (server) {
            await new Promise<void>((resolve) => {
                server?.close(() => {
                    console.log('Server closed');
                    resolve();
                });
            });
        }
    } catch (error) {
        console.error('Error during shutdown:', error);
    } finally {
        process.exit(0);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export { app, eventEmitter };