import { getOrganization } from '../../assistant/utils/state';
import { sendPostRequest } from './baseMethods';
import logger from '../logger';

/**
 * Extracts the base domain from a hostname, removing common prefixes like www
 * @param {string} hostname - The hostname to extract base domain from
 * @returns {string} - The base domain (e.g., "example.com" from "www.example.com")
 */
function getBaseDomain(hostname) {
  // Remove common prefixes like www, m, mobile, app, etc.
  const prefixes = ['www.', 'm.', 'mobile.', 'app.', 'admin.', 'api.'];

  let baseDomain = hostname.toLowerCase();

  // Remove any of the common prefixes
  for (const prefix of prefixes) {
    if (baseDomain.startsWith(prefix)) {
      baseDomain = baseDomain.substring(prefix.length);
      break;
    }
  }

  return baseDomain;
}

/**
 * Checks if the current website URL matches the organization's registered website
 * Now uses flexible domain matching that ignores prefixes like www, subdomains, and protocols
 * @returns {boolean} - True if base domains match, false otherwise
 */
export function validateWebsiteUrl() {
  const organization = getOrganization();
  if (!organization || !organization.organization_website) {
    return false;
  }

  try {
    // window.location.hostname should never include protocol, but let's be safe
    const currentDomain = window.location.hostname;
    const currentBaseDomain = getBaseDomain(currentDomain);

    // Handle URLs with or without protocol
    let websiteUrl = organization.organization_website;
    if (
      !websiteUrl.startsWith('http://') &&
      !websiteUrl.startsWith('https://')
    ) {
      websiteUrl = `https://${websiteUrl}`;
    }

    const orgWebsite = new URL(websiteUrl).hostname;
    const orgBaseDomain = getBaseDomain(orgWebsite);

    // Compare base domains (ignoring prefixes like www, subdomains, etc.)
    return currentBaseDomain === orgBaseDomain;
  } catch (error) {
    console.error('Error validating website URL:', error);
    return false;
  }
}

/**
 * Registers the plugin installation with the backend
 * Only sends if the current website matches the organization's website
 * @param {string} organizationId - The organization ID
 * @param {string} version - Plugin version (optional)
 * @returns {Promise<object>} - The response from the API
 */
export async function registerPluginInstallation(
  organizationId,
  version = null
) {
  if (window.location.hostname === 'localhost') {
    // Skip validation on localhost for development purposes
    return await sendPostRequest('api/plugin-status/install', {
      organizationId,
      ...(version && { installationData: { version } }),
    });
  }
  if (!validateWebsiteUrl()) {
    return { success: false, reason: 'website_mismatch' };
  }

  const payload = {
    organizationId,
    ...(version && { installationData: { version } }),
  };

  try {
    return await sendPostRequest('api/plugin-status/install', payload);
  } catch (error) {
    logger.error('IW_PLUGIN_001', 'Failed to register plugin installation', {
      error: error.message,
      organizationId,
    });
  }
}

/**
 * Sends a heartbeat to confirm the plugin is active and responding
 * Only sends if the current website matches the organization's website
 * @param {string} organizationId - The organization ID
 * @returns {Promise<object>} - The response from the API
 */
export async function sendPluginHeartbeat(organizationId) {
  if (window.location.hostname === 'localhost') {
    // Skip validation on localhost for development purposes
    return await sendPostRequest('api/plugin-status/heartbeat', {
      organizationId,
    });
  }
  if (!validateWebsiteUrl()) {
    return { success: false, reason: 'website_mismatch' };
  }

  try {
    return await sendPostRequest('api/plugin-status/heartbeat', {
      organizationId,
    });
  } catch (error) {
    logger.error('IW_PLUGIN_002', 'Failed to send plugin heartbeat', {
      error: error.message,
      organizationId,
    });
  }
}

/**
 * Starts the heartbeat interval to periodically confirm plugin status
 * @param {string} organizationId - The organization ID
 * @param {number} intervalMinutes - How often to send heartbeat (default: 5 minutes)
 * @returns {number} - The interval ID for clearing later
 */
export function startHeartbeatInterval(organizationId, intervalMinutes = 5) {
  const intervalMs = intervalMinutes * 60 * 1000;

  return setInterval(async () => {
    try {
      await sendPluginHeartbeat(organizationId);
    } catch {
      // Silent fail for heartbeats to avoid console spam
    }
  }, intervalMs);
}
