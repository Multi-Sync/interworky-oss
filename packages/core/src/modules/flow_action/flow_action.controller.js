// src/modules/flow_action/flow_action.controller.js
const { asyncHandler } = require('../../utils/asyncHandler');
const { processFlowAction } = require('./flow_action.service');
const Flow = require('../flow/flow.model');

/**
 * Process a flow completion action
 * Called by interworky-assistant after voice conversation ends
 * Supports both authenticated and unauthenticated requests (optionalAuth)
 */
exports.handleFlowAction = asyncHandler(async (req, res) => {
  const { action, prompt, collected_data, flow_id } = req.body;
  const userId = req.userId; // May be null if unauthenticated

  if (!action || !collected_data) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: action, collected_data',
    });
  }

  console.log(`[FlowAction] Processing action: ${action} for flow: ${flow_id}${userId ? ` (user: ${userId})` : ' (anonymous)'}`);

  // Fetch the flow config to get render_instructions
  let completionAction = null;
  if (flow_id) {
    const flow = await Flow.findOne({ flow_id });
    if (flow?.completion_action) {
      completionAction = flow.completion_action.toObject ? flow.completion_action.toObject() : flow.completion_action;
    }
  }

  const result = await processFlowAction({
    action,
    prompt,
    collectedData: collected_data,
    flowId: flow_id,
    completionAction,
  });

  res.status(200).json(result);
});
