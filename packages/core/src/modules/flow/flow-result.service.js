// src/modules/flow/flow-result.service.js
const FlowResult = require('./flow-result.model');
const Flow = require('./flow.model');

/**
 * Generate a title from completion result or collected data
 */
function generateTitle(flowId, completionResult, collectedData) {
  // Try to extract a meaningful title from completion result
  if (completionResult) {
    // Common title fields across different flow types
    const titleFields = [
      'vibe_name',           // whats-my-vibe
      'headline_roast',      // ai-roast-me
      'verdict_tagline',     // startup-idea-validator
      'verdict_message',     // salary-reality-check
      'profile_vibe',        // dating-profile-fixer
      'summary',             // general
    ];

    for (const field of titleFields) {
      if (completionResult[field]) {
        const title = completionResult[field];
        // Truncate if too long
        return title.length > 100 ? title.substring(0, 97) + '...' : title;
      }
    }
  }

  // Try to get name from collected data
  if (collectedData) {
    const nameFields = ['save_profile', 'save_contact_info'];
    for (const field of nameFields) {
      const data = collectedData[field];
      if (Array.isArray(data) && data[0]?.name) {
        return `Results for ${data[0].name}`;
      }
      if (Array.isArray(data) && data[0]?.fullName) {
        return `Resume for ${data[0].fullName}`;
      }
    }
  }

  return null;
}

/**
 * Generate preview text from completion result
 */
function generatePreviewText(completionResult, collectedData) {
  if (completionResult) {
    // Try description fields
    const descFields = ['vibe_description', 'main_bio', 'short_bio', 'investor_take'];
    for (const field of descFields) {
      if (completionResult[field]) {
        const text = completionResult[field];
        return text.length > 150 ? text.substring(0, 147) + '...' : text;
      }
    }
  }

  return null;
}

/**
 * Save a flow result for a user
 */
async function saveResult({
  userId,
  flowId,
  sessionId,
  collectedData,
  completionResult,
  renderedHtml,
  tokensCharged = 0,
}) {
  // Get flow info
  const flow = await Flow.findOne({ flow_id: flowId });
  if (!flow) {
    throw new Error('Flow not found');
  }

  // Check if result already exists for this session (prevent duplicates)
  const existing = await FlowResult.findOne({ session_id: sessionId });
  if (existing) {
    return { success: true, result_id: existing.id, duplicate: true };
  }

  // Generate display metadata
  const title = generateTitle(flowId, completionResult, collectedData);
  const previewText = generatePreviewText(completionResult, collectedData);
  const themeColor = flow.output_schema?.theme_color || '#57534e';

  // Create result
  const result = await FlowResult.create({
    user_id: userId,
    flow_id: flowId,
    flow_name: flow.name,
    session_id: sessionId,
    collected_data: collectedData,
    completion_result: completionResult,
    rendered_html: renderedHtml,
    title,
    preview_text: previewText,
    theme_color: themeColor,
    tokens_charged: tokensCharged,
  });

  return { success: true, result_id: result.id };
}

/**
 * Get all results for a user with pagination
 */
async function getUserResults(userId, { page = 1, perPage = 20, flowId = null } = {}) {
  const query = { user_id: userId };
  if (flowId) {
    query.flow_id = flowId;
  }

  const skip = (page - 1) * perPage;

  const [results, total] = await Promise.all([
    FlowResult.find(query)
      .select('-collected_data -completion_result -rendered_html') // Exclude large fields
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(perPage)
      .lean(),
    FlowResult.countDocuments(query),
  ]);

  return {
    results: results.map((r) => ({
      id: r.id,
      flow_id: r.flow_id,
      flow_name: r.flow_name,
      title: r.title,
      preview_text: r.preview_text,
      theme_color: r.theme_color,
      tokens_charged: r.tokens_charged,
      created_at: r.created_at,
    })),
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
  };
}

/**
 * Get a specific result by ID (includes full data)
 */
async function getResultById(resultId, userId) {
  const result = await FlowResult.findOne({ id: resultId, user_id: userId }).lean();
  if (!result) {
    return null;
  }

  return {
    id: result.id,
    flow_id: result.flow_id,
    flow_name: result.flow_name,
    session_id: result.session_id,
    title: result.title,
    preview_text: result.preview_text,
    theme_color: result.theme_color,
    tokens_charged: result.tokens_charged,
    collected_data: result.collected_data,
    completion_result: result.completion_result,
    rendered_html: result.rendered_html,
    created_at: result.created_at,
  };
}

/**
 * Delete a result
 */
async function deleteResult(resultId, userId) {
  const result = await FlowResult.findOneAndDelete({ id: resultId, user_id: userId });
  return { success: !!result, deleted: !!result };
}

/**
 * Get result count for a user
 */
async function getResultCount(userId) {
  return FlowResult.countDocuments({ user_id: userId });
}

module.exports = {
  saveResult,
  getUserResults,
  getResultById,
  deleteResult,
  getResultCount,
};
