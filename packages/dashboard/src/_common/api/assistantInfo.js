/**
 * Assistant Info API Functions
 * API calls for managing assistant configuration
 */

import axiosInstance from '../utils/axios/axiosInstance';

/**
 * Update auto-fix enabled status
 * NOTE: Auto-fix is now part of OrganizationVersionControl, not AssistantInfo
 * @param {string} organizationId - Organization UUID
 * @param {boolean} autoFixEnabled - Whether auto-fix should be enabled
 * @returns {Promise<Object>} Updated version control data
 */
export async function updateAutoFixEnabled(organizationId, autoFixEnabled) {
  const response = await axiosInstance.patch(`/api/organization-version-control/${organizationId}/auto-fix`, {
    auto_fix_enabled: autoFixEnabled,
  });
  return response.data;
}

/**
 * Get assistant info for organization
 * @param {string} organizationId - Organization UUID
 * @returns {Promise<Object>} Assistant info data
 */
