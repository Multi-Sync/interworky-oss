// src/assistant/modes/flowEngine/completionActions.js
/**
 * Completion Actions - Handlers for post-voice-conversation processing
 * These actions run after the voice conversation ends and before showing results
 *
 * Completion Action Types:
 * - 'dual-agent': Uses Creator + Judge agents with validation (recommended)
 * - 'ws-assistant': Legacy single-pass OpenAI Chat API
 * - 'webhook': Custom webhook URL
 * - 'none': No processing, show raw collected data
 *
 * The API returns:
 * - data: Structured analysis data
 * - html: Pre-rendered HTML from the AI
 * - quality_score: (dual-agent only) Quality score 1-10
 * - approved: (dual-agent only) Whether result passed quality threshold
 */

import { logger } from '../../../utils/logger';
import { generateFlowResults, isResultApproved, getQualityScore } from '../../../utils/api/flowResultsApi';
import { getFlowAuthToken } from '../../../utils/api/flowAuthApi';

/**
 * Process completion action based on flow config
 * @param {Object} collectedData - Data collected during voice conversation
 * @param {Object} completionAction - Completion action config from flow
 * @param {Object} flowConfig - Full flow configuration
 * @returns {Object} - Results including data and pre-rendered HTML
 */
export async function processCompletionAction(collectedData, completionAction, flowConfig) {
  if (!completionAction || completionAction.type === 'none') {
    return { collectedData, completionResults: null, html: null };
  }

  // Check if any data was collected - skip API call if empty
  const hasData = collectedData && Object.keys(collectedData).length > 0;
  if (!hasData) {
    logger.info('COMPLETION_ACTION_000', 'No data collected, skipping completion action', {
      type: completionAction.type,
    });
    return {
      collectedData: {},
      completionResults: null,
      html: null,
      noDataCollected: true,
    };
  }

  logger.info('COMPLETION_ACTION_001', 'Processing completion action', {
    type: completionAction.type,
    action: completionAction.action,
  });

  try {
    switch (completionAction.type) {
      case 'dual-agent':
        return await handleDualAgentAction(collectedData, completionAction, flowConfig);

      case 'ws-assistant':
        return await handleWsAssistantAction(collectedData, completionAction, flowConfig);

      case 'webhook':
        return await handleWebhookAction(collectedData, completionAction, flowConfig);

      default:
        logger.warn('COMPLETION_ACTION_002', 'Unknown completion action type', {
          type: completionAction.type,
        });
        return { collectedData, completionResults: null, html: null };
    }
  } catch (error) {
    logger.error('COMPLETION_ACTION_003', 'Completion action failed', {
      error: error.message,
    });
    return {
      collectedData,
      completionResults: null,
      html: null,
      error: error.message,
    };
  }
}

/**
 * Handle ws-assistant completion action
 * Sends collected data to interworky-core for processing (AI analysis + HTML generation)
 */
async function handleWsAssistantAction(collectedData, completionAction, flowConfig) {
  const apiUrl = process.env.NODE_PUBLIC_API_URL || 'http://localhost:3015';
  const { action, prompt_template } = completionAction;

  // Build the prompt by replacing {{collected_data}} placeholder
  const dataString = JSON.stringify(collectedData, null, 2);
  const prompt = prompt_template
    ? prompt_template.replace('{{collected_data}}', dataString)
    : `Process this data: ${dataString}`;

  logger.info('COMPLETION_ACTION_004', 'Calling flow-action API', {
    action,
    apiUrl,
  });

  const response = await fetch(`${apiUrl}/api/flow-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      prompt,
      collected_data: collectedData,
      flow_id: flowConfig.flow_id,
    }),
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  logger.info('COMPLETION_ACTION_005', 'API response received', {
    hasData: !!result.data,
    hasHtml: !!result.html,
  });

  return {
    collectedData,
    completionResults: result.data,
    html: result.html,
  };
}

/**
 * Handle webhook completion action
 * Sends collected data to a custom webhook URL
 */
async function handleWebhookAction(collectedData, completionAction, flowConfig) {
  const { webhook_url } = completionAction;

  if (!webhook_url) {
    throw new Error('Webhook URL not configured');
  }

  logger.info('COMPLETION_ACTION_006', 'Calling webhook', {
    url: webhook_url,
  });

  const response = await fetch(webhook_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      collected_data: collectedData,
      flow_id: flowConfig.flow_id,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  return {
    collectedData,
    completionResults: result.data || result,
    html: result.html || null,
  };
}

/**
 * Handle dual-agent completion action (Creator + Judge)
 * Uses the new dual-agent system with quality validation
 * Max 3 iterations until approved (quality_score >= 8) or max turns reached
 */
async function handleDualAgentAction(collectedData, completionAction, flowConfig) {
  logger.info('COMPLETION_ACTION_007', 'Using dual-agent system', {
    flowId: flowConfig.flow_id,
  });

  // Check if user is authenticated (required for dual-agent API)
  const token = getFlowAuthToken();
  if (!token) {
    logger.warn('COMPLETION_ACTION_008', 'No auth token, falling back to ws-assistant');
    return await handleWsAssistantAction(collectedData, completionAction, flowConfig);
  }

  try {
    // Generate session ID for tracking
    const sessionId = `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result = await generateFlowResults({
      flowId: flowConfig.flow_id,
      flowConfig: flowConfig,
      collectedData: collectedData,
      sessionId: sessionId,
    });

    if (!result || !result.success) {
      throw new Error(result?.error || 'Failed to generate results');
    }

    logger.info('COMPLETION_ACTION_009', 'Dual-agent result received', {
      approved: result.approved,
      qualityScore: result.quality_score,
      iterations: result.iterations,
    });

    return {
      collectedData,
      completionResults: result.result,
      html: result.html,
      qualityScore: result.quality_score,
      approved: result.approved,
      iterations: result.iterations,
      accuracyScore: result.accuracy_score,
      completenessScore: result.completeness_score,
      formattingScore: result.formatting_score,
    };
  } catch (error) {
    logger.error('COMPLETION_ACTION_010', 'Dual-agent failed, falling back to ws-assistant', {
      error: error.message,
    });
    // Fallback to legacy system on error
    return await handleWsAssistantAction(collectedData, completionAction, flowConfig);
  }
}
