import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { config } from '../config';
import { mcpController } from '../controllers/mcp.controller';

const mcpRouter = Router();

// Health check endpoint
mcpRouter.get('/health', mcpController.healthCheck);

// Authentication middleware for all routes below
mcpRouter.use(authenticate);

// MCP endpoints
mcpRouter.get('/capabilities', mcpController.getCapabilities);
mcpRouter.get('/tools', mcpController.getTools);
mcpRouter.get('/metadata', mcpController.getMetadata);
mcpRouter.get('/resources', (req, res) => {
  req.query.graphName = req.query.graphName || config.falkorDB.defaultGraph;
  mcpController.getResources(req, res);
});
mcpRouter.post('/context', mcpController.getContext);
mcpRouter.post('/query', mcpController.executeQuery);

export { mcpRouter };