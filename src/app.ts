import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { config } from './config';
import { mcpRouter } from './routes/mcp.routes';

const app = express();

// Middleware
app.use(cors({
  origin: config.cors.origin,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders
}));
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/mcp', mcpRouter);

export { app }; 