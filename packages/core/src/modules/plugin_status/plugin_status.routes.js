const express = require('express');
const {
  createOrUpdateStatus,
  sendHeartbeat,
  getStatus,
  markUninstalled,
  getInstallationSummary,
  checkAndUpdateOnboarding,
} = require('./plugin_status.controllers');
const authenticateToken = require('../../middlewares/auth.middleware');

const pluginStatusRouter = express.Router();

// Public routes (for plugin installation and heartbeat)
pluginStatusRouter.post('/install', createOrUpdateStatus);
pluginStatusRouter.post('/heartbeat', sendHeartbeat);

// Protected routes (for dashboard access)
pluginStatusRouter.get('/status/:organizationId', authenticateToken, getStatus);
pluginStatusRouter.post('/check-and-update/:organizationId', authenticateToken, checkAndUpdateOnboarding);
pluginStatusRouter.delete('/uninstall/:organizationId', authenticateToken, markUninstalled);

// Admin routes
pluginStatusRouter.get('/admin/summary', authenticateToken, getInstallationSummary);

module.exports = pluginStatusRouter;
