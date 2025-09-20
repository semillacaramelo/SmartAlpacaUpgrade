import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

// Basic middleware
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client')));

// Basic API endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Basic server running' 
  });
});

// Serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Basic server running on http://localhost:${port}`);
  console.log(`📁 Serving files from: ${path.resolve(__dirname, '../client')}`);
});