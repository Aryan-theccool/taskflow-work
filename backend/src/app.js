const fs = require('fs');
const path = require('path');
const express = require('express');
const boardsRouter = require('./routes/boards');
const tasksRouter = require('./routes/tasks');

const API_PREFIXES = ['/boards', '/tasks', '/health'];

/** Build the Express app around an open database handle (injectable for tests). */
function createApp(db) {
  const app = express();
  app.use(express.json());

  // Enable CORS for all origins
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Max-Age', '86400');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.get('/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));
  app.use('/boards', boardsRouter(db));
  app.use('/tasks', tasksRouter(db));

  // Serve the built frontend when it exists (single-process deployment).
  const distDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (API_PREFIXES.some((p) => req.path.startsWith(p))) return next();
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[taskflow] unhandled error:', err);
    res.status(500).json({ error: 'Something went wrong on the server' });
  });
  return app;
}

module.exports = { createApp };
