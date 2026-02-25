const express = require('express');
const connectDB = require('./config/mongodb'); // MongoDB config file
require('./config')(); // dotenv-handler config file
require('./config/instrument');
const { getConfig } = require('dotenv-handler');
const helmet = require('helmet');
const cors = require('cors');
const indexRouter = require('./routers/index.router');
const { loadPlugins } = require('./plugins');
const errorHandler = require('./middlewares/errorHandler.middleware');
const morgan = require('morgan');
const Sentry = require('@sentry/node');
const githubRouter = require('./routers/github.router');
const { startCVEWatchJob } = require('./jobs/cveWatchJob');
const app = express();
app.use(morgan('dev'));

app.use(helmet());
app.use(express.json());
app.use('/api/github', githubRouter);

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Root route handler should be above the 404 handler
app.get('/', (_req, res) => {
  res.json({ message: 'Hello World!' });
});

app.use('/api', indexRouter);

// Load plugins from the plugins/ directory
const path = require('path');
loadPlugins(app, path.resolve(__dirname, '../../../plugins'));

// Sentry error handler should be after all the routes
Sentry.setupExpressErrorHandler(app);

// 404 handler should be after the main routes
app.use((_req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use(errorHandler);

const PORT = getConfig('PORT');

const startServer = async () => {
  try {
    await connectDB();

    // Start CVE Watch cron job (runs every 12 hours)
    startCVEWatchJob();

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();
