/**
 * Personalization Controller
 * HTTP handlers for personalization endpoints
 */
const { asyncHandler } = require('../../utils/asyncHandler');
const personalizationService = require('./personalization.service');
const AssistantInfo = require('../assistant_info/assistant_info.model');

const LOG_PREFIX = '[PersonalizationController]';

/**
 * Get cached personalization for a visitor + page
 * Called immediately on page load for instant rendering
 * GET /api/personalization
 */
const getCachedPersonalization = asyncHandler(async (req, res) => {
  const { visitorId, pageUrl } = req.query;
  const organizationId = req.query.organizationId || req.organizationId;

  console.log(`${LOG_PREFIX} GET /api/personalization`, {
    visitorId,
    pageUrl,
    organizationId,
    ip: req.ip,
    userAgent: req.headers['user-agent']?.substring(0, 50),
  });

  if (!visitorId || !pageUrl) {
    console.warn(`${LOG_PREFIX} ❌ Missing required parameters`, { visitorId: !!visitorId, pageUrl: !!pageUrl });
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: visitorId, pageUrl',
    });
  }

  const cached = await personalizationService.getCachedPersonalization(
    visitorId,
    pageUrl,
    organizationId
  );

  if (cached) {
    console.log(`${LOG_PREFIX} ✅ Returning cached personalization`, {
      variationId: cached.variation?.variation_id,
      visitorSegment: cached.intent?.visitor_segment,
    });
    return res.json({
      success: true,
      cached: true,
      variation: cached.variation,
      intent: {
        visitor_segment: cached.intent?.visitor_segment,
        urgency_level: cached.intent?.urgency_level,
      },
      expires_at: cached.expires_at,
    });
  }

  console.log(`${LOG_PREFIX} No cached personalization found`);
  return res.json({
    success: true,
    cached: false,
    variation: null,
  });
});

/**
 * Register page schema (personalizationObj) without generating variation
 * Called when page loads to register available elements
 * POST /api/personalization/register
 */
const registerPageSchema = asyncHandler(async (req, res) => {
  const { visitorId, pageUrl, personalizationObj } = req.body;
  const organizationId = req.body.organizationId || req.organizationId;

  console.log(`${LOG_PREFIX} POST /api/personalization/register`, {
    visitorId,
    pageUrl,
    organizationId,
    sectionsCount: personalizationObj?.sections?.length || 0,
    ctasCount: personalizationObj?.ctas?.length || 0,
  });

  if (!visitorId || !pageUrl || !personalizationObj) {
    console.warn(`${LOG_PREFIX} ❌ Missing required fields for register`, {
      hasVisitorId: !!visitorId,
      hasPageUrl: !!pageUrl,
      hasPersonalizationObj: !!personalizationObj,
    });
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: visitorId, pageUrl, personalizationObj',
    });
  }

  const result = await personalizationService.registerPageSchema(
    visitorId,
    pageUrl,
    personalizationObj,
    organizationId
  );

  console.log(`${LOG_PREFIX} ✅ Page schema registered`, {
    personalizationId: result.id,
    status: result.status,
  });

  return res.json({
    success: true,
    personalization_id: result.id,
    status: result.status,
  });
});

/**
 * Generate new personalization
 * Called after sufficient behavior signals collected
 * POST /api/personalization/generate
 */
const generatePersonalization = asyncHandler(async (req, res) => {
  const {
    visitorId,
    pageUrl,
    personalizationObj,
    visitorJourneyId,
    triggerSource,
  } = req.body;
  const organizationId = req.body.organizationId || req.organizationId;

  console.log(`${LOG_PREFIX} ========================================`);
  console.log(`${LOG_PREFIX} POST /api/personalization/generate`);
  console.log(`${LOG_PREFIX} Request received`, {
    visitorId,
    pageUrl,
    visitorJourneyId,
    organizationId,
    triggerSource,
    sectionsCount: personalizationObj?.sections?.length || 0,
    ctasCount: personalizationObj?.ctas?.length || 0,
    headlinesCount: personalizationObj?.headlines?.length || 0,
  });

  if (!visitorId || !pageUrl || !personalizationObj) {
    console.warn(`${LOG_PREFIX} ❌ Missing required fields for generate`, {
      hasVisitorId: !!visitorId,
      hasPageUrl: !!pageUrl,
      hasPersonalizationObj: !!personalizationObj,
    });
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: visitorId, pageUrl, personalizationObj',
    });
  }

  try {
    console.log(`${LOG_PREFIX} Calling personalizationService.generatePersonalization...`);
    const result = await personalizationService.generatePersonalization({
      visitorId,
      pageUrl,
      personalizationObj,
      visitorJourneyId,
      organizationId,
      triggerSource,
    });

    console.log(`${LOG_PREFIX} ✅ Generation successful`, {
      personalizationId: result.id,
      variationId: result.variation?.variation_id,
      confidence: result.variation?.confidence,
      primaryIntent: result.intent?.primary_intent,
      visitorSegment: result.intent?.visitor_segment,
    });
    console.log(`${LOG_PREFIX} ========================================`);

    return res.json({
      success: true,
      personalization_id: result.id,
      variation: result.variation,
      intent: {
        primary_intent: result.intent?.primary_intent,
        visitor_segment: result.intent?.visitor_segment,
        urgency_level: result.intent?.urgency_level,
        buyer_stage: result.intent?.buyer_stage,
      },
      expires_at: result.expires_at,
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} ❌ Generation FAILED`, {
      error: error.message,
      stack: error.stack,
      visitorId,
      pageUrl,
      organizationId,
    });
    console.log(`${LOG_PREFIX} ========================================`);

    return res.status(500).json({
      success: false,
      error: 'Failed to generate personalization',
      message: error.message,
    });
  }
});

/**
 * Get personalization by ID
 * GET /api/personalization/:id
 */
const getPersonalizationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const Personalization = require('./personalization.model');

  const personalization = await Personalization.findOne({
    $or: [{ _id: id }, { id: id }],
  }).lean();

  if (!personalization) {
    return res.status(404).json({
      success: false,
      error: 'Personalization not found',
    });
  }

  return res.json({
    success: true,
    personalization,
  });
});

/**
 * Get personalization analytics for an organization
 * GET /api/personalization/analytics/:organizationId
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;
  const { startDate, endDate } = req.query;

  const analytics = await personalizationService.getPersonalizationAnalytics(
    organizationId,
    { startDate, endDate }
  );

  return res.json({
    success: true,
    analytics,
  });
});

/**
 * Delete personalization
 * DELETE /api/personalization/:id
 */
const deletePersonalization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const Personalization = require('./personalization.model');

  const result = await Personalization.deleteOne({
    $or: [{ _id: id }, { id: id }],
  });

  if (result.deletedCount === 0) {
    return res.status(404).json({
      success: false,
      error: 'Personalization not found',
    });
  }

  return res.json({
    success: true,
    message: 'Personalization deleted',
  });
});

/**
 * Cleanup expired personalizations
 * POST /api/personalization/cleanup
 */
const cleanupExpired = asyncHandler(async (req, res) => {
  const { organizationId } = req.body;

  const deletedCount = await personalizationService.cleanupExpiredPersonalizations(
    organizationId
  );

  return res.json({
    success: true,
    deleted_count: deletedCount,
  });
});

/**
 * Get pre-generated UTM variations for an organization
 * Called by the widget on page load to get instant personalization
 * GET /api/personalization/variations?organizationId=xxx
 */
const getVariations = asyncHandler(async (req, res) => {
  const organizationId = req.query.organizationId || req.organizationId;

  console.log(`${LOG_PREFIX} GET /api/personalization/variations`, {
    organizationId,
  });

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: organizationId',
    });
  }

  const assistantInfo = await AssistantInfo.findOne({
    organization_id: organizationId,
  })
    .select('personalization_variations personalization_last_generated')
    .lean();

  if (!assistantInfo || !assistantInfo.personalization_variations) {
    console.log(`${LOG_PREFIX} No pre-generated variations found`, { organizationId });
    return res.json({
      success: true,
      variations: {},
      last_generated: null,
    });
  }

  // Convert Map to plain object if needed
  const variations =
    assistantInfo.personalization_variations instanceof Map
      ? Object.fromEntries(assistantInfo.personalization_variations)
      : assistantInfo.personalization_variations;

  console.log(`${LOG_PREFIX} ✅ Returning pre-generated variations`, {
    organizationId,
    variationCount: Object.keys(variations).length,
    variationKeys: Object.keys(variations),
  });

  return res.json({
    success: true,
    variations,
    last_generated: assistantInfo.personalization_last_generated,
  });
});

/**
 * Pre-generate personalization variations for UTM campaigns
 * Called once to set up variations for different personas
 * POST /api/personalization/pre-generate
 */
const preGenerateVariations = asyncHandler(async (req, res) => {
  const { personas, pageSchema } = req.body;
  const organizationId = req.body.organizationId || req.organizationId;

  console.log(`${LOG_PREFIX} POST /api/personalization/pre-generate`, {
    organizationId,
    personas,
    hasPageSchema: !!pageSchema,
    sectionsCount: pageSchema?.sections?.length || 0,
  });

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: organizationId',
    });
  }

  // Default personas if not provided
  const targetPersonas = personas || [
    {
      key: 'analytics',
      keywords: ['analytics', 'tracking', 'data', 'insights', 'metrics', 'dashboard'],
      prompt: 'Personalize for a visitor interested in analytics and tracking. Emphasize data insights, metrics, and dashboard features. Use data-driven language.',
    },
    {
      key: 'developer',
      keywords: ['developer', 'api', 'sdk', 'code', 'bug', 'error', 'fix', 'integration', 'technical'],
      prompt: 'Personalize for a developer interested in bug hunting and code quality. Emphasize error detection, auto-fix features, and technical capabilities. Use developer-friendly language.',
    },
    {
      key: 'enterprise',
      keywords: ['enterprise', 'business', 'team', 'company', 'scale', 'security'],
      prompt: 'Personalize for an enterprise buyer. Emphasize scalability, security, team features, and business value. Use professional, ROI-focused language.',
    },
  ];

  try {
    const result = await personalizationService.preGenerateVariations({
      organizationId,
      personas: targetPersonas,
      pageSchema,
    });

    console.log(`${LOG_PREFIX} ✅ Pre-generation successful`, {
      organizationId,
      generatedCount: Object.keys(result.variations).length,
      variationKeys: Object.keys(result.variations),
    });

    return res.json({
      success: true,
      variations: result.variations,
      generated_at: result.generated_at,
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} ❌ Pre-generation failed`, {
      error: error.message,
      organizationId,
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to pre-generate variations',
      message: error.message,
    });
  }
});

/**
 * Store page schema for an organization (for pre-generation)
 * POST /api/personalization/store-schema
 */
const storePageSchema = asyncHandler(async (req, res) => {
  const { pageSchema } = req.body;
  const organizationId = req.body.organizationId || req.organizationId;

  console.log(`${LOG_PREFIX} POST /api/personalization/store-schema`, {
    organizationId,
    sectionsCount: pageSchema?.sections?.length || 0,
    pageUrl: pageSchema?.pageUrl,
  });

  if (!organizationId || !pageSchema) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: organizationId, pageSchema',
    });
  }

  await AssistantInfo.updateOne(
    { organization_id: organizationId },
    {
      $set: {
        personalization_page_schema: pageSchema,
      },
    }
  );

  console.log(`${LOG_PREFIX} ✅ Page schema stored`, { organizationId });

  return res.json({
    success: true,
    message: 'Page schema stored successfully',
  });
});

module.exports = {
  getCachedPersonalization,
  registerPageSchema,
  generatePersonalization,
  getPersonalizationById,
  getAnalytics,
  deletePersonalization,
  cleanupExpired,
  getVariations,
  preGenerateVariations,
  storePageSchema,
};
