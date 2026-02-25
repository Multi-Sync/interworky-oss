const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler.middleware');

/**
 * Create and configure the Express app (without DB connection or listen).
 * Used by tests and by app.js for production startup.
 */
function createApp({ loadRoutes = true } = {}) {
  const app = express();
  app.use(helmet());
  app.use(express.json());
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.get('/', (_req, res) => {
    res.json({ message: 'Hello World!' });
  });

  if (loadRoutes) {
    try {
      const indexRouter = require('./routers/index.router');
      app.use('/api', indexRouter);
    } catch (e) {
      console.warn('[createApp] Could not load routes:', e.message);
    }
  }

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
