// Load environment variables first
import 'dotenv/config';

console.log('🔧 Environment variables loaded');
console.log('📊 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

// Import API routes
import { healthCheckRouter } from './routes/health.js';
import monitoringRouter from './routes/monitoring.js';
import apiRouter from './routes/api.js';

// Import WebSocket setup
import { initializeWebSocketManager } from './services/websocket.js';

// ES modules support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : false,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRouter);
app.use('/api/health', healthCheckRouter);
app.use('/api/monitoring', monitoringRouter);

// Static file serving for client
const clientPath = path.resolve(__dirname, '../client');
console.log('📁 Serving static files from:', clientPath);

// Serve static files
app.use(express.static(clientPath));

// Serve index.html for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Create HTTP server
const server = createServer(app);

// Setup WebSocket
const wsManager = initializeWebSocketManager(server);

// Start server
server.listen(port, () => {
  console.log(`🚀 Hybrid server running on http://localhost:${port}`);
  console.log(`📁 Serving files from: ${clientPath}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`🛡️  Security middleware active`);
  console.log(`📊 API endpoints available at /api/*`);
});

export { app, server };