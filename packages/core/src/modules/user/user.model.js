// models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');
const sendSlackMessage = require('../../utils/slackCVP');

const userSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false, // Optional for OAuth users
    },
    role: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: true,
      enum: ['invited', 'active'],
      default: 'invited',
    },
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    source: {
      type: String,
      enum: ['email', 'google', 'test-website', 'flow', 'mobile'],
      required: true,
    },
    timezone: {
      type: String,
      required: false, // Optional for flow users
      default: 'UTC',
    },
    resendAttempts: { type: Number, default: 0 },
    lastResendAttempt: { type: Date },

    // Account type: standalone users (flow) vs organization members
    account_type: {
      type: String,
      enum: ['standalone', 'organization_member'],
      default: 'organization_member',
    },

    // Token economy
    token_balance: {
      type: Number,
      default: 1000000, // 1 million tokens on signup
      min: 0,
    },

    // OAuth provider info
    oauth_provider: {
      type: String,
      enum: ['google', 'apple', null],
      default: null,
    },
    oauth_id: {
      type: String,
      default: null,
    },

    // Profile picture from OAuth
    avatar_url: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'users',
  },
);

// Optional: notify via Slack when a new user signs up (only if SLACK_WEBHOOK_URL is set)
userSchema.post('save', async function (doc) {
  if (!doc.wasNew) return;
  sendSlackMessage(
    `New User: ${doc.email} (${doc.first_name} ${doc.last_name})`,
  );
});

module.exports = mongoose.model('User', userSchema);
