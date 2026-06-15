require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
if (!process.env.JWT_SECRET) {
  console.warn('\n  ⚠️  JWT_SECRET env var not set — using insecure default. Set it before deploying.\n');
}
const JWT_SECRET = process.env.JWT_SECRET || 'madapim-pilot-secret-2026';

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'client', 'dist'))); // Vite build

// Optional JWT auth — attaches req.user if token present (non-blocking for pilot)
app.use((req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch {}
  }
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/students',   require('./routes/students'));
app.use('/api/files',      require('./routes/files'));
app.use('/api/evaluations',require('./routes/evaluations'));
app.use('/api/rubrics',    require('./routes/rubrics'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ─── Catch-all: serve Vite SPA (or index.html at root) ────────────────────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const distIndex = path.join(__dirname, 'client', 'dist', 'index.html');
    const rootIndex = path.join(__dirname, 'index.html');
    const fs = require('fs');
    if (fs.existsSync(distIndex)) {
      res.sendFile(distIndex);
    } else {
      res.sendFile(rootIndex);
    }
  }
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── Start (async so DB init can run first) ───────────────────────────────────
const { initDB } = require('./db');

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`\n✓ כלי הערכה פדגוגית running at http://localhost:${PORT}`);
    console.log(`  API: http://localhost:${PORT}/api`);
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_key_here') {
      console.log(`\n  ⚠️  GEMINI_API_KEY not set — AI analysis will fail.`);
    }
  });
}

start().catch(err => { console.error('Startup error:', err); process.exit(1); });
