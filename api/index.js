// Vercel Serverless Function entry point
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes - пути должны соответствовать тому, что ожидает frontend (/api/...)
app.use('/api/orders', require('../backend/routes/orders'));
app.use('/api/drivers', require('../backend/routes/drivers'));
app.use('/api/passengers', require('../backend/routes/passengers'));
app.use('/api/auth', require('../backend/routes/auth'));

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
