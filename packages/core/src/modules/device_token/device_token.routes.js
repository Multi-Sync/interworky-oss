const express = require('express');
const authenticateToken = require('../../middlewares/auth.middleware');
const {
  registerToken,
  unregisterToken,
  refreshToken,
  sendPush,
} = require('./device_token.controllers');

const deviceTokenRouter = express.Router();

// Public-facing endpoints (require auth)
deviceTokenRouter.post('/', authenticateToken, registerToken);
deviceTokenRouter.delete('/:token', authenticateToken, unregisterToken);
deviceTokenRouter.put('/:token/refresh', authenticateToken, refreshToken);

// Internal endpoint for interworky-functions to trigger pushes
// In production, secure this with an internal API key or network restriction
deviceTokenRouter.post('/internal/push', sendPush);

module.exports = deviceTokenRouter;
