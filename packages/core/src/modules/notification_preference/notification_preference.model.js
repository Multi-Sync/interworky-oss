const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const notificationPreferenceSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    user_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    organization_id: {
      type: String,
      required: false,
    },
    daily_briefing_enabled: {
      type: Boolean,
      default: false,
    },
    daily_briefing_time: {
      type: String,
      default: '08:00', // HH:MM in user's timezone
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    quiet_hours_enabled: {
      type: Boolean,
      default: false,
    },
    quiet_hours_start: {
      type: String,
      default: '22:00',
    },
    quiet_hours_end: {
      type: String,
      default: '07:00',
    },
    task_updates: {
      type: Boolean,
      default: true,
    },
    task_reminders: {
      type: Boolean,
      default: true,
    },
    calendar_reminders: {
      type: Boolean,
      default: true,
    },
    team_activity: {
      type: Boolean,
      default: true,
    },
    invitation_notifications: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'notification_preferences',
  },
);

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
