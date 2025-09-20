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

    console.log('🔧 Setting up Vite server...');

    // Create Vite server using the project's vite.config.ts
    const vite = await createViteServer({
        server: {
            middlewareMode: true,
            hmr: { port: 24679 }
        },
        appType: 'spa'
        // Let Vite use the vite.config.ts from the project root
    });

    console.log('✅ Vite server created');

    // Basic API endpoints before Vite middleware
    app.get('/api/status', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: 'Smart Alpaca server running',
            version: '1.0.0'
        });
    });

    // Use vite's connect instance as middleware
    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);

    const server = createServer(app);

    server.listen(port, () => {
        console.log(`🚀 Dev server running on http://localhost:${port}`);
        console.log(`⚡ Vite HMR enabled on port 24679`);
        console.log(`📁 Using vite.config.ts configuration`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('Shutting down server...');
        await vite.close();
        server.close();
    });

    return { app, server, vite };
}

createDevServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});