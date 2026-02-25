/**
 * Personalization Service
 * Business logic for personalization operations
 */
const Personalization = require('./personalization.model');
const VisitorJourney = require('../visitor_journey/visitor_journey.model');
const AssistantInfo = require('../assistant_info/assistant_info.model');
const axios = require('axios');
const mongoose = require('mongoose');

/**
 * Check if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to check
 * @returns {boolean} True if valid ObjectId
 */
function isValidObjectId(id) {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
}

// Use HTTP URL for AI agent endpoints (not WebSocket URL)
const WS_ASSISTANT_HTTP_URL = process.env.WS_ASSISTANT_HTTP_URL || 'http://localhost:3001';

// Logging prefix for easy filtering
const LOG_PREFIX = '[PersonalizationService]';

/**
 * Fetch original website content from AssistantInfo
 * This content was scraped during website sync and stored in GCS/MongoDB
 * @param {string} organizationId - Organization ID
 * @returns {Promise<string|null>} Original website content or null
 */
async function getOriginalWebsiteContent(organizationId) {
  try {
    const assistantInfo = await AssistantInfo.findOne({
      organization_id: organizationId,
    }).lean();

    if (assistantInfo?.assistant_knowledge) {
      console.log(`${LOG_PREFIX} Found original website content`, {
        organizationId,
        contentLength: assistantInfo.assistant_knowledge.length,
      });
      return assistantInfo.assistant_knowledge;
    }

    console.log(`${LOG_PREFIX} No original website content found`, { organizationId });
    return null;
  } catch (error) {
    console.warn(`${LOG_PREFIX} Error fetching original website content`, {
      organizationId,
      error: error.message,
    });
    return null;
  }
}

/**
 * Simple hash function for page URL
 * IMPORTANT: This must match the simpleHash function in the frontend
 * (earlyInit.js and personalizationManager.js)
 * @param {string} str - String to hash
 * @returns {string} Hash string (base36)
 */
function hashPageUrl(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get cached personalization for a visitor and page
 * @param {string} visitorId - Visitor identifier
 * @param {string} pageUrl - Page URL
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object|null>} Cached personalization or null
 */
async function getCachedPersonalization(visitorId, pageUrl, organizationId) {
  const pageUrlHash = hashPageUrl(pageUrl);

  console.log(`${LOG_PREFIX} getCachedPersonalization called`, {
    visitorId,
    pageUrl,
    pageUrlHash,
    organizationId,
  });

  const cached = await Personalization.findOne({
    visitor_id: visitorId,
    page_url_hash: pageUrlHash,
    organization_id: organizationId,
    status: { $in: ['generated', 'applied'] },
    expires_at: { $gt: new Date() },
  }).lean();

  if (cached) {
    console.log(`${LOG_PREFIX} ✅ Cache HIT - Found personalization`, {
      personalizationId: cached.id || cached._id,
      variationId: cached.variation?.variation_id,
      status: cached.status,
      expiresAt: cached.expires_at,
      timesApplied: cached.times_applied,
    });

    // Increment apply counter asynchronously
    Personalization.updateOne(
      { _id: cached._id },
      {
        $inc: { times_applied: 1 },
        $set: { last_applied_at: new Date(), status: 'applied' },
      },
    ).exec();
  } else {
    console.log(`${LOG_PREFIX} ❌ Cache MISS - No personalization found`, {
      visitorId,
      pageUrlHash,
      organizationId,
    });
  }

  return cached;
}

/**
 * Register page schema without generating variation
 * @param {string} visitorId - Visitor identifier
 * @param {string} pageUrl - Page URL
 * @param {Object} personalizationObj - Page schema from DOM scanner
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} Created/updated record
 */
async function registerPageSchema(visitorId, pageUrl, personalizationObj, organizationId) {
  const pageUrlHash = hashPageUrl(pageUrl);

  console.log(`${LOG_PREFIX} registerPageSchema called`, {
    visitorId,
    pageUrl,
    pageUrlHash,
    organizationId,
    pageTitle: personalizationObj?.pageTitle,
    sectionsCount: personalizationObj?.sections?.length || 0,
    ctasCount: personalizationObj?.ctas?.length || 0,
    headlinesCount: personalizationObj?.headlines?.length || 0,
  });

  const result = await Personalization.findOneAndUpdate(
    {
      visitor_id: visitorId,
      page_url_hash: pageUrlHash,
      organization_id: organizationId,
    },
    {
      $set: {
        page_url: pageUrl,
        page_title: personalizationObj.pageTitle,
        page_schema: personalizationObj,
      },
      $setOnInsert: {
        expires_at: new Date(Date.now() + 86400000), // 24h default
        status: 'pending',
      },
    },
    { upsert: true, new: true },
  );

  console.log(`${LOG_PREFIX} ✅ Page schema registered`, {
    personalizationId: result.id || result._id,
    status: result.status,
    isNew: result.status === 'pending',
  });

  return result;
}

/**
 * Generate personalization using AI agents
 * @param {Object} params - Generation parameters
 * @returns {Promise<Object>} Generated personalization
 */
async function generatePersonalization({
  visitorId,
  pageUrl,
  personalizationObj,
  visitorJourneyId,
  organizationId,
  triggerSource = 'behavior',
}) {
  const pageUrlHash = hashPageUrl(pageUrl);
  const startTime = Date.now();

  console.log(`${LOG_PREFIX} ========== GENERATE PERSONALIZATION START ==========`);
  console.log(`${LOG_PREFIX} generatePersonalization called`, {
    visitorId,
    pageUrl,
    pageUrlHash,
    visitorJourneyId,
    organizationId,
    triggerSource,
    sectionsCount: personalizationObj?.sections?.length || 0,
    wsAssistantUrl: WS_ASSISTANT_HTTP_URL,
  });

  try {
    // Step 1: Get visitor journey data
    console.log(`${LOG_PREFIX} Step 1: Fetching visitor journey...`);
    let visitorJourney = null;
    if (visitorJourneyId) {
      console.log(`${LOG_PREFIX} Looking up journey by ID: ${visitorJourneyId}`);

      // Build query based on ID format (ObjectId vs UUID)
      const idIsObjectId = isValidObjectId(visitorJourneyId);
      const journeyQuery = idIsObjectId
        ? { $or: [{ _id: visitorJourneyId }, { id: visitorJourneyId }] }
        : { id: visitorJourneyId };

      console.log(`${LOG_PREFIX} Journey ID format: ${idIsObjectId ? 'ObjectId' : 'UUID'}`);
      visitorJourney = await VisitorJourney.findOne(journeyQuery).lean();
    }

    if (!visitorJourney) {
      // Try to find by visitor_id
      console.log(`${LOG_PREFIX} Journey not found by ID, trying visitor_id: ${visitorId}`);
      visitorJourney = await VisitorJourney.findOne({
        visitor_id: visitorId,
        organization_id: organizationId,
      })
        .sort({ created_at: -1 })
        .lean();
    }

    if (!visitorJourney) {
      console.error(`${LOG_PREFIX} ❌ Step 1 FAILED: Visitor journey not found`, {
        visitorJourneyId,
        visitorId,
        organizationId,
      });
      throw new Error('Visitor journey not found');
    }

    console.log(`${LOG_PREFIX} ✅ Step 1 SUCCESS: Visitor journey found`, {
      journeyId: visitorJourney.id || visitorJourney._id,
      pageViews: visitorJourney.journey?.page_views,
      sessionDuration: visitorJourney.session?.duration,
      engagementScore: visitorJourney.engagement?.engagement_score,
    });

    // Step 1.5: Fetch original website content for brand alignment
    console.log(`${LOG_PREFIX} Step 1.5: Fetching original website content...`);
    const originalWebsiteContent = await getOriginalWebsiteContent(organizationId);
    console.log(
      `${LOG_PREFIX} Original content: ${originalWebsiteContent ? `${originalWebsiteContent.length} chars` : 'not available'}`,
    );

    // Step 2: Call Intent Extractor Agent via ws-assistant
    console.log(`${LOG_PREFIX} Step 2: Calling Intent Extractor Agent...`);
    console.log(`${LOG_PREFIX} POST ${WS_ASSISTANT_HTTP_URL}/extract-intent`);

    const intentStartTime = Date.now();
    let intentResponse;
    try {
      intentResponse = await axios.post(
        `${WS_ASSISTANT_HTTP_URL}/extract-intent`,
        { visitorJourney },
        { timeout: 30000 },
      );
      console.log(`${LOG_PREFIX} Intent API response received in ${Date.now() - intentStartTime}ms`, {
        status: intentResponse.status,
        hasData: !!intentResponse.data,
        hasPrompt: !!intentResponse.data?.personalizationPrompt,
      });
    } catch (axiosError) {
      console.error(`${LOG_PREFIX} ❌ Step 2 FAILED: Intent Extractor API error`, {
        url: `${WS_ASSISTANT_HTTP_URL}/extract-intent`,
        errorCode: axiosError.code,
        errorMessage: axiosError.message,
        responseStatus: axiosError.response?.status,
        responseData: axiosError.response?.data,
      });
      throw new Error(`Intent extraction API failed: ${axiosError.message}`);
    }

    if (!intentResponse.data || !intentResponse.data.personalizationPrompt) {
      console.error(`${LOG_PREFIX} ❌ Step 2 FAILED: Invalid intent response`, {
        hasData: !!intentResponse.data,
        dataKeys: intentResponse.data ? Object.keys(intentResponse.data) : [],
      });
      throw new Error('Intent extraction failed - no personalizationPrompt in response');
    }

    const intent = intentResponse.data;
    console.log(`${LOG_PREFIX} ✅ Step 2 SUCCESS: Intent extracted`, {
      primaryIntent: intent.primaryIntent,
      visitorSegment: intent.visitorSegment,
      urgencyLevel: intent.urgencyLevel,
      buyerStage: intent.buyerStage,
      promptLength: intent.personalizationPrompt?.length,
      recommendedActionsCount: intent.recommendedActions?.length || 0,
    });

    // Step 3: Call Personalization Generator Agent (with judge loop if content available)
    console.log(`${LOG_PREFIX} Step 3: Calling Personalization Generator Agent...`);
    console.log(`${LOG_PREFIX} POST ${WS_ASSISTANT_HTTP_URL}/generate-personalization`);
    console.log(`${LOG_PREFIX} Judge mode: ${originalWebsiteContent ? 'enabled (max 3 turns)' : 'disabled'}`);

    const variationStartTime = Date.now();
    let variationResponse;
    try {
      variationResponse = await axios.post(
        `${WS_ASSISTANT_HTTP_URL}/generate-personalization`,
        {
          personalizationPrompt: intent.personalizationPrompt,
          personalizationObj,
          visitorId,
          originalWebsiteContent, // Pass original content for brand alignment
        },
        { timeout: 120000 }, // Increased timeout for judge iterations (max 3 turns)
      );
      console.log(`${LOG_PREFIX} Variation API response received in ${Date.now() - variationStartTime}ms`, {
        status: variationResponse.status,
        hasData: !!variationResponse.data,
        judgeTurns: variationResponse.data?.judgeTurns,
        judgeScore: variationResponse.data?.judgeScore,
      });
    } catch (axiosError) {
      console.error(`${LOG_PREFIX} ❌ Step 3 FAILED: Personalization Generator API error`, {
        url: `${WS_ASSISTANT_HTTP_URL}/generate-personalization`,
        errorCode: axiosError.code,
        errorMessage: axiosError.message,
        responseStatus: axiosError.response?.status,
        responseData: axiosError.response?.data,
      });
      throw new Error(`Personalization generation API failed: ${axiosError.message}`);
    }

    if (!variationResponse.data) {
      console.error(`${LOG_PREFIX} ❌ Step 3 FAILED: Empty variation response`);
      throw new Error('Personalization generation failed - empty response');
    }

    const variation = variationResponse.data;
    console.log(`${LOG_PREFIX} ✅ Step 3 SUCCESS: Variation generated`, {
      variationId: variation.variationId,
      confidence: variation.confidence,
      layoutChangesCount: variation.layoutChanges?.length || 0,
      contentVariationsCount: variation.contentVariations?.length || 0,
      ctaVariationsCount: variation.ctaVariations?.length || 0,
      cacheDuration: variation.cacheDuration,
      reasoning: variation.reasoning?.substring(0, 100),
    });

    // Step 4: Calculate expiry
    const cacheDuration = variation.cacheDuration || 43200;
    const expiresAt = new Date(Date.now() + cacheDuration * 1000);
    console.log(`${LOG_PREFIX} Step 4: Cache duration set`, {
      cacheDuration,
      expiresAt,
    });

    // Step 5: Store in database
    console.log(`${LOG_PREFIX} Step 5: Storing personalization in database...`);
    const personalization = await Personalization.findOneAndUpdate(
      {
        visitor_id: visitorId,
        page_url_hash: pageUrlHash,
        organization_id: organizationId,
      },
      {
        $set: {
          page_url: pageUrl,
          page_title: personalizationObj.pageTitle,
          page_schema: personalizationObj,
          intent: {
            primary_intent: intent.primaryIntent,
            interest_signals: intent.interestSignals,
            visitor_segment: intent.visitorSegment,
            urgency_level: intent.urgencyLevel,
            buyer_stage: intent.buyerStage,
            personalization_prompt: intent.personalizationPrompt,
            recommended_actions: intent.recommendedActions,
          },
          variation: {
            variation_id: variation.variationId,
            confidence: variation.confidence,
            layout_changes: variation.layoutChanges,
            content_variations: variation.contentVariations,
            cta_variations: variation.ctaVariations,
            style_emphasis: variation.styleEmphasis,
            reasoning: variation.reasoning,
          },
          cache_duration: cacheDuration,
          expires_at: expiresAt,
          status: 'generated',
          trigger_source: triggerSource,
          visitor_journey_id: visitorJourneyId,
          error_message: null,
        },
      },
      { upsert: true, new: true },
    );

    const totalTime = Date.now() - startTime;
    console.log(`${LOG_PREFIX} ✅ Step 5 SUCCESS: Personalization stored`, {
      personalizationId: personalization.id || personalization._id,
      status: personalization.status,
    });
    console.log(`${LOG_PREFIX} ========== GENERATE PERSONALIZATION COMPLETE ==========`);
    console.log(`${LOG_PREFIX} Total time: ${totalTime}ms`, {
      visitorId,
      variationId: variation.variationId,
      confidence: variation.confidence,
    });

    return personalization;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`${LOG_PREFIX} ❌ GENERATE PERSONALIZATION FAILED after ${totalTime}ms`, {
      error: error.message,
      stack: error.stack,
      visitorId,
      pageUrl,
      organizationId,
    });

    // Store error state
    await Personalization.findOneAndUpdate(
      {
        visitor_id: visitorId,
        page_url_hash: pageUrlHash,
        organization_id: organizationId,
      },
      {
        $set: {
          status: 'failed',
          error_message: error.message,
        },
      },
      { upsert: true },
    );

    console.log(`${LOG_PREFIX} Error state saved to database`);
    console.log(`${LOG_PREFIX} ========== GENERATE PERSONALIZATION END (FAILED) ==========`);

    throw error;
  }
}

/**
 * Get personalization analytics for an organization
 * @param {string} organizationId - Organization ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Analytics data
 */
async function getPersonalizationAnalytics(organizationId, { startDate, endDate } = {}) {
  const matchStage = { organization_id: organizationId };

  if (startDate || endDate) {
    matchStage.created_at = {};
    if (startDate) matchStage.created_at.$gte = new Date(startDate);
    if (endDate) matchStage.created_at.$lte = new Date(endDate);
  }

  const [stats, segmentBreakdown, topVariations] = await Promise.all([
    // Overall stats
    Personalization.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          applied: { $sum: { $cond: [{ $eq: ['$status', 'applied'] }, 1, 0] } },
          generated: { $sum: { $cond: [{ $eq: ['$status', 'generated'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          total_applications: { $sum: '$times_applied' },
          avg_confidence: { $avg: '$variation.confidence' },
        },
      },
    ]),

    // Breakdown by visitor segment
    Personalization.aggregate([
      { $match: { ...matchStage, 'intent.visitor_segment': { $exists: true } } },
      {
        $group: {
          _id: '$intent.visitor_segment',
          count: { $sum: 1 },
          avg_confidence: { $avg: '$variation.confidence' },
        },
      },
      { $sort: { count: -1 } },
    ]),

    // Top applied variations
    Personalization.find({ ...matchStage, times_applied: { $gt: 0 } })
      .sort({ times_applied: -1 })
      .limit(10)
      .select('page_url variation.variation_id variation.confidence times_applied intent.visitor_segment')
      .lean(),
  ]);

  return {
    overview: stats[0] || {
      total: 0,
      applied: 0,
      generated: 0,
      failed: 0,
      total_applications: 0,
      avg_confidence: 0,
    },
    segment_breakdown: segmentBreakdown,
    top_variations: topVariations,
  };
}

/**
 * Delete expired personalizations (cleanup job)
 * @param {string} organizationId - Optional organization filter
 * @returns {Promise<number>} Number of deleted records
 */
async function cleanupExpiredPersonalizations(organizationId = null) {
  const filter = { expires_at: { $lt: new Date() } };
  if (organizationId) {
    filter.organization_id = organizationId;
  }

  const result = await Personalization.deleteMany(filter);
  return result.deletedCount;
}

/**
 * Simple hash for content comparison (detect website changes)
 * @param {string} str - Content to hash
 * @returns {string} Hash string
 */
function simpleContentHash(str) {
  if (!str) return '';
  let hash = 0;
  const sample = str.substring(0, 5000); // First 5000 chars
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Pre-generate personalization variations for UTM campaigns
 * Generates variations for each persona and stores in assistant_info
 * @param {Object} params - Generation parameters
 * @param {string} params.organizationId - Organization ID
 * @param {Array} params.personas - Array of persona configs
 * @param {Object} params.pageSchema - Optional page schema (will use stored if not provided)
 * @returns {Promise<Object>} Generated variations
 */
async function preGenerateVariations({ organizationId, personas, pageSchema }) {
  const startTime = Date.now();

  console.log(`${LOG_PREFIX} ========== PRE-GENERATE VARIATIONS START ==========`);
  console.log(`${LOG_PREFIX} preGenerateVariations called`, {
    organizationId,
    personasCount: personas?.length || 0,
    hasPageSchema: !!pageSchema,
  });

  // Get assistant info and original content
  const assistantInfo = await AssistantInfo.findOne({
    organization_id: organizationId,
  }).lean();

  if (!assistantInfo) {
    throw new Error(`AssistantInfo not found for organization: ${organizationId}`);
  }

  // Use provided pageSchema or stored one
  const personalizationObj = pageSchema || assistantInfo.personalization_page_schema;

  if (!personalizationObj) {
    throw new Error('No page schema available. Please store a page schema first using /store-schema endpoint.');
  }

  const originalWebsiteContent = assistantInfo.assistant_knowledge || '';
  const contentHash = simpleContentHash(originalWebsiteContent);

  // Get existing variations to merge with (preserve existing variations)
  const existingVariations = assistantInfo.personalization_variations || {};
  // Convert Map to plain object if needed (Mongoose Map type)
  const existingVariationsObj =
    existingVariations instanceof Map
      ? Object.fromEntries(existingVariations)
      : typeof existingVariations.toObject === 'function'
        ? existingVariations.toObject()
        : existingVariations;

  console.log(`${LOG_PREFIX} Content context`, {
    hasOriginalContent: !!originalWebsiteContent,
    contentLength: originalWebsiteContent.length,
    contentHash,
    sectionsCount: personalizationObj?.sections?.length || 0,
    existingVariationsCount: Object.keys(existingVariationsObj).length,
  });

  const newVariations = {};
  const errors = [];

  // Generate variation for each persona
  for (const persona of personas) {
    console.log(`${LOG_PREFIX} Generating variation for persona: ${persona.key}`);

    try {
      const variationStartTime = Date.now();

      // Call ws-assistant to generate personalization
      const response = await axios.post(
        `${WS_ASSISTANT_HTTP_URL}/generate-personalization`,
        {
          personalizationPrompt: persona.prompt,
          personalizationObj,
          visitorId: `pre-gen-${persona.key}`,
          originalWebsiteContent,
        },
        { timeout: 120000 },
      );

      if (!response.data) {
        throw new Error('Empty response from generator');
      }

      const variation = response.data;

      console.log(`${LOG_PREFIX} ✅ Persona "${persona.key}" generated in ${Date.now() - variationStartTime}ms`, {
        confidence: variation.confidence,
        layoutChanges: variation.layoutChanges?.length || 0,
        contentVariations: variation.contentVariations?.length || 0,
        ctaVariations: variation.ctaVariations?.length || 0,
      });

      newVariations[persona.key] = {
        keywords: persona.keywords,
        variation: {
          layout_changes: variation.layoutChanges || [],
          content_variations: variation.contentVariations || [],
          cta_variations: variation.ctaVariations || [],
          style_emphasis: variation.styleEmphasis || [],
        },
        confidence: variation.confidence,
        generated_at: new Date(),
        source_content_hash: contentHash,
      };
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Failed to generate persona "${persona.key}"`, {
        error: error.message,
      });
      errors.push({ persona: persona.key, error: error.message });
    }
  }

  // Add default variation (no changes) only if it doesn't exist
  if (!existingVariationsObj['default']) {
    newVariations['default'] = {
      keywords: [],
      variation: {
        layout_changes: [],
        content_variations: [],
        cta_variations: [],
        style_emphasis: [],
      },
      confidence: 1.0,
      generated_at: new Date(),
      source_content_hash: contentHash,
    };
  }

  // Merge existing variations with new ones (new ones override existing with same key)
  const mergedVariations = { ...existingVariationsObj, ...newVariations };

  console.log(`${LOG_PREFIX} Merging variations`, {
    existingCount: Object.keys(existingVariationsObj).length,
    newCount: Object.keys(newVariations).length,
    mergedCount: Object.keys(mergedVariations).length,
  });

  // Store in assistant_info (upsert to create if doesn't exist)
  const updateResult = await AssistantInfo.updateOne(
    { organization_id: organizationId },
    {
      $set: {
        personalization_variations: mergedVariations,
        personalization_last_generated: new Date(),
        personalization_page_schema: personalizationObj,
      },
    },
    { upsert: true },
  );

  console.log(`${LOG_PREFIX} MongoDB update result`, {
    matchedCount: updateResult.matchedCount,
    modifiedCount: updateResult.modifiedCount,
    upsertedCount: updateResult.upsertedCount,
    upsertedId: updateResult.upsertedId,
  });

  const totalTime = Date.now() - startTime;
  console.log(`${LOG_PREFIX} ========== PRE-GENERATE VARIATIONS COMPLETE ==========`);
  console.log(`${LOG_PREFIX} Total time: ${totalTime}ms`, {
    successCount: Object.keys(newVariations).length,
    errorCount: errors.length,
    totalVariationKeys: Object.keys(mergedVariations),
  });

  return {
    variations: mergedVariations,
    generated_at: new Date(),
    errors: errors.length > 0 ? errors : undefined,
  };
}

module.exports = {
  getCachedPersonalization,
  registerPageSchema,
  generatePersonalization,
  getPersonalizationAnalytics,
  cleanupExpiredPersonalizations,
  hashPageUrl,
  preGenerateVariations,
};
