import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { initDb } from './db.js';
import { authRouter, authMiddleware } from './auth.js';
import { conversationsRouter } from './conversations.js';
import { chatRouter } from './chat.js';
import { imageRouter } from './image.js';
import { entDataRouter } from './entData.js';
import { filesRouter } from './files.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/image', imageRouter);
app.use('/api/ent-data', entDataRouter);
app.use('/api/files', filesRouter);

// Serve static frontend in production
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

async function start() {
  try {
    await initDb();
  } catch (err) {
    console.error('[server] DB init failed (continuing):', err.message);
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] running on port ${PORT}`);
  });
}

start();
