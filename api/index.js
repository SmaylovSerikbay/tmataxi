// Vercel Serverless Function entry point
const express = require('express');
const cors = require('cors');
const app = express();
const { processTelegramUpdate, ensureTelegramWebhook } = require('../backend/bot');

// Middleware
app.use(cors());
app.use(express.json());

// Prevent Vercel/CDN caching for API responses (fixes 304 + stale statuses)
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Routes - пути должны соответствовать тому, что ожидает frontend (/api/...)
app.use('/api/orders', require('../backend/routes/orders'));
app.use('/api/drivers', require('../backend/routes/drivers'));
app.use('/api/passengers', require('../backend/routes/passengers'));
app.use('/api/auth', require('../backend/routes/auth'));

// Telegram webhook endpoint (for Vercel serverless)
app.post('/api/telegram/webhook', async (req, res) => {
  // Telegram only needs 200 OK quickly
  res.status(200).json({ ok: true });

  // Process update asynchronously (do not block response)
  try {
    ensureTelegramWebhook().catch(() => {});
    await processTelegramUpdate(req.body);
  } catch (e) {
    console.error('Telegram webhook error:', e?.message || e);
  }
});

// Ensure webhook on cold start / health checks
ensureTelegramWebhook().catch(() => {});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Обрабатываем запрос через Express
  // Supabase клиент инициализируется автоматически через переменные окружения
  return app(req, res);
};
