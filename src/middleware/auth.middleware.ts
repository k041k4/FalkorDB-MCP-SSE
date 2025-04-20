import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { ConfigType } from '../types/config';

/**
 * Middleware to authenticate MCP API requests
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const typedConfig: ConfigType = config;
    
    // Skip authentication in development mode if no API key is set
    if (process.env.NODE_ENV === 'development' && !typedConfig.apiKey) {
        return next();
    }
    
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header provided' });
    }
    
    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Invalid authorization header format' });
    }
    
    // In development, allow either the configured API key or the default development key
    if (process.env.NODE_ENV === 'development' && 
        (token === typedConfig.apiKey || token === 'falkordb_mcp_server_key_2024')) {
        return next();
    }
    
    if (token !== typedConfig.apiKey) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    
    next();
};