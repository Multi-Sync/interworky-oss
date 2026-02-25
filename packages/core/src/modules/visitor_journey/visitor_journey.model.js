// src/modules/visitor_journey/visitor_journey.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const VisitorJourneySchema = new Schema(
  {
    // Unique identifiers
    id: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    organization_id: {
      type: String,
      required: true,
      index: true,
    },
    session_id: {
      type: String,
      required: true,
      index: true,
    },
    visitor_id: {
      type: String,
      required: true,
      index: true,
    },

    // Traffic source information
    traffic_source: {
      type: {
        type: String,
        enum: ['direct', 'search', 'social', 'referral', 'email', 'paid', 'other', 'internal'],
        required: true,
      },
      medium: String, // e.g., 'organic', 'cpc', 'social'
      source: String, // e.g., 'google', 'facebook', 'example.com'
      campaign: String, // campaign name if applicable
      keyword: String, // search keyword if from search
    },

    // Geographic and device information
    location: {
      country: String,
      country_code: String,
      region: String,
      city: String,
      timezone: String,
    },
    device: {
      type: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet'],
        required: true,
      },
      browser: String,
      os: String,
      screen_resolution: String,
    },

    // Journey tracking
    journey: {
      entry_page: {
        url: String,
        title: String,
        timestamp: Date,
      },
      current_page: {
        url: String,
        title: String,
        timestamp: Date,
      },
      pages: [
        {
          url: String,
          title: String,
          timestamp: Date,
          time_spent: Number, // seconds spent on page
          scroll_depth: Number, // percentage of page scrolled
          interactions: Number, // clicks, form interactions, etc.
        },
      ],
      total_time_spent: Number, // total session time in seconds
      page_views: Number,
      bounce_rate: Boolean,
    },

    // User intent and behavior
    intent: {
      search_queries: [String], // what they're searching for
      interests: [String], // inferred interests based on pages visited
      goals: [String], // potential goals (contact, purchase, info, etc.)
      urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
    },

    // Engagement metrics
    engagement: {
      is_returning: Boolean,
      visit_count: Number,
      last_visit: Date,
      engagement_score: Number, // calculated score 0-100
      conversion_events: [
        {
          event: String,
          timestamp: Date,
          value: Number,
        },
      ],
      bounce_events: [
        {
          timestamp: { type: Date, required: true },
          bounce_type: {
            type: String,
            enum: ['immediate', 'quick'],
            required: true,
          },
          page_url: { type: String, required: true },
          page_title: String,
          session_duration: Number, // seconds
          scroll_depth: Number, // percentage
          device: {
            type: {
              type: String,
            },
            browser: String,
            os: String,
            screen_resolution: String,
          },
          exit_trigger: {
            type: String,
            enum: ['page_unload', 'tab_hidden', 'page_hide', 'natural'],
          },
        },
      ],
      form_submissions: Number,
      downloads: Number,
      video_plays: Number,
      chat_interactions: Number,
    },

    // Exit information
    exit: {
      page: String,
      timestamp: Date,
      reason: {
        type: String,
        enum: ['natural', 'bounce', 'timeout', 'error'],
      },
    },

    // Session metadata
    session: {
      start_time: Date,
      end_time: Date,
      duration: Number, // total session duration in seconds
      is_active: Boolean,
      last_activity: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'visitor_journeys',
    strict: false, // Allow updates to nested fields with dot notation
    minimize: false, // Keep empty objects
  },
);

// Create compound indexes for better query performance
VisitorJourneySchema.index({ organization_id: 1, session_id: 1 });
VisitorJourneySchema.index({ organization_id: 1, visitor_id: 1 });
VisitorJourneySchema.index({ 'session.is_active': 1, 'session.last_activity': 1 });

module.exports = mongoose.model('VisitorJourney', VisitorJourneySchema);
