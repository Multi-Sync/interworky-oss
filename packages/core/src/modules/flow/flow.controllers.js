// src/modules/flow/flow.controllers.js
const Flow = require('./flow.model');
const HttpError = require('../../utils/HttpError');
const { asyncHandler } = require('../../utils/asyncHandler');
const tokenService = require('../token/token.service');
const flowResultService = require('./flow-result.service');
const { generateVisual } = require('./agents/visualCompanionAgent');

/**
 * Create a new flow
 */
exports.createFlow = asyncHandler(async (req, res) => {
  const { organization_id, flow_id } = req.body;

  // Check if flow_id already exists for this organization
  const existingFlow = await Flow.findOne({ organization_id, flow_id });
  if (existingFlow) {
    throw new HttpError('Flow with this ID already exists').BadRequest();
  }

  const flow = await Flow.create(req.body);
  res.status(201).json(flow);
});

/**
 * Get a flow by flow_id (public endpoint for embed script)
 * Populates author info from User collection
 */
exports.getFlowByFlowId = asyncHandler(async (req, res, next) => {
  const { flow_id } = req.params;

  // Use aggregation to get flow with author info
  const flows = await Flow.aggregate([
    { $match: { flow_id, is_active: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'author_id',
        foreignField: 'id',
        as: 'author_data',
      },
    },
    { $unwind: { path: '$author_data', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        author: {
          id: { $ifNull: ['$author_data.id', '$author_id'] },
          name: {
            $ifNull: [
              { $concat: ['$author_data.first_name', ' ', { $ifNull: ['$author_data.last_name', ''] }] },
              '$author_name',
            ],
          },
          avatar_url: { $ifNull: ['$author_data.avatar_url', null] },
        },
      },
    },
    { $project: { author_data: 0 } }, // Remove the raw lookup data
  ]);

  if (!flows.length) {
    return next(new HttpError('Flow not found').NotFound());
  }

  const flow = flows[0];

  // Increment usage count
  await Flow.updateOne({ flow_id }, { $inc: { usage_count: 1 } });

  res.status(200).json(flow);
});

/**
 * Get a flow by flow_id for a specific organization
 */
exports.getFlowByOrgAndFlowId = asyncHandler(async (req, res, next) => {
  const { organization_id, flow_id } = req.params;

  const flow = await Flow.findOne({ organization_id, flow_id });
  if (!flow) {
    return next(new HttpError('Flow not found').NotFound());
  }

  res.status(200).json(flow);
});

/**
 * Get all flows for an organization
 */
exports.getFlowsByOrganization = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;

  const flows = await Flow.find({ organization_id }).sort({ created_at: -1 });
  res.status(200).json(flows);
});

/**
 * Get all public flows (for marketplace/discovery)
 * Populates author info from User collection
 */
exports.getPublicFlows = asyncHandler(async (req, res) => {
  const flows = await Flow.aggregate([
    { $match: { is_public: true, is_active: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'author_id',
        foreignField: 'id',
        as: 'author_data',
      },
    },
    { $unwind: { path: '$author_data', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        flow_id: 1,
        name: 1,
        description: 1,
        'output_schema.type': 1,
        'output_schema.theme_color': 1,
        'output_schema.success_message': 1,
        usage_count: 1,
        token_cost: 1,
        created_at: 1,
        // Author info - use populated data or fallback to stored author_name
        author: {
          id: { $ifNull: ['$author_data.id', '$author_id'] },
          name: {
            $ifNull: [
              { $concat: ['$author_data.first_name', ' ', { $ifNull: ['$author_data.last_name', ''] }] },
              '$author_name',
            ],
          },
          avatar_url: { $ifNull: ['$author_data.avatar_url', null] },
        },
      },
    },
    { $sort: { usage_count: -1 } },
    { $limit: 50 },
  ]);

  res.status(200).json(flows);
});

/**
 * Update a flow
 */
exports.updateFlow = asyncHandler(async (req, res, next) => {
  const { organization_id, flow_id } = req.params;

  const flow = await Flow.findOneAndUpdate(
    { organization_id, flow_id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!flow) {
    return next(new HttpError('Flow not found').NotFound());
  }

  res.status(200).json(flow);
});

/**
 * Delete a flow
 */
exports.deleteFlow = asyncHandler(async (req, res, next) => {
  const { organization_id, flow_id } = req.params;

  const flow = await Flow.findOneAndDelete({ organization_id, flow_id });
  if (!flow) {
    return next(new HttpError('Flow not found').NotFound());
  }

  res.status(204).send();
});

/**
 * Duplicate a flow (for templates)
 */
exports.duplicateFlow = asyncHandler(async (req, res, next) => {
  const { flow_id } = req.params;
  const { organization_id, new_flow_id } = req.body;

  // Find the source flow
  const sourceFlow = await Flow.findOne({ flow_id });
  if (!sourceFlow) {
    return next(new HttpError('Source flow not found').NotFound());
  }

  // Check if new_flow_id already exists
  const existingFlow = await Flow.findOne({ organization_id, flow_id: new_flow_id });
  if (existingFlow) {
    throw new HttpError('Flow with this ID already exists').BadRequest();
  }

  // Create duplicate
  const flowData = sourceFlow.toObject();
  delete flowData._id;
  delete flowData.id;
  flowData.flow_id = new_flow_id;
  flowData.organization_id = organization_id;
  flowData.name = `${flowData.name} (Copy)`;
  flowData.is_public = false;
  flowData.usage_count = 0;

  const newFlow = await Flow.create(flowData);
  res.status(201).json(newFlow);
});

/**
 * Save flow output/result (for completed conversations)
 * Requires authentication - results are tied to user
 */
exports.saveFlowResult = asyncHandler(async (req, res) => {
  const { flow_id } = req.params;
  const { session_id, collected_data, completion_result, rendered_html, tokens_charged } = req.body;
  const userId = req.userId; // From auth middleware

  if (!userId) {
    throw new HttpError('Authentication required to save results').Unauthorized();
  }

  const result = await flowResultService.saveResult({
    userId,
    flowId: flow_id,
    sessionId: session_id,
    collectedData: collected_data,
    completionResult: completion_result,
    renderedHtml: rendered_html,
    tokensCharged: tokens_charged || 0,
  });

  res.status(200).json({
    success: true,
    result_id: result.result_id,
    duplicate: result.duplicate || false,
    message: result.duplicate ? 'Result already saved' : 'Result saved successfully',
  });
});

/**
 * Get all results for the current user
 */
exports.getUserResults = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { page = 1, per_page = 20, flow_id } = req.query;

  const results = await flowResultService.getUserResults(userId, {
    page: parseInt(page, 10),
    perPage: parseInt(per_page, 10),
    flowId: flow_id || null,
  });

  res.status(200).json(results);
});

/**
 * Get a specific result by ID
 */
exports.getResultById = asyncHandler(async (req, res) => {
  const { result_id } = req.params;
  const userId = req.userId;

  const result = await flowResultService.getResultById(result_id, userId);
  if (!result) {
    throw new HttpError('Result not found').NotFound();
  }

  res.status(200).json(result);
});

/**
 * Delete a result
 */
exports.deleteResult = asyncHandler(async (req, res) => {
  const { result_id } = req.params;
  const userId = req.userId;

  const result = await flowResultService.deleteResult(result_id, userId);
  if (!result.deleted) {
    throw new HttpError('Result not found').NotFound();
  }

  res.status(200).json({ success: true, message: 'Result deleted successfully' });
});

/**
 * Charge tokens for flow usage (called when flow session completes)
 * This is called after auth gate, before showing results
 */
exports.chargeFlowUsage = asyncHandler(async (req, res) => {
  const { flow_id } = req.params;
  const { session_id } = req.body;
  const userId = req.userId; // From auth middleware

  // Get flow to check cost and author
  const flow = await Flow.findOne({ flow_id });
  if (!flow) {
    throw new HttpError('Flow not found').NotFound();
  }

  // If flow is free, no charge needed
  if (!flow.token_cost || flow.token_cost === 0) {
    return res.status(200).json({
      success: true,
      charged: false,
      message: 'Flow is free, no charge applied',
    });
  }

  // Deduct tokens from user, credit to creator
  const result = await tokenService.deductFlowUsage(
    userId,
    flow_id,
    flow.token_cost,
    session_id,
    flow.author_id
  );

  if (!result.success) {
    throw new HttpError(result.error || 'Insufficient tokens').PaymentRequired();
  }

  res.status(200).json({
    success: true,
    charged: true,
    amount: flow.token_cost,
    new_balance: result.balance,
  });
});

/**
 * Generate visual companion for voice session
 * Called during voice conversation to create dynamic visuals
 * This is a public endpoint - no auth required (visuals are ephemeral)
 */
exports.generateVisualCompanion = asyncHandler(async (req, res) => {
  const { flow_id } = req.params;
  const {
    current_agent,
    conversation_history,
    collected_data,
    turn_number,
    last_user_message,
    last_assistant_message,
  } = req.body;

  // Get flow config
  const flow = await Flow.findOne({ flow_id, is_active: true });
  if (!flow) {
    throw new HttpError('Flow not found').NotFound();
  }

  // Generate visual
  const visual = await generateVisual({
    flowId: flow_id,
    flowConfig: {
      name: flow.name,
      description: flow.description,
      output_schema: flow.output_schema,
      agents: flow.agents,
    },
    currentAgent: current_agent,
    conversationHistory: conversation_history || [],
    collectedData: collected_data || {},
    turnNumber: turn_number || 1,
    lastUserMessage: last_user_message || '',
    lastAssistantMessage: last_assistant_message || '',
  });

  res.status(200).json(visual);
});
