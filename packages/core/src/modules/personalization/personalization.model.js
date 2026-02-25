/**
 * Personalization Model
 * Stores personalization variations for visitors
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const PersonalizationSchema = new Schema(
  {
    // Unique identifiers
    id: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    visitor_id: {
      type: String,
      required: true,
      index: true,
    },
    organization_id: {
      type: String,
      required: true,
      index: true,
    },

    // Page information
    page_url: {
      type: String,
      required: true,
    },
    page_url_hash: {
      type: String,
      required: true,
      index: true,
    },
    page_title: String,

    // The personalizationObj from DOM scanner
    page_schema: {
      type: Schema.Types.Mixed,
      required: true,
    },

    // Intent extraction results
    intent: {
      primary_intent: String,
      interest_signals: [Schema.Types.Mixed],
      visitor_segment: {
        type: String,
        enum: ['developer', 'marketer', 'executive', 'founder', 'sales', 'support', 'researcher', 'general'],
      },
      urgency_level: {
        type: String,
        enum: ['high', 'medium', 'low', 'browsing'],
      },
      buyer_stage: {
        type: String,
        enum: ['awareness', 'consideration', 'decision', 'retention'],
      },
      personalization_prompt: String,
      recommended_actions: [Schema.Types.Mixed],
    },

    // Generated variation
    variation: {
      variation_id: String,
      confidence: Number,
      layout_changes: [
        {
          section_id: String,
          current_priority: Number,
          new_priority: Number,
          reason: String,
        },
      ],
      content_variations: [
        {
          selector: String,
          element_type: String,
          original_text: String,
          new_text: String,
          reason: String,
        },
      ],
      cta_variations: [
        {
          selector: String,
          original_text: String,
          new_text: String,
          new_href: String,
          reason: String,
        },
      ],
      style_emphasis: [
        {
          selector: String,
          action: {
            type: String,
            enum: ['highlight', 'fade', 'none'],
          },
          reason: String,
        },
      ],
      reasoning: String,
    },

    // Cache control
    cache_duration: {
      type: Number,
      default: 43200, // 12 hours
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },

    // Analytics
    times_applied: {
      type: Number,
      default: 0,
    },
    last_applied_at: Date,

    // Status
    status: {
      type: String,
      enum: ['pending', 'generated', 'applied', 'expired', 'failed'],
      default: 'pending',
    },
    error_message: String,

    // Source tracking
    trigger_source: {
      type: String,
      enum: ['behavior', 'chat', 'manual', 'api'],
      default: 'behavior',
    },
    visitor_journey_id: String,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'personalizations',
    strict: false,
    minimize: false,
  }
);

// Compound indexes for fast lookups
PersonalizationSchema.index({ visitor_id: 1, page_url_hash: 1, organization_id: 1 });
PersonalizationSchema.index({ organization_id: 1, status: 1 });
PersonalizationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model('Personalization', PersonalizationSchema);
