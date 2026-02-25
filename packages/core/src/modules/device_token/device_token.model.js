const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const deviceTokenSchema = new Schema(
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
      required: false,
    },
    device_token: {
      type: String,
      required: true,
      unique: true,
    },
    platform: {
      type: String,
      enum: ['ios', 'android'],
      required: true,
      default: 'ios',
    },
    app_version: {
      type: String,
      required: false,
    },
    os_version: {
      type: String,
      required: false,
    },
    device_name: {
      type: String,
      required: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    last_used_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'device_tokens',
  },
);

// Compound index for efficient user token lookups
deviceTokenSchema.index({ user_id: 1, is_active: 1 });

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
