const apn = require('apn');
const DeviceToken = require('./device_token.model');
const { getConfig } = require('dotenv-handler');

const LOG_PREFIX = '[PushNotificationService]';

let apnProvider = null;

/**
 * Initialize APNs provider (lazy initialization)
 */
function getApnProvider() {
  if (apnProvider) return apnProvider;

  const keyPath = getConfig('APNS_KEY_PATH');
  const keyId = getConfig('APNS_KEY_ID');
  const teamId = getConfig('APNS_TEAM_ID');

  if (!keyPath || !keyId || !teamId) {
    console.warn(`${LOG_PREFIX} APNs not configured - missing APNS_KEY_PATH, APNS_KEY_ID, or APNS_TEAM_ID`);
    return null;
  }

  apnProvider = new apn.Provider({
    token: {
      key: keyPath,
      keyId,
      teamId,
    },
    production: process.env.NODE_ENV === 'production',
  });

  console.log(`${LOG_PREFIX} APNs provider initialized (${process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'})`);
  return apnProvider;
}

/**
 * Register or update a device token for a user
 */
async function registerDeviceToken(userId, organizationId, tokenData) {
  const { deviceToken, platform, appVersion, osVersion, deviceName } = tokenData;

  if (!deviceToken) {
    throw new Error('Device token is required');
  }

  const existing = await DeviceToken.findOne({ device_token: deviceToken });

  if (existing) {
    // Update existing token (may have been assigned to a different user after logout/login)
    existing.user_id = userId;
    existing.organization_id = organizationId;
    existing.platform = platform || existing.platform;
    existing.app_version = appVersion || existing.app_version;
    existing.os_version = osVersion || existing.os_version;
    existing.device_name = deviceName || existing.device_name;
    existing.is_active = true;
    existing.last_used_at = new Date();
    await existing.save();
    console.log(`${LOG_PREFIX} Updated device token for user ${userId}`);
    return existing;
  }

  const newToken = new DeviceToken({
    user_id: userId,
    organization_id: organizationId,
    device_token: deviceToken,
    platform: platform || 'ios',
    app_version: appVersion,
    os_version: osVersion,
    device_name: deviceName,
    is_active: true,
    last_used_at: new Date(),
  });

  await newToken.save();
  console.log(`${LOG_PREFIX} Registered new device token for user ${userId}`);
  return newToken;
}

/**
 * Unregister (deactivate) a device token
 */
async function unregisterDeviceToken(deviceToken) {
  const result = await DeviceToken.findOneAndUpdate(
    { device_token: deviceToken },
    { is_active: false },
    { new: true },
  );

  if (result) {
    console.log(`${LOG_PREFIX} Deactivated device token for user ${result.user_id}`);
  }
  return result;
}

/**
 * Send push notification to a user's active devices
 */
async function sendPushNotification(userId, { title, body, data, badge, sound, category }) {
  const provider = getApnProvider();
  if (!provider) {
    console.warn(`${LOG_PREFIX} APNs not configured, skipping push for user ${userId}`);
    return { sent: 0, failed: 0 };
  }

  const tokens = await DeviceToken.find({ user_id: userId, is_active: true, platform: 'ios' });

  if (tokens.length === 0) {
    console.log(`${LOG_PREFIX} No active tokens for user ${userId}`);
    return { sent: 0, failed: 0 };
  }

  const bundleId = getConfig('APNS_BUNDLE_ID') || 'com.interworky.app';

  const notification = new apn.Notification();
  notification.topic = bundleId;
  notification.alert = { title, body };
  notification.sound = sound || 'default';
  notification.badge = badge || 0;
  notification.category = category || '';
  notification.payload = data || {};
  notification.expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry

  const deviceTokens = tokens.map((t) => t.device_token);
  const result = await provider.send(notification, deviceTokens);

  // Handle failed tokens (e.g., expired/invalid)
  if (result.failed && result.failed.length > 0) {
    for (const failure of result.failed) {
      if (failure.status === '410' || failure.response?.reason === 'Unregistered') {
        await DeviceToken.findOneAndUpdate(
          { device_token: failure.device },
          { is_active: false },
        );
        console.log(`${LOG_PREFIX} Deactivated expired token: ${failure.device?.substring(0, 10)}...`);
      }
    }
  }

  const sentCount = result.sent ? result.sent.length : 0;
  const failedCount = result.failed ? result.failed.length : 0;

  console.log(`${LOG_PREFIX} Push sent to user ${userId}: ${sentCount} sent, ${failedCount} failed`);
  return { sent: sentCount, failed: failedCount };
}

/**
 * Send push notification to multiple users
 */
async function sendBulkPush(userIds, { title, body, data, badge, sound, category }) {
  const results = { totalSent: 0, totalFailed: 0 };

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, { title, body, data, badge, sound, category });
    results.totalSent += result.sent;
    results.totalFailed += result.failed;
  }

  console.log(`${LOG_PREFIX} Bulk push: ${results.totalSent} sent, ${results.totalFailed} failed across ${userIds.length} users`);
  return results;
}

/**
 * Remove device tokens not used in the last 90 days
 */
async function cleanupStaleTokens() {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const result = await DeviceToken.deleteMany({
    last_used_at: { $lt: cutoff },
    is_active: false,
  });

  console.log(`${LOG_PREFIX} Cleaned up ${result.deletedCount} stale tokens`);
  return result.deletedCount;
}

// =============================================================================
// Internal Notification Helpers (called by other services)
// =============================================================================

async function notifyTaskCompleted(userId, taskTitle, taskId) {
  return sendPushNotification(userId, {
    title: 'Task Completed',
    body: `"${taskTitle}" has been completed successfully.`,
    data: { type: 'task_update', taskId, action: 'completed' },
    category: 'task_update',
    sound: 'default',
  });
}

async function notifyTaskFailed(userId, taskTitle, error) {
  return sendPushNotification(userId, {
    title: 'Task Failed',
    body: `"${taskTitle}" failed: ${error}`,
    data: { type: 'task_update', action: 'failed' },
    category: 'task_update',
    sound: 'default',
  });
}

async function notifyReminder(userId, message) {
  return sendPushNotification(userId, {
    title: 'Reminder',
    body: message,
    data: { type: 'reminder' },
    category: 'reminder',
    sound: 'default',
  });
}

async function notifyCalendarEvent(userId, eventTitle, startTime) {
  return sendPushNotification(userId, {
    title: 'Upcoming Event',
    body: `"${eventTitle}" starts at ${startTime}`,
    data: { type: 'calendar_event' },
    category: 'calendar_event',
    sound: 'default',
  });
}

async function notifyInvitation(userId, inviterName, orgName) {
  return sendPushNotification(userId, {
    title: 'Team Invitation',
    body: `${inviterName} invited you to join ${orgName}`,
    data: { type: 'invitation' },
    category: 'invitation',
    sound: 'default',
  });
}

module.exports = {
  registerDeviceToken,
  unregisterDeviceToken,
  sendPushNotification,
  sendBulkPush,
  cleanupStaleTokens,
  notifyTaskCompleted,
  notifyTaskFailed,
  notifyReminder,
  notifyCalendarEvent,
  notifyInvitation,
};
