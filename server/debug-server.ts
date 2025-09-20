// Load environment variables first
import 'dotenv/config';

console.log('🔧 Starting server...');
console.log('📊 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

import express from 'express';

console.log('🚀 Express imported successfully');

const app = express();

console.log('🌐 Setting up middleware...');
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from debug server!' });
});

const port = process.env.PORT || 5000;

console.log('📡 Starting server on port', port);
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});