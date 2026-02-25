// src/modules/flow/flow-result.model.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const FlowResultSchema = new mongoose.Schema(
  {
    // Unique result ID
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => `res_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
    },

    // User who created this result
    user_id: {
      type: String,
      required: true,
      index: true,
    },

    // Flow reference
    flow_id: {
      type: String,
      required: true,
      index: true,
    },
    flow_name: {
      type: String,
      required: true,
    },

    // Session reference (for deduplication)
    session_id: {
      type: String,
      required: true,
      unique: true,
    },

    // The data
    collected_data: {
      type: Object,
      default: {},
    },
    completion_result: {
      type: Object,
      default: null,
    },
    rendered_html: {
      type: String,
      default: null,
    },

    // Display metadata
    title: {
      type: String,
      default: null,
    },
    preview_text: {
      type: String,
      default: null,
    },
    theme_color: {
      type: String,
      default: '#57534e',
    },

    // Token info
    tokens_charged: {
      type: Number,
      default: 0,
    },

    // Timestamps
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'flow_results',
  }
);

// Indexes for efficient queries
FlowResultSchema.index({ user_id: 1, created_at: -1 });
FlowResultSchema.index({ user_id: 1, flow_id: 1 });

module.exports = mongoose.model('FlowResult', FlowResultSchema);
