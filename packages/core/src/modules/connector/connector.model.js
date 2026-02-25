const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const connectorSchema = new Schema(
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
    connector_type: {
      type: String,
      required: true,
      enum: [
        'google_calendar', 'outlook_calendar',
        'slack', 'trello', 'asana', 'quickbooks',
        'github', 'wix', 'hubspot', 'notion',
      ],
    },
    display_name: {
      type: String,
      required: true,
    },
    auth_data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    sync_config: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'error', 'pending'],
      default: 'pending',
    },
    last_sync_at: {
      type: Date,
    },
    capabilities: {
      type: [String],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'connectors',
  },
);

connectorSchema.index({ user_id: 1, connector_type: 1 });

module.exports = mongoose.model('Connector', connectorSchema);
