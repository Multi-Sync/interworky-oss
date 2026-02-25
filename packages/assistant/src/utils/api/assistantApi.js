import { sendGetRequest } from './baseMethods';

/**
 * Retrieves an assistant info using orgId.
 *
 * @param {string} orgId - The ID of the organization to retrieve.
 * @returns {assistantInfo<object>} - The organization theme data retrieved from the server.
 */
export async function fetchAssistantInfo(orgId) {
  return sendGetRequest(`api/assistant-info/${orgId}`);
}
