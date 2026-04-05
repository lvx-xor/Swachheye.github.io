/* ============================================================
   Main Express Server — Swachhta & LiFE Dashboard Backend
   PORT: 3001
   ============================================================ */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: '*',  // In production, restrict to your domain
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..')));

// Serve raw uploads (evidence photos) publicly
app.use('/uploads', express.static(path.join(__dirname, 'data/uploads')));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai',   require('./routes/ai'));
app.use('/api/reports', require('./routes/reports'));

// ── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const geminiConfigured = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  const emailConfigured  = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_USER !== 'your_email@gmail.com');

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      geminiAI: geminiConfigured ? 'configured' : '⚠️ GEMINI_API_KEY not set',
      email: emailConfigured ? 'configured' : '⚠️ Gmail credentials not set',
    },
  });
});

// ── Catch-all: serve index.html for SPA routing ───────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found.' });
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Server] Unhandled error:', err.message);

  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Image too large. Maximum size is 10 MB.' });
  }

  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   🌿 Swachhta & LiFE Dashboard — Backend         ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║   Server:  http://localhost:${PORT}                  ║`);
  console.log(`║   Frontend: http://localhost:${PORT}                 ║`);
  console.log(`║   API:     http://localhost:${PORT}/api/health       ║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  const geminiOk = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  const emailOk  = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_USER !== 'your_email@gmail.com');

  console.log('  📋 Configuration Status:');
  console.log(`  ${geminiOk ? '✅' : '⚠️ '} Gemini AI: ${geminiOk ? 'Ready' : 'Add GEMINI_API_KEY to .env'}`);
  console.log(`  ${emailOk  ? '✅' : '⚠️ '} Email:     ${emailOk  ? 'Ready' : 'Add GMAIL_USER & GMAIL_APP_PASSWORD to .env'}`);
  console.log('');
});
