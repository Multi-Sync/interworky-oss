// src/modules/assistant_info/assistant_info.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');
const assistantInfoSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      default: uuidv4,
      index: true,
    },
    organization_id: {
      type: String,
      required: true,
    },
    assistant_id: {
      type: String,
      required: true,
      index: true,
    },
    assistant_name: {
      type: String,
      default: 'Carla',
    },
    first_message: {
      type: String,
      default: 'Hi, How can I help you?',
    },
    opening_statement: {
      type: String,
      default: 'Thank you for visiting us today',
    },
    assistant_personality: {
      type: String,
      default: 'Welcoming',
    },
    assistant_knowledge: {
      type: String,
      default:
        'Please keep responses concise (under 30 words). Use natural, conversational language. Format in markdown when appropriate. Ask clarifying questions if needed. Avoid robotic responses.',
    },
    primary_color: {
      type: String,
      default: '#ffffff',
    },
    secondary_color: {
      type: String,
      default: '#058A7C',
    },
    error_color: {
      type: String,
      default: '#ff6666',
    },
    text_primary_color: {
      type: String,
      default: '#000000',
    },
    text_secondary_color: {
      type: String,
      default: '#ffffff',
    },
    assistant_image_url: {
      type: String,
      default: 'https://storage.googleapis.com/multisync/interworky-gpt/Carla.png',
    },
    appointments_enabled: {
      type: Boolean,
      default: false,
    },
    voice_enabled: {
      type: Boolean,
      default: true,
    },
    contact_info_required: {
      type: Boolean,
      default: true,
    },
    premium: {
      type: Boolean,
      default: false,
    },
    dim_screen: {
      type: Boolean,
      default: true,
    },
    event_type: {
      type: String,
      enum: ['online', 'in-person', 'phone'],
      default: 'online',
    },
    business_address: {
      type: String,
      default: '',
    },
    real_time_instructions: {
      type: [String],
      default: [],
    },
    analytics_enabled: {
      type: Boolean,
      default: true,
    },
    cx_enabled: {
      type: Boolean,
      default: true,
    },
    monitoring_enabled: {
      type: Boolean,
      default: true,
    },
    auto_fix_enabled: {
      type: Boolean,
      default: false,
    },
    personalization_enabled: {
      type: Boolean,
      default: true,
    },
    // UTM-based personalization variations (pre-generated)
    // Note: Uses camelCase to match AI-generated output from ws-assistant
    personalization_variations: {
      type: Map,
      of: new Schema(
        {
          keywords: {
            type: [String],
            default: [],
          },
          variation: {
            layout_changes: [
              {
                sectionId: String,
                currentPriority: Number,
                newPriority: Number,
                reason: String,
              },
            ],
            content_variations: [
              {
                selector: String,
                elementType: String,
                originalText: String,
                newText: String,
                reason: String,
              },
            ],
            cta_variations: [
              {
                selector: String,
                originalText: String,
                newText: String,
                newHref: String,
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
          },
          confidence: {
            type: Number,
            min: 0,
            max: 1,
          },
          generated_at: Date,
          source_content_hash: String,
        },
        { _id: false }
      ),
      default: {},
    },
    personalization_page_schema: {
      type: Schema.Types.Mixed,
      default: null,
    },
    personalization_last_generated: {
      type: Date,
      default: null,
    },
    view_type: {
      type: String,
      enum: ['normal', 'landing', 'badge'],
      default: 'normal',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'assistant_info',
  },
);

module.exports = mongoose.model('AssistantInfo', assistantInfoSchema);
