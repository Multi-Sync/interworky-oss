// src/utils/api/flowResultsApi.js
/**
 * Flow Results API
 * Communicates with the backend dual-agent result generation system
 * (Creator Agent + Judge Agent with max 3 iterations)
 */

import { sendPostRequest } from './baseMethods';
import { getFlowAuthToken } from './flowAuthApi';

/**
 * Generate flow results using dual-agent system
 * The backend will:
 * 1. Creator Agent generates initial result
 * 2. Judge Agent evaluates the result
 * 3. Loop up to 3 times until approved or max turns reached
 *
 * @param {Object} options - Generation options
 * @param {string} options.flowId - The flow ID
 * @param {Object} options.flowConfig - The full flow configuration
 * @param {Object} options.collectedData - Data collected from the user
 * @param {string} options.sessionId - The session ID
 * @returns {Promise<Object>} - Generated result
 *   - { success: true, result: {...}, html: '...', quality_score: 9, iterations: 2, approved: true }
 */
export async function generateFlowResults({ flowId, flowConfig, collectedData, sessionId }) {
  const token = getFlowAuthToken();

  const result = await sendPostRequest(
    `api/flows/${flowId}/generate-results`,
    {
      flow_config: flowConfig,
      collected_data: collectedData,
      session_id: sessionId,
    },
    '',
    token || ''
  );

  if (!result) {
    throw new Error('Failed to generate results');
  }

  return result;
}

/**
 * Check if result generation was successful
 * @param {Object} result - Result from generateFlowResults
 * @returns {boolean} - True if successful
 */
export function isResultApproved(result) {
  return result?.success && result?.approved;
}

/**
 * Get the quality score from the result
 * @param {Object} result - Result from generateFlowResults
 * @returns {number} - Quality score (1-10)
 */
export function getQualityScore(result) {
  return result?.quality_score || 0;
}

/**
 * Get the number of iterations used
 * @param {Object} result - Result from generateFlowResults
 * @returns {number} - Number of iterations (1-3)
 */
export function getIterationCount(result) {
  return result?.iterations || 1;
}

/**
 * Get rendered HTML from the result
 * @param {Object} result - Result from generateFlowResults
 * @returns {string} - Rendered HTML content
 */
export function getRenderedHtml(result) {
  return result?.html || '';
}

/**
 * Get structured data from the result
 * @param {Object} result - Result from generateFlowResults
 * @returns {Object} - Structured result data
 */
export function getResultData(result) {
  return result?.result || {};
}
