const { asyncHandler } = require('../../utils/asyncHandler');
const pushService = require('./push_notification.service');

const LOG_PREFIX = '[DeviceTokenController]';

/**
 * Register a device token
 * POST /api/device-tokens
 */
const registerToken = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { deviceToken, platform, appVersion, osVersion, deviceName, organizationId } = req.body;

  console.log(`${LOG_PREFIX} POST /api/device-tokens`, { userId, platform });

  if (!deviceToken) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: deviceToken',
    });
  }

  const result = await pushService.registerDeviceToken(userId, organizationId, {
    deviceToken,
    platform,
    appVersion,
    osVersion,
    deviceName,
  });

  res.json({
    success: true,
    token: {
      id: result.id,
      device_token: result.device_token,
      platform: result.platform,
      is_active: result.is_active,
    },
  });
});

/**
 * Unregister a device token (on logout)
 * DELETE /api/device-tokens/:token
 */
const unregisterToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  console.log(`${LOG_PREFIX} DELETE /api/device-tokens/:token`, { token: token?.substring(0, 10) + '...' });

  const result = await pushService.unregisterDeviceToken(token);

  if (!result) {
    return res.status(404).json({
      success: false,
      error: 'Device token not found',
    });
  }

  res.json({ success: true, message: 'Device token unregistered' });
});

/**
 * Refresh/update a device token
 * PUT /api/device-tokens/:token/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const userId = req.userId;
  const { newToken, organizationId } = req.body;

  console.log(`${LOG_PREFIX} PUT /api/device-tokens/:token/refresh`, { userId });

  // Deactivate old token
  await pushService.unregisterDeviceToken(token);

  // Register new token
  if (newToken) {
    const result = await pushService.registerDeviceToken(userId, organizationId, {
      deviceToken: newToken,
      platform: 'ios',
    });

    return res.json({
      success: true,
      token: {
        id: result.id,
        device_token: result.device_token,
        is_active: result.is_active,
      },
    });
  }

  res.json({ success: true, message: 'Old token deactivated' });
});

/**
 * Internal endpoint: Send push notification
 * POST /api/device-tokens/internal/push
 * Used by interworky-functions to trigger pushes
 */
const sendPush = asyncHandler(async (req, res) => {
  const { userId, title, body, data, badge, sound, category } = req.body;

  console.log(`${LOG_PREFIX} POST /api/device-tokens/internal/push`, { userId, title });

  if (!userId || !title || !body) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: userId, title, body',
    });
  }

  const result = await pushService.sendPushNotification(userId, {
    title,
    body,
    data,
    badge,
    sound,
    category,
  });

  res.json({ success: true, ...result });
});

module.exports = {
  registerToken,
  unregisterToken,
  refreshToken,
  sendPush,
};
