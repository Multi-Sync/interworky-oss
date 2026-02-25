const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const googleCalendarIntegrationSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    organization_id: {
      type: String,
      required: true,
      index: true,
    },
    google_account_email: {
      type: String,
      required: false,
    },
    refresh_token: {
      type: String,
      required: true,
    },
    access_token: {
      type: String,
      required: true,
    },
    access_token_expires_at: {
      type: Date,
      required: true,
    },
    scopes: {
      type: [String],
      default: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events'],
    },
    calendar_ids: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'revoked', 'pending', 'error'],
      default: 'pending',
    },
    last_sync_at: {
      type: Date,
    },
    sync_token: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'google_calendar_integrations',
  },
);

googleCalendarIntegrationSchema.index({ user_id: 1, organization_id: 1 });

module.exports = mongoose.model('GoogleCalendarIntegration', googleCalendarIntegrationSchema);
