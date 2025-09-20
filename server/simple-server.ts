import "dotenv/config";
import express from "express";
import path from "path";

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Servir archivos estáticos desde client/
app.use(express.static(path.join(process.cwd(), 'client')));

// Endpoint de test básico
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Catch-all para SPA (React)
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Simple server running on http://localhost:${port}`);
  console.log(`📁 Serving files from: ${path.join(process.cwd(), 'client')}`);
});