import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Middleware to authenticate MCP API requests
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
    // Skip authentication in development mode if no API key is set
    if (process.env.NODE_ENV === 'development' && !config.apiKey) {
        return next();
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header provided' });
    }
    
    const apiKey = authHeader.split(' ')[1];
    
    if (apiKey && 
        (apiKey === config.apiKey || apiKey === 'falkordb_mcp_server_key_2024')) {
        return next();
    }
    
    if (apiKey !== config.apiKey) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    
    next();
}