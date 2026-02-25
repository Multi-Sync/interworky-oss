// src/utils/api/flowValidationApi.js
/**
 * Flow Validation API
 * Communicates with the backend validation agent to check data completeness
 */

import { sendPostRequest } from './baseMethods';
import { getFlowAuthToken } from './flowAuthApi';

/**
 * Validate collected flow data for completeness
 * @param {Object} options - Validation options
 * @param {string} options.flowId - The flow ID
 * @param {Object} options.collectedData - Data collected from the user
 * @param {number} options.round - Current validation round (1-3)
 * @returns {Promise<Object>} - Validation result
 *   - { status: 'complete', ready: true } if all data is collected
 *   - { status: 'needs_more', ready: false, questions: [...], missing: [...] } if more data needed
 */
export async function validateFlowData({ flowId, collectedData, round = 1 }) {
  const token = getFlowAuthToken();

  const result = await sendPostRequest(
    `api/flows/${flowId}/validate`,
    {
      collected_data: collectedData,
      round,
    },
    '',
    token || ''
  );

  if (!result) {
    // Fallback: if validation fails, assume complete to not block user
    return {
      status: 'complete',
      ready: true,
      fallback: true,
      message: 'Validation service unavailable, proceeding with results',
    };
  }

  return result;
}

/**
 * Check if validation result indicates more data is needed
 * @param {Object} validationResult - Result from validateFlowData
 * @returns {boolean} - True if more questions need to be asked
 */
export function needsMoreData(validationResult) {
  return validationResult?.status === 'needs_more' && !validationResult?.ready;
}

/**
 * Get follow-up questions from validation result
 * @param {Object} validationResult - Result from validateFlowData
 * @returns {string[]} - Array of questions to ask
 */
export function getFollowUpQuestions(validationResult) {
  return validationResult?.questions || [];
}

/**
 * Check if max validation rounds reached
 * @param {number} round - Current round
 * @param {number} maxRounds - Maximum allowed rounds (default 3)
 * @returns {boolean} - True if max rounds reached
 */
export function isMaxRoundsReached(round, maxRounds = 3) {
  return round >= maxRounds;
}

/**
 * Combined validate and generate in a single request
 * If data is complete, returns generated result; otherwise returns follow-up questions
 * @param {Object} options - Options
 * @param {string} options.flowId - The flow ID
 * @param {Object} options.collectedData - Data collected from the user
 * @param {string} options.sessionId - The session ID
 * @param {number} options.round - Current validation round (1-3)
 * @returns {Promise<Object>} - Result with phase ('validation' or 'generation')
 */
export async function validateAndGenerate({ flowId, collectedData, sessionId, round = 1 }) {
  const token = getFlowAuthToken();

  const result = await sendPostRequest(
    `api/flows/${flowId}/validate-and-generate`,
    {
      collected_data: collectedData,
      session_id: sessionId,
      round,
    },
    '',
    token || ''
  );

  if (!result) {
    return {
      success: false,
      phase: 'error',
      message: 'Validation and generation service unavailable',
    };
  }

  return result;
}
