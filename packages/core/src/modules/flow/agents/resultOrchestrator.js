/**
 * Result Orchestrator
 * Manages the dual-agent result generation loop (Creator + Judge)
 * Maximum 3 iterations until approved or max turns reached
 */

const { generateResult } = require('./creatorAgent');
const { evaluateResult, formatFeedbackForCreator } = require('./judgeAgent');

const MAX_ITERATIONS = 3;
const APPROVAL_THRESHOLD = 8;

/**
 * Generate results using the dual-agent system
 * @param {Object} flowConfig - The flow configuration
 * @param {Object} collectedData - Data collected from the user
 * @param {Object} options - Additional options
 * @param {number} options.maxIterations - Maximum iterations (default 3)
 * @param {number} options.approvalThreshold - Minimum score for approval (default 8)
 * @returns {Promise<Object>} - Final result with quality metadata
 */
async function orchestrateResultGeneration(flowConfig, collectedData, options = {}) {
  const maxIterations = options.maxIterations || MAX_ITERATIONS;
  const approvalThreshold = options.approvalThreshold || APPROVAL_THRESHOLD;

  console.log('[ResultOrchestrator] Starting dual-agent result generation');
  console.log('[ResultOrchestrator] Max iterations:', maxIterations);
  console.log('[ResultOrchestrator] Approval threshold:', approvalThreshold);

  let bestResult = null;
  let bestScore = 0;
  let judgeFeedback = null;
  let finalEvaluation = null;
  const iterationHistory = [];

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    console.log(`[ResultOrchestrator] === Iteration ${iteration}/${maxIterations} ===`);

    try {
      // Step 1: Creator Agent generates/refines result
      console.log('[ResultOrchestrator] Creator Agent generating result...');
      const creatorResult = await generateResult(
        flowConfig,
        collectedData,
        judgeFeedback,
        iteration
      );
      console.log('[ResultOrchestrator] Creator result confidence:', creatorResult.confidence);

      // Step 2: Judge Agent evaluates the result
      console.log('[ResultOrchestrator] Judge Agent evaluating result...');
      const evaluation = await evaluateResult(
        flowConfig,
        collectedData,
        creatorResult,
        iteration
      );
      console.log('[ResultOrchestrator] Judge evaluation:', {
        approved: evaluation.approved,
        score: evaluation.score,
        accuracy: evaluation.accuracy_score,
        completeness: evaluation.completeness_score,
        formatting: evaluation.formatting_score,
      });

      // Track iteration history
      iterationHistory.push({
        iteration,
        creator: {
          title: creatorResult.title,
          confidence: creatorResult.confidence,
        },
        judge: {
          approved: evaluation.approved,
          score: evaluation.score,
          accuracy_score: evaluation.accuracy_score,
          completeness_score: evaluation.completeness_score,
          formatting_score: evaluation.formatting_score,
          issues: evaluation.issues,
          feedback: evaluation.feedback,
        },
      });

      // Track best result
      if (evaluation.score > bestScore) {
        bestScore = evaluation.score;
        bestResult = creatorResult;
        finalEvaluation = evaluation;
      }

      // Check if approved
      if (evaluation.approved && evaluation.score >= approvalThreshold) {
        console.log(`[ResultOrchestrator] Result APPROVED at iteration ${iteration}`);
        return {
          success: true,
          approved: true,
          result: creatorResult.data,
          html: creatorResult.html,
          title: creatorResult.title,
          summary: creatorResult.summary,
          quality_score: evaluation.score,
          accuracy_score: evaluation.accuracy_score,
          completeness_score: evaluation.completeness_score,
          formatting_score: evaluation.formatting_score,
          iterations: iteration,
          history: iterationHistory,
        };
      }

      // Prepare feedback for next iteration
      if (iteration < maxIterations) {
        judgeFeedback = formatFeedbackForCreator(evaluation);
        console.log('[ResultOrchestrator] Preparing feedback for next iteration');
      }
    } catch (error) {
      console.error(`[ResultOrchestrator] Error in iteration ${iteration}:`, error);
      iterationHistory.push({
        iteration,
        error: error.message,
      });

      // If we have a previous result, continue with it
      if (bestResult) {
        console.log('[ResultOrchestrator] Using best previous result due to error');
        break;
      }

      // If no result at all, throw
      if (iteration === maxIterations) {
        throw error;
      }
    }
  }

  // Max iterations reached - return best result
  console.log('[ResultOrchestrator] Max iterations reached, returning best result');
  console.log('[ResultOrchestrator] Best score achieved:', bestScore);

  if (!bestResult) {
    throw new Error('Failed to generate result after all iterations');
  }

  return {
    success: true,
    approved: bestScore >= approvalThreshold,
    result: bestResult.data,
    html: bestResult.html,
    title: bestResult.title,
    summary: bestResult.summary,
    quality_score: bestScore,
    accuracy_score: finalEvaluation?.accuracy_score || 0,
    completeness_score: finalEvaluation?.completeness_score || 0,
    formatting_score: finalEvaluation?.formatting_score || 0,
    iterations: maxIterations,
    max_iterations_reached: true,
    history: iterationHistory,
  };
}

/**
 * Quick result generation (single iteration, no judge)
 * Use for testing or when speed is more important than quality
 * @param {Object} flowConfig - The flow configuration
 * @param {Object} collectedData - Data collected from the user
 * @returns {Promise<Object>} - Generated result
 */
async function quickGenerateResult(flowConfig, collectedData) {
  console.log('[ResultOrchestrator] Quick generation (single iteration, no judge)');

  const creatorResult = await generateResult(flowConfig, collectedData, null, 1);

  return {
    success: true,
    approved: true,
    result: creatorResult.data,
    html: creatorResult.html,
    title: creatorResult.title,
    summary: creatorResult.summary,
    quality_score: creatorResult.confidence,
    iterations: 1,
    quick_mode: true,
  };
}

module.exports = {
  orchestrateResultGeneration,
  quickGenerateResult,
  MAX_ITERATIONS,
  APPROVAL_THRESHOLD,
};
