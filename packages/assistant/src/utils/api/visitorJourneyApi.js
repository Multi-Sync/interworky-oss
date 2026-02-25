// src/utils/api/visitorJourneyApi.js
import { sendPostRequest, sendPutRequest, sendGetRequest } from './baseMethods';
import logger from '../logger';

/**
 * Creates a new visitor journey record
 * @param {Object} journeyData - The visitor journey data
 * @returns {Promise<Object>} The created journey record
 */
export async function createVisitorJourney(journeyData) {
  try {
    logger.info('IW_ANALYTICS_API_001', 'Creating visitor journey', {
      org_id: journeyData.organization_id,
      session_id: journeyData.session_id,
    });
    const result = await sendPostRequest('api/visitor-journey', journeyData);
    logger.info('IW_ANALYTICS_API_002', 'Visitor journey created', {
      id: result?.visitorJourney?.id,
    });
    return result;
  } catch (error) {
    logger.warn('IW_ANALYTICS_API_003', 'Failed to create visitor journey', {
      error: error.message,
      stack: error.stack,
    });
  }
}

/**
 * Updates an existing visitor journey record
 * @param {string} journeyId - The ID of the journey to update
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} The updated journey record
 */
export async function updateVisitorJourney(journeyId, updateData) {
  try {
    logger.info('IW_ANALYTICS_API_004', 'Updating visitor journey', {
      id: journeyId,
      fields: Object.keys(updateData),
    });
    const result = await sendPutRequest(
      `api/visitor-journey/${journeyId}`,
      updateData
    );
    logger.info('IW_ANALYTICS_API_005', 'Visitor journey updated successfully');
    return result;
  } catch (error) {
    logger.warn('IW_ANALYTICS_API_006', 'Failed to update visitor journey', {
      id: journeyId,
      error: error.message,
    });
  }
}

/**
 * Adds a page view to the journey
 * @param {string} journeyId - The ID of the journey
 * @param {Object} pageData - The page data (url, title, time_spent, scroll_depth, interactions)
 * @returns {Promise<Object>} The updated journey record
 */
export async function addPageToJourney(journeyId, pageData) {
  try {
    const result = await sendPostRequest(
      `api/visitor-journey/${journeyId}/pages`,
      pageData
    );

    return result;
  } catch (error) {
    logger.warn('IW_ANALYTICS_API_009', 'Failed to add page to journey', {
      id: journeyId,
      error: error.message,
    });
  }
}

/**
 * Adds a conversion event to the journey
 * @param {string} journeyId - The ID of the journey
 * @param {Object} conversionData - The conversion data (event name, value)
 * @returns {Promise<Object>} The updated journey record
 */
export async function addConversionEvent(journeyId, conversionData) {
  try {
    logger.info('IW_ANALYTICS_API_025', 'Sending conversion event', {
      journeyId,
      event: conversionData.event,
      hasContext: !!conversionData.element_context,
    });

    const result = await sendPostRequest(
      `api/visitor-journey/${journeyId}/conversions`,
      conversionData
    );

    logger.info('IW_ANALYTICS_API_026', 'Conversion event API response received', {
      success: !!result,
    });

    return result;
  } catch (error) {
    logger.error('IW_ANALYTICS_API_012', 'Failed to add conversion event', {
      id: journeyId,
      error: error.message,
      stack: error.stack,
    });
    throw error; // Re-throw so the caller knows it failed
  }
}

/**
 * Adds a bounce event to the journey
 * @param {string} journeyId - The ID of the journey
 * @param {Object} bounceEventData - The bounce event data
 * @returns {Promise<Object>} The updated journey record
 */
export async function addBounceEvent(journeyId, bounceEventData) {
  try {
    const result = await sendPostRequest(
      `api/visitor-journey/${journeyId}/bounce-event`,
      bounceEventData
    );
    return result;
  } catch (error) {
    logger.warn('IW_ANALYTICS_API_042', 'Failed to add bounce event', {
      id: journeyId,
      error: error.message,
    });
  }
}

/**
 * Updates session status (e.g., end session, mark inactive)
 * @param {string} journeyId - The ID of the journey
 * @param {Object} statusData - The session status data
 * @returns {Promise<Object>} The updated journey record
 */
export async function updateSessionStatus(journeyId, statusData) {
  try {
    const result = await sendPostRequest(
      `api/visitor-journey/${journeyId}/session-status`,
      statusData
    );

    return result;
  } catch (error) {
    logger.warn('IW_ANALYTICS_API_015', 'Failed to update session status', {
      id: journeyId,
      error: error.message,
    });
  }
}

/**
 * Gets visitor journey by session ID
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} The journey record
 */
export async function getVisitorJourneyBySession(sessionId) {
  try {
    const result = await sendGetRequest(
      `api/visitor-journey/session/${sessionId}`
    );
    // Backend returns { visitorJourney: {...} }, we need to unwrap it
    return result?.visitorJourney || result;
  } catch (error) {
    logger.error(
      'IW_ANALYTICS_API_022',
      'Failed to get visitor journey by session',
      {
        sessionId,
        error: error.message,
      }
    );
  }
}

/**
 * Sync critical journey data using fetch with keepalive (guaranteed delivery on page unload)
 * Uses fetch API with keepalive flag which keeps request alive even after page closes
 * @param {string} journeyId - The ID of the journey
 * @param {Object} criticalData - Critical data to sync (session status, engagement, bounce events)
 * @returns {boolean} Whether request was sent successfully
 */
export function syncCriticalDataBeacon(journeyId, criticalData) {
  try {
    const url = `${process.env.NODE_PUBLIC_API_URL}/api/visitor-journey/${journeyId}/sync-critical`;
    const authToken = process.env.ACCESS_TOKEN;

    // Use fetch with keepalive instead of sendBeacon
    // keepalive allows the request to outlive the page, similar to sendBeacon
    // but with the ability to set headers
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(criticalData),
      keepalive: true, // Critical: keeps request alive after page unload
      credentials: 'include',
    })
      .then(() => {
        logger.info(
          'IW_ANALYTICS_API_017',
          'Critical data sent with keepalive fetch',
          { journeyId }
        );
      })
      .catch((error) => {
        // Errors here won't be logged if page already closed, but that's ok
        logger.warn('IW_ANALYTICS_API_018', 'Keepalive fetch failed', {
          error: error.message,
        });
      });

    return true;
  } catch (error) {
    logger.warn('IW_ANALYTICS_API_019', 'Failed to send critical data', {
      error: error.message,
    });
    return syncCriticalDataFallback(journeyId, criticalData);
  }
}

/**
 * Fallback sync using synchronous XMLHttpRequest (blocks but guarantees delivery)
 * Only used when sendBeacon is unavailable or fails
 * @param {string} journeyId - The ID of the journey
 * @param {Object} criticalData - Critical data to sync
 * @returns {boolean} Whether request completed
 */
function syncCriticalDataFallback(journeyId, criticalData) {
  try {
    const xhr = new XMLHttpRequest();
    // Use the sync-critical endpoint
    const url = `${process.env.NODE_PUBLIC_API_URL}/api/visitor-journey/${journeyId}/sync-critical`;
    const authToken = process.env.ACCESS_TOKEN;

    // Synchronous request (blocks until complete - use only on page unload!)
    xhr.open('POST', url, false); // false = synchronous
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);

    // Send all critical data including bounce events
    xhr.send(JSON.stringify(criticalData));

    logger.info('IW_ANALYTICS_API_020', 'Critical data sent via fallback', {
      status: xhr.status,
    });

    return xhr.status >= 200 && xhr.status < 300;
  } catch (error) {
    logger.warn('IW_ANALYTICS_API_021', 'Fallback sync failed', {
      error: error.message,
    });
    return false;
  }
}

/**
 * Gets the active conversion config for an organization
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Object>} The conversion config object
 */
export async function getConversionConfig(organizationId) {
  try {
    logger.info('IW_ANALYTICS_API_023', 'Fetching conversion config', {
      org_id: organizationId,
    });
    const result = await sendGetRequest(
      `api/conversion-config/${organizationId}`
    );
    logger.info('IW_ANALYTICS_API_024', 'Conversion config fetched', {
      config_id: result?.config?.id,
      selector: result?.config?.element_selector,
    });
    return result?.config || null;
  } catch (error) {
    // If 404, no active config exists - this is not an error
    if (error.statusCode === 404) {
      logger.info('IW_ANALYTICS_API_025', 'No active conversion config found', {
        org_id: organizationId,
      });
      return null;
    }
    logger.error('IW_ANALYTICS_API_026', 'Failed to fetch conversion config', {
      org_id: organizationId,
      error: error.message,
    });
    logger.error('IW_ANALYTICS_API_026', 'Failed to fetch conversion config', {
      org_id: organizationId,
      error: error.message,
    });
  }
}

/**
 * Reports a validation failure when element selector is not found
 * @param {string} organizationId - The organization ID
 * @param {Object} failureData - The validation failure data
 * @returns {Promise<Object>} The response from the API
 */
export async function reportValidationFailure(organizationId, failureData) {
  try {
    logger.warn('IW_ANALYTICS_API_027', 'Reporting validation failure', {
      org_id: organizationId,
      page_url: failureData.page_url,
      selector: failureData.selector,
    });
    const result = await sendPostRequest(
      `api/conversion-config/${organizationId}/validation-failure`,
      failureData
    );
    return result;
  } catch (error) {
    // Don't throw on validation failure reporting - it's not critical
    logger.error(
      'IW_ANALYTICS_API_028',
      'Failed to report validation failure',
      {
        org_id: organizationId,
        error: error.message,
      }
    );
    return null;
  }
}
