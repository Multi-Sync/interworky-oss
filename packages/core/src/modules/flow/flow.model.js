// src/modules/flow/flow.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

// Agent schema for flow configuration
const agentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    instructions: {
      type: String,
      required: true,
    },
    // Optional greeting that agent speaks when they take over
    greeting: {
      type: String,
      default: null,
    },
    // Optional voice for this specific agent (overrides flow-level voice)
    voice: {
      type: String,
      enum: ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse'],
      default: null,
    },
    tools: {
      type: [String],
      default: [],
    },
    handoffsTo: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

// Tool parameter schema
const toolParameterSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    required: {
      type: Boolean,
      default: false,
    },
    enum: {
      type: [String],
      default: undefined,
    },
  },
  { _id: false }
);

// Tool schema for flow configuration
const toolSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    parameters: {
      type: Map,
      of: toolParameterSchema,
      default: {},
    },
  },
  { _id: false }
);

// Output block schema for rendering
const outputBlockSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['header', 'section', 'list', 'html', 'table', 'text', 'download'],
      required: true,
    },
    title: {
      type: String,
    },
    dataKey: {
      type: String,
    },
    template: {
      type: String,
    },
    fields: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

// AI configuration for completion action
const aiConfigSchema = new Schema(
  {
    model: {
      type: String,
      default: 'gpt-4o',
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2,
    },
    max_tokens: {
      type: Number,
      default: 4096,
    },
  },
  { _id: false }
);

// Completion action schema - what to do after voice conversation
const completionActionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['dual-agent', 'ws-assistant', 'webhook', 'none'],
      default: 'none',
    },
    action: {
      type: String, // Action identifier (for logging/tracking)
    },
    // System prompt for AI analysis - fully configurable per flow
    analysis_prompt: {
      type: String, // Full system prompt for analyzing collected data
    },
    prompt_template: {
      type: String, // User prompt template with {{collected_data}} placeholder
    },
    render_instructions: {
      type: String, // Instructions for AI to generate HTML output
    },
    // AI configuration
    ai_config: {
      type: aiConfigSchema,
      default: () => ({}),
    },
    webhook_url: {
      type: String, // For webhook type
    },
    output_blocks: {
      type: [outputBlockSchema], // Additional blocks from completion action
      default: [],
    },
  },
  { _id: false }
);

// Output schema for flow results
const outputSchemaDefinition = new Schema(
  {
    type: {
      type: String, // No enum - any string allowed for extensibility
      default: 'custom',
    },
    // Custom success message displayed after completion
    success_message: {
      type: String, // e.g., "Your Macro Plan is Ready!"
      default: null,
    },
    // Theme color for success banner
    theme_color: {
      type: String, // Hex color e.g., "#10b981"
      default: '#10b981',
    },
    // Loading state messages (shown while processing completion action)
    loading_title: {
      type: String, // e.g., "Calculating Your Macros..."
      default: null,
    },
    loading_subtitle: {
      type: String, // e.g., "Analyzing your body metrics, goals, and lifestyle"
      default: null,
    },
    blocks: {
      type: [outputBlockSchema],
      default: [],
    },
    downloadFormats: {
      type: [String],
      default: ['copy'],
    },
    template: {
      type: String,
      default: null,
    },
    // Data mapping for transforming tool output to structured data
    // Maps output keys to tool sources, e.g., { "contact": { "source": "save_contact_info", "merge": "single" } }
    dataMapping: {
      type: Schema.Types.Mixed,
      default: null,
    },
    // Theme ID from theme registry (professional, minimal, modern, playful, dark, corporate)
    theme: {
      type: String,
      default: 'professional',
    },
    // Layout ID from layout registry (centered, fullscreen, split, modal, sidebar, compact)
    layout: {
      type: String,
      default: 'centered',
    },
    // UI configuration options
    ui: {
      type: new Schema(
        {
          animation: {
            type: String, // slide-up, fade-in, zoom, none
            default: 'slide-up',
          },
          showTranscript: {
            type: Boolean,
            default: false,
          },
          showTimer: {
            type: Boolean,
            default: true,
          },
          showAgentName: {
            type: Boolean,
            default: true,
          },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { _id: false }
);

// Main Flow schema
const flowSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      default: uuidv4,
      index: true,
    },
    flow_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    organization_id: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    // Initial greeting spoken when flow starts (before user speaks)
    initial_greeting: {
      type: String,
      default: null,
    },
    start_agent: {
      type: String,
      required: true,
    },
    agents: {
      type: Map,
      of: agentSchema,
      required: true,
    },
    tools: {
      type: Map,
      of: toolSchema,
      default: {},
    },
    output_schema: {
      type: outputSchemaDefinition,
      required: true,
    },
    completion_action: {
      type: completionActionSchema,
      default: null,
    },
    voice_config: {
      voice: {
        type: String,
        // All available OpenAI Realtime API voices
        enum: ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse'],
        default: 'sage',
      },
      model: {
        type: String,
        default: 'gpt-4o-realtime-preview-2024-12-17',
      },
      silence_duration_ms: {
        type: Number,
        default: 500,
      },
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_public: {
      type: Boolean,
      default: false,
    },
    usage_count: {
      type: Number,
      default: 0,
    },
    // Author/Creator information
    author_id: {
      type: String,
      default: null,
      index: true,
    },
    author_name: {
      type: String,
      default: null,
    },
    // Token cost per session (default 500 tokens)
    token_cost: {
      type: Number,
      default: 500,
      min: 0,
    },
    // Whether login is required before showing results
    requires_auth: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'flows',
  }
);

// Index for efficient queries
flowSchema.index({ organization_id: 1, flow_id: 1 });
flowSchema.index({ is_public: 1, is_active: 1 });

module.exports = mongoose.model('Flow', flowSchema);
