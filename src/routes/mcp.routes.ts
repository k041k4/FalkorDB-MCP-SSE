import { Router } from 'express';
import { mcpController } from '../controllers/mcp.controller';

const router = Router();

// MCP API routes
router.post('/context', mcpController.handleContextRequest.bind(mcpController));
router.get('/metadata', (req, res) => {
  res.json({
    type: 'metadata',
    status: 'success',
    data: {
      provider: 'FalkorDB',
      version: '1.0.0',
      capabilities: ['context', 'metadata', 'tools', 'resources']
    }
  });
});
router.get('/graphs', mcpController.listGraphs.bind(mcpController));

// MCP Protocol endpoints
router.get('/capabilities', mcpController.getCapabilities.bind(mcpController));
router.get('/resources', mcpController.getResources.bind(mcpController));
router.get('/tools', mcpController.getTools.bind(mcpController));

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    version: '1.0.0',
    protocol: 'StreamableHTTP',
    capabilities: {
      context: true,
      metadata: true,
      streaming: true,
      tools: true,
      resources: true
    }
  });
});

export const mcpRoutes = router;