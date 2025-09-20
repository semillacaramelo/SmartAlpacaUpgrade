// Load environment variables first
import 'dotenv/config';

import express from 'express';
import { createServer } from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createDevServer() {
    const app = express();
    const port = process.env.PORT || 5000;

    // Basic middleware
    app.use(express.json());

    // Basic API endpoints
    app.get('/api/status', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: 'Smart Alpaca server running',
            version: '1.0.0'
        });
    });

    // Create Vite server in middleware mode
    const vite = await createViteServer({
        server: {
            middlewareMode: true,
            hmr: { port: 24679 } // Different port for HMR
        },
        appType: 'spa',
        root: path.resolve(__dirname, '../client')
    });

    // Use vite's connect instance as middleware
    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);

    const server = createServer(app);

    server.listen(port, () => {
        console.log(`🚀 Dev server running on http://localhost:${port}`);
        console.log(`📁 Vite serving client from: ${path.resolve(__dirname, '../client')}`);
        console.log(`⚡ HMR enabled on port 24679`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('Shutting down server...');
        await vite.close();
        server.close();
    });

    return { app, server, vite };
}

createDevServer().catch(console.error);