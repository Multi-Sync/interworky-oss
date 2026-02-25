const express = require('express');
const authenticateToken = require('../../middlewares/auth.middleware');
const { asyncHandler } = require('../../utils/asyncHandler');
const Connector = require('./connector.model');
const BaseConnector = require('./base_connector');

const connectorRouter = express.Router();

/**
 * Get available connectors catalog
 * GET /api/connectors/available
 */
connectorRouter.get('/available', asyncHandler(async (req, res) => {
  const connectors = BaseConnector.getAvailableConnectors();
  res.json({ success: true, connectors });
}));

/**
 * Get user's connected integrations
 * GET /api/connectors/me
 */
connectorRouter.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const connectors = await Connector.find({
    user_id: req.userId,
    status: { $in: ['active', 'pending'] },
  });
  res.json({ success: true, connectors });
}));

/**
 * Get connection status for a specific connector type
 * GET /api/connectors/:type/status
 */
connectorRouter.get('/:type/status', authenticateToken, asyncHandler(async (req, res) => {
  const connector = await Connector.findOne({
    user_id: req.userId,
    connector_type: req.params.type,
    status: 'active',
  });

  res.json({
    success: true,
    connected: !!connector,
    connector: connector ? {
      id: connector.id,
      type: connector.connector_type,
      displayName: connector.display_name,
      status: connector.status,
      lastSyncAt: connector.last_sync_at,
    } : null,
  });
}));

/**
 * Disconnect a connector
 * DELETE /api/connectors/:id
 */
connectorRouter.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const connector = await Connector.findOneAndUpdate(
    { $or: [{ id: req.params.id }, { _id: req.params.id }], user_id: req.userId },
    { status: 'inactive' },
    { new: true },
  );

  if (!connector) {
    return res.status(404).json({ success: false, error: 'Connector not found' });
  }

  res.json({ success: true, message: `${connector.display_name} disconnected` });
}));

module.exports = connectorRouter;
