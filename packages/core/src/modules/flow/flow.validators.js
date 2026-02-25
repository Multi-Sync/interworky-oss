// src/modules/flow/flow.validators.js
const Joi = require('joi');

// Agent validation schema
const agentSchema = Joi.object({
  name: Joi.string().required(),
  instructions: Joi.string().required(),
  greeting: Joi.string().allow(null).default(null),
  voice: Joi.string()
    .valid('alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse')
    .allow(null)
    .default(null),
  tools: Joi.array().items(Joi.string()).default([]),
  handoffsTo: Joi.array().items(Joi.string()).default([]),
});

// Tool parameter validation schema
const toolParameterSchema = Joi.object({
  type: Joi.string().required(),
  description: Joi.string(),
  required: Joi.boolean().default(false),
  enum: Joi.array().items(Joi.string()),
});

// Tool validation schema
const toolSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  parameters: Joi.object().pattern(Joi.string(), toolParameterSchema).default({}),
});

// Output block validation schema
const outputBlockSchema = Joi.object({
  type: Joi.string()
    .valid('header', 'section', 'list', 'html', 'table', 'text', 'download')
    .required(),
  title: Joi.string(),
  dataKey: Joi.string(),
  template: Joi.string(),
  fields: Joi.array().items(Joi.string()).default([]),
});

// AI config validation schema
const aiConfigSchema = Joi.object({
  model: Joi.string().default('gpt-4o'),
  temperature: Joi.number().min(0).max(2).default(0.7),
  max_tokens: Joi.number().default(4096),
});

// Completion action validation schema
const completionActionSchema = Joi.object({
  type: Joi.string().valid('dual-agent', 'ws-assistant', 'webhook', 'none').default('none'),
  action: Joi.string().allow(null, ''),
  analysis_prompt: Joi.string().allow(null, ''),
  prompt_template: Joi.string().allow(null, ''),
  render_instructions: Joi.string().allow(null, ''),
  ai_config: aiConfigSchema.default({}),
  webhook_url: Joi.string().allow(null, ''),
  output_blocks: Joi.array().items(outputBlockSchema).default([]),
});

// UI configuration validation schema
const uiConfigSchema = Joi.object({
  animation: Joi.string()
    .valid('slide-up', 'fade-in', 'zoom', 'none')
    .default('slide-up'),
  showTranscript: Joi.boolean().default(false),
  showTimer: Joi.boolean().default(true),
  showAgentName: Joi.boolean().default(true),
});

// Output schema validation - type is now any string for extensibility
const outputSchemaValidation = Joi.object({
  type: Joi.string().default('custom'),
  success_message: Joi.string().allow(null).default(null),
  theme_color: Joi.string().default('#10b981'),
  loading_title: Joi.string().allow(null).default(null),
  loading_subtitle: Joi.string().allow(null).default(null),
  blocks: Joi.array().items(outputBlockSchema).default([]),
  downloadFormats: Joi.array()
    .items(Joi.string().valid('json', 'pdf', 'html', 'txt', 'doc', 'copy'))
    .default(['copy']),
  template: Joi.string().allow(null),
  // Data mapping for transforming tool output to structured data
  dataMapping: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      source: Joi.string().required(),
      merge: Joi.string().valid('single', 'array').default('array'),
      field: Joi.string().allow(null),
    })
  ).allow(null).default(null),
  // Theme from theme registry (professional, minimal, modern, playful, dark, corporate)
  theme: Joi.string().default('professional'),
  // Layout from layout registry (centered, fullscreen, split, modal, sidebar, compact)
  layout: Joi.string().default('centered'),
  // UI configuration options
  ui: uiConfigSchema.default({}),
});

// Voice config validation - all OpenAI Realtime API voices
const voiceConfigSchema = Joi.object({
  voice: Joi.string()
    .valid('alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse')
    .default('sage'),
  model: Joi.string().default('gpt-4o-realtime-preview-2024-12-17'),
  silence_duration_ms: Joi.number().default(500),
});

// Create flow validation
const createFlowSchema = Joi.object({
  organization_id: Joi.string().required(),
  flow_id: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'flow_id must contain only lowercase letters, numbers, and hyphens',
    }),
  name: Joi.string().required(),
  description: Joi.string().default(''),
  initial_greeting: Joi.string().allow(null).default(null),
  start_agent: Joi.string().required(),
  agents: Joi.object().pattern(Joi.string(), agentSchema).required(),
  tools: Joi.object().pattern(Joi.string(), toolSchema).default({}),
  output_schema: outputSchemaValidation.required(),
  completion_action: completionActionSchema.allow(null).default(null),
  voice_config: voiceConfigSchema.default({}),
  is_active: Joi.boolean().default(true),
  is_public: Joi.boolean().default(false),
  // Author/Creator fields
  author_id: Joi.string().allow(null).default(null),
  author_name: Joi.string().allow(null).default(null),
  // Token economy
  token_cost: Joi.number().min(0).default(500),
  requires_auth: Joi.boolean().default(true),
});

// Update flow validation
const updateFlowSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string(),
  initial_greeting: Joi.string().allow(null),
  start_agent: Joi.string(),
  agents: Joi.object().pattern(Joi.string(), agentSchema),
  tools: Joi.object().pattern(Joi.string(), toolSchema),
  output_schema: outputSchemaValidation,
  completion_action: completionActionSchema.allow(null),
  voice_config: voiceConfigSchema,
  is_active: Joi.boolean(),
  is_public: Joi.boolean(),
  // Author/Creator fields
  author_id: Joi.string().allow(null),
  author_name: Joi.string().allow(null),
  // Token economy
  token_cost: Joi.number().min(0),
  requires_auth: Joi.boolean(),
});

// Duplicate flow validation
const duplicateFlowSchema = Joi.object({
  organization_id: Joi.string().required(),
  new_flow_id: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'new_flow_id must contain only lowercase letters, numbers, and hyphens',
    }),
});

// Save flow result validation
const saveFlowResultSchema = Joi.object({
  session_id: Joi.string().required(),
  collected_data: Joi.object().default({}),
  completion_result: Joi.object().allow(null).default(null),
  rendered_html: Joi.string().allow(null).default(null),
  tokens_charged: Joi.number().min(0).default(0),
});

// Get user results query validation
const getUserResultsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  per_page: Joi.number().integer().min(1).max(100).default(20),
  flow_id: Joi.string().allow(null, ''),
});

// Charge flow usage validation
const chargeFlowUsageSchema = Joi.object({
  session_id: Joi.string().required(),
});

// Validate flow data validation
const validateFlowDataSchema = Joi.object({
  collected_data: Joi.object().required(),
  round: Joi.number().integer().min(1).max(3).default(1),
});

// Generate flow results validation
const generateFlowResultsSchema = Joi.object({
  flow_config: Joi.object().allow(null).default(null),
  collected_data: Joi.object().required(),
  session_id: Joi.string().required(),
  quick_mode: Joi.boolean().default(false),
});

// Validate and generate validation
const validateAndGenerateSchema = Joi.object({
  collected_data: Joi.object().required(),
  session_id: Joi.string().required(),
  round: Joi.number().integer().min(1).max(3).default(1),
});

// Validator middleware factory
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    return res.status(400).json({ error: errorMessage });
  }
  next();
};

// Param validators
const validateFlowId = (req, res, next) => {
  const { flow_id } = req.params;
  if (!flow_id || !/^[a-z0-9-]+$/.test(flow_id)) {
    return res.status(400).json({ error: 'Invalid flow_id format' });
  }
  next();
};

const validateOrganizationId = (req, res, next) => {
  const { organization_id } = req.params;
  if (!organization_id) {
    return res.status(400).json({ error: 'organization_id is required' });
  }
  next();
};

const validateResultId = (req, res, next) => {
  const { result_id } = req.params;
  if (!result_id || !/^res_[a-z0-9]+$/.test(result_id)) {
    return res.status(400).json({ error: 'Invalid result_id format' });
  }
  next();
};

// Query validator middleware factory
const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    return res.status(400).json({ error: errorMessage });
  }
  req.query = value; // Use validated/defaulted values
  next();
};

module.exports = {
  createFlowValidator: validate(createFlowSchema),
  updateFlowValidator: validate(updateFlowSchema),
  duplicateFlowValidator: validate(duplicateFlowSchema),
  saveFlowResultValidator: validate(saveFlowResultSchema),
  chargeFlowUsageValidator: validate(chargeFlowUsageSchema),
  getUserResultsValidator: validateQuery(getUserResultsQuerySchema),
  validateFlowDataValidator: validate(validateFlowDataSchema),
  generateFlowResultsValidator: validate(generateFlowResultsSchema),
  validateAndGenerateValidator: validate(validateAndGenerateSchema),
  validateFlowId,
  validateOrganizationId,
  validateResultId,
};
