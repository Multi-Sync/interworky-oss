// src/utils/api/personalizationApi.js
import { sendPostRequest, sendGetRequest } from './baseMethods';
import logger from '../logger';

// Local cache for UTM variations
const UTM_VARIATIONS_CACHE_KEY = 'iw_utm_variations_';
const UTM_VARIATIONS_EXPIRY = 3600000; // 1 hour

/**
 * Get pre-generated UTM variations for an organization
 * Uses local cache first, then fetches from API
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object|null>} Variations object or null
 */
export async function getVariations(organizationId) {
  try {
    // Check local cache first
    const cacheKey = UTM_VARIATIONS_CACHE_KEY + organizationId;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const data = JSON.parse(cached);
      if (data.expiresAt && new Date(data.expiresAt) > new Date()) {
        logger.debug('IW_PERSONALIZATION_API_100', 'Using cached UTM variations', {
          org_id: organizationId,
          variation_keys: Object.keys(data.variations || {}),
        });
        return data.variations;
      }
    }

    logger.info('IW_PERSONALIZATION_API_101', 'Fetching UTM variations from API', {
      org_id: organizationId,
    });

    const result = await sendGetRequest(
      `api/personalization/variations?organizationId=${encodeURIComponent(organizationId)}`
    );

    if (result && result.success && result.variations) {
      // Cache the variations
      localStorage.setItem(cacheKey, JSON.stringify({
        variations: result.variations,
        expiresAt: new Date(Date.now() + UTM_VARIATIONS_EXPIRY).toISOString(),
      }));

      logger.info('IW_PERSONALIZATION_API_102', 'UTM variations fetched and cached', {
        org_id: organizationId,
        variation_keys: Object.keys(result.variations),
      });

      return result.variations;
    }

    logger.info('IW_PERSONALIZATION_API_103', 'No UTM variations found', {
      org_id: organizationId,
    });
    return null;
  } catch (error) {
    logger.warn('IW_PERSONALIZATION_API_104', 'Failed to fetch UTM variations', {
      error: error.message,
      org_id: organizationId,
    });
    return null;
  }
}

/**
 * Clear cached UTM variations for an organization
 * @param {string} organizationId - Organization ID
 */
export function clearVariationsCache(organizationId) {
  try {
    const cacheKey = UTM_VARIATIONS_CACHE_KEY + organizationId;
    localStorage.removeItem(cacheKey);
    logger.debug('IW_PERSONALIZATION_API_105', 'UTM variations cache cleared', {
      org_id: organizationId,
    });
  } catch (error) {
    logger.warn('IW_PERSONALIZATION_API_106', 'Failed to clear variations cache', {
      error: error.message,
    });
  }
}

/**
 * Get cached personalization for a visitor and page
 * @param {string} visitorId - Visitor identifier
 * @param {string} pageUrl - Current page URL
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object|null>} Cached personalization or null
 */
export async function getCachedPersonalization(visitorId, pageUrl, organizationId) {
  try {
    logger.info('IW_PERSONALIZATION_API_001', 'Fetching cached personalization', {
      visitor_id: visitorId,
      org_id: organizationId,
    });

    const result = await sendGetRequest(
      `api/personalization?visitorId=${encodeURIComponent(visitorId)}&pageUrl=${encodeURIComponent(pageUrl)}&organizationId=${encodeURIComponent(organizationId)}`
    );

    if (result && result.success && result.cached) {
      logger.info('IW_PERSONALIZATION_API_002', 'Cached personalization found', {
        variation_id: result.variation?.variation_id,
      });
      return result;
    }

    logger.info('IW_PERSONALIZATION_API_003', 'No cached personalization found');
    return null;
  } catch (error) {
    logger.warn('IW_PERSONALIZATION_API_004', 'Failed to fetch cached personalization', {
      error: error.message,
    });
    return null;
  }
}

/**
 * Register page schema without generating variation
 * @param {Object} params - Registration parameters
 * @param {string} params.visitorId - Visitor identifier
 * @param {string} params.pageUrl - Current page URL
 * @param {Object} params.personalizationObj - Page schema from DOM scanner
 * @param {string} params.organizationId - Organization ID
 * @returns {Promise<Object|null>} Registration result or null
 */
export async function registerPageSchema({
  visitorId,
  pageUrl,
  personalizationObj,
  organizationId,
}) {
  try {
    logger.info('IW_PERSONALIZATION_API_005', 'Registering page schema', {
      visitor_id: visitorId,
      org_id: organizationId,
      page_url: pageUrl,
      sections_count: personalizationObj?.sections?.length || 0,
    });

    const result = await sendPostRequest('api/personalization/register', {
      visitorId,
      pageUrl,
      personalizationObj,
      organizationId,
    });

    if (result && result.success) {
      logger.info('IW_PERSONALIZATION_API_006', 'Page schema registered successfully', {
        personalization_id: result.personalization?.id,
      });
      return result;
    }

    logger.warn('IW_PERSONALIZATION_API_007', 'Failed to register page schema', {
      error: result?.error,
    });
    return null;
  } catch (error) {
    logger.warn('IW_PERSONALIZATION_API_008', 'Error registering page schema', {
      error: error.message,
    });
    return null;
  }
}

/**
 * Generate personalization using AI agents
 * @param {Object} params - Generation parameters
 * @param {string} params.visitorId - Visitor identifier
 * @param {string} params.pageUrl - Current page URL
 * @param {Object} params.personalizationObj - Page schema from DOM scanner
 * @param {string} params.visitorJourneyId - Journey ID for context
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.triggerSource - What triggered generation (behavior, cta_click, etc.)
 * @returns {Promise<Object|null>} Generated personalization or null
 */
export async function generatePersonalization({
  visitorId,
  pageUrl,
  personalizationObj,
  visitorJourneyId,
  organizationId,
  triggerSource = 'behavior',
}) {
  try {
    logger.info('IW_PERSONALIZATION_API_009', 'Generating personalization', {
      visitor_id: visitorId,
      org_id: organizationId,
      journey_id: visitorJourneyId,
      trigger_source: triggerSource,
    });

    const result = await sendPostRequest('api/personalization/generate', {
      visitorId,
      pageUrl,
      personalizationObj,
      visitorJourneyId,
      organizationId,
      triggerSource,
    });

    if (result && result.success && result.variation) {
      logger.info('IW_PERSONALIZATION_API_010', 'Personalization generated successfully', {
        variation_id: result.variation?.variation_id,
        confidence: result.variation?.confidence,
      });
      return result;
    }

    logger.warn('IW_PERSONALIZATION_API_011', 'Personalization generation failed', {
      error: result?.error,
    });
    return null;
  } catch (error) {
    logger.warn('IW_PERSONALIZATION_API_012', 'Error generating personalization', {
      error: error.message,
    });
    return null;
  }
}

/**
 * Report that a personalization was applied
 * @param {string} personalizationId - The personalization record ID
 * @param {Object} applyData - Data about the application
 * @returns {Promise<Object|null>} Result or null
 */
export async function reportPersonalizationApplied(personalizationId, applyData = {}) {
  try {
    logger.info('IW_PERSONALIZATION_API_013', 'Reporting personalization applied', {
      personalization_id: personalizationId,
    });

    const result = await sendPostRequest(
      `api/personalization/${personalizationId}/applied`,
      applyData
    );

    if (result && result.success) {
      logger.info('IW_PERSONALIZATION_API_014', 'Personalization apply reported');
      return result;
    }

    return null;
  } catch (error) {
    logger.warn('IW_PERSONALIZATION_API_015', 'Failed to report personalization applied', {
      error: error.message,
    });
    return null;
  }
}

/**
 * Track a feature interaction for personalization
 * @param {Object} params - Interaction parameters
 * @param {string} params.visitorId - Visitor identifier
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.sectionId - Section that was interacted with
 * @param {string} params.interactionType - Type of interaction (hover, click, scroll_into_view)
 * @param {number} params.duration - Duration of interaction in ms
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object|null>} Result or null
 */
export async function trackFeatureInteraction({
  visitorId,
  organizationId,
  sectionId,
  interactionType,
  duration,
  metadata = {},
}) {
  try {
    logger.debug('IW_PERSONALIZATION_API_016', 'Tracking feature interaction', {
      visitor_id: visitorId,
      section_id: sectionId,
      interaction_type: interactionType,
      duration,
    });

    const result = await sendPostRequest('api/personalization/track-interaction', {
      visitorId,
      organizationId,
      sectionId,
      interactionType,
      duration,
      metadata,
    });

    return result;
  } catch (error) {
    logger.warn('IW_PERSONALIZATION_API_017', 'Failed to track feature interaction', {
      error: error.message,
    });
    return null;
  }
}

/**
 * Sync personalization data using fetch with keepalive (for page unload)
 * @param {string} visitorId - Visitor identifier
 * @param {string} organizationId - Organization ID
 * @param {Object} data - Data to sync (interactions, journey state)
 * @returns {boolean} Whether request was sent
 */
export function syncPersonalizationDataBeacon(visitorId, organizationId, data) {
  try {
    const url = `${process.env.NODE_PUBLIC_API_URL}/api/personalization/sync`;
    const authToken = process.env.ACCESS_TOKEN;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        visitorId,
        organizationId,
        ...data,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
      credentials: 'include',
    })
      .then(() => {
        logger.info('IW_PERSONALIZATION_API_018', 'Personalization data synced with keepalive');
      })
      .catch((error) => {
        logger.warn('IW_PERSONALIZATION_API_019', 'Keepalive sync failed', {
          error: error.message,
        });
      });

    return true;
  } catch (error) {
    logger.warn('IW_PERSONALIZATION_API_020', 'Failed to send personalization sync', {
      error: error.message,
    });
    return false;
  }
}
