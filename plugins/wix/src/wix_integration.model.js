const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const wixIntegrationSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    organization_id: {
      type: String,
      required: true,
      index: true,
    },
    wix_site_id: {
      type: String,
      required: true,
      index: true,
    },
    wix_instance_id: {
      type: String,
      required: true,
      unique: true,
    },
    refresh_token: {
      type: String,
      required: true,
    },
    access_token: {
      type: String,
    },
    access_token_expires_at: {
      type: Date,
    },
    permissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'revoked', 'pending'],
      default: 'pending',
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'wix_integrations',
  },
);

wixIntegrationSchema.index({ organization_id: 1, wix_site_id: 1 }, { unique: true });

module.exports = mongoose.model('WixIntegration', wixIntegrationSchema);
