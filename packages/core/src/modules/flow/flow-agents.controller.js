// src/modules/flow/flow-agents.controller.js
/**
 * Flow Agents Controller
 * Handles validation and result generation using the dual-agent system
 */

const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');
const { validateFlowData } = require('./agents/validationAgent');
const { orchestrateResultGeneration, quickGenerateResult } = require('./agents/resultOrchestrator');
const Flow = require('./flow.model');

/**
 * Validate collected flow data
 * Returns status (complete/needs_more) and follow-up questions if needed
 */
exports.validateFlowData = asyncHandler(async (req, res) => {
  const { flow_id } = req.params;
  const { collected_data, round = 1 } = req.body;

  // Get flow config
  const flow = await Flow.findOne({ flow_id });
  if (!flow) {
    throw new HttpError('Flow not found').NotFound();
  }

  console.log(`[FlowAgentsController] Validating data for flow ${flow_id}, round ${round}`);

  const validationResult = await validateFlowData(flow.toObject(), collected_data, round);

  console.log('[FlowAgentsController] Validation result:', {
    status: validationResult.status,
    ready: validationResult.ready,
    missingCount: validationResult.missing?.length || 0,
    questionsCount: validationResult.questions?.length || 0,
  });

  res.status(200).json({
    success: true,
    ...validationResult,
  });
});

/**
 * Generate flow results using dual-agent system (Creator + Judge)
 * Maximum 3 iterations until approved or max turns reached
 */
exports.generateResults = asyncHandler(async (req, res) => {
  const { flow_id } = req.params;
  const { flow_config, collected_data, session_id, quick_mode = false } = req.body;

  // Get flow from DB if not provided
  let flowConfig = flow_config;
  if (!flowConfig) {
    const flow = await Flow.findOne({ flow_id });
    if (!flow) {
      throw new HttpError('Flow not found').NotFound();
    }
    flowConfig = flow.toObject();
  }

  console.log(`[FlowAgentsController] Generating results for flow ${flow_id}`);
  console.log(`[FlowAgentsController] Quick mode: ${quick_mode}`);
  console.log(`[FlowAgentsController] Session ID: ${session_id}`);

  let result;
  if (quick_mode) {
    // Single iteration, no judge (for testing or speed priority)
    result = await quickGenerateResult(flowConfig, collected_data);
  } else {
    // Full dual-agent system with up to 3 iterations
    result = await orchestrateResultGeneration(flowConfig, collected_data, {
      maxIterations: 3,
      approvalThreshold: 8,
    });
  }

  console.log('[FlowAgentsController] Generation result:', {
    success: result.success,
    approved: result.approved,
    quality_score: result.quality_score,
    iterations: result.iterations,
  });

  res.status(200).json(result);
});

/**
 * Combined endpoint: Validate and optionally generate if complete
 * Useful for single-request flow completion
 */
exports.validateAndGenerate = asyncHandler(async (req, res) => {
  const { flow_id } = req.params;
  const { collected_data, session_id, round = 1 } = req.body;

  // Get flow config
  const flow = await Flow.findOne({ flow_id });
  if (!flow) {
    throw new HttpError('Flow not found').NotFound();
  }

  const flowConfig = flow.toObject();

  console.log(`[FlowAgentsController] Validate and generate for flow ${flow_id}, round ${round}`);

  // Step 1: Validate
  const validationResult = await validateFlowData(flowConfig, collected_data, round);

  // If not ready, return validation result with follow-up questions
  if (!validationResult.ready) {
    return res.status(200).json({
      success: true,
      phase: 'validation',
      status: 'needs_more',
      missing: validationResult.missing,
      questions: validationResult.questions,
      confidence: validationResult.confidence,
      reasoning: validationResult.reasoning,
      round: validationResult.round,
    });
  }

  // Step 2: Generate results (data is complete)
  console.log('[FlowAgentsController] Data validated, generating results...');
  const generationResult = await orchestrateResultGeneration(flowConfig, collected_data, {
    maxIterations: 3,
    approvalThreshold: 8,
  });

  res.status(200).json({
    success: true,
    phase: 'generation',
    status: 'complete',
    ...generationResult,
  });
});
