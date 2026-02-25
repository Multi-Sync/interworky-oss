const express = require('express');
const authenticateToken = require('../../middlewares/auth.middleware');
const { asyncHandler } = require('../../utils/asyncHandler');
const NotificationPreference = require('./notification_preference.model');
const dailyBriefingService = require('./daily_briefing.service');

const router = express.Router();
const LOG_PREFIX = '[NotificationPreference]';

// ── User Preferences ─────────────────────────────────────────────

// GET /api/notification-preferences — get current user preferences
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  let prefs = await NotificationPreference.findOne({ user_id: req.userId });

  if (!prefs) {
    // Create defaults
    prefs = await NotificationPreference.create({
      user_id: req.userId,
      organization_id: req.user?.organization_id,
    });
  }

  res.json({ success: true, preferences: prefs });
}));

// PUT /api/notification-preferences — update preferences
router.put('/', authenticateToken, asyncHandler(async (req, res) => {
  const prefs = await NotificationPreference.findOneAndUpdate(
    { user_id: req.userId },
    { $set: req.body },
    { new: true, upsert: true }
  );

  res.json({ success: true, preferences: prefs });
}));

// ── Briefing Processing (Internal, called by interworky-functions) ──

// POST /api/notification-preferences/process-briefings
router.post('/process-briefings', asyncHandler(async (req, res) => {
  console.log(`${LOG_PREFIX} Processing briefings...`);

  const now = new Date();
  let processed = 0;

  // Get all unique timezones with briefings enabled
  const timezones = await NotificationPreference.distinct('timezone', {
    daily_briefing_enabled: true,
  });

  for (const tz of timezones) {
    try {
      // Calculate current hour in this timezone
      const localTime = new Date(now.toLocaleString('en-US', { timeZone: tz }));
      const currentHour = localTime.getHours();

      const users = await dailyBriefingService.getUsersForBriefing(currentHour, tz);

      for (const pref of users) {
        try {
          await dailyBriefingService.sendBriefing(pref.user_id);
          processed++;
        } catch (error) {
          console.error(`${LOG_PREFIX} Failed briefing for user ${pref.user_id}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Error processing timezone ${tz}:`, error.message);
    }
  }

  console.log(`${LOG_PREFIX} Done. Processed ${processed} briefings.`);
  res.json({ success: true, processed });
}));

module.exports = router;
