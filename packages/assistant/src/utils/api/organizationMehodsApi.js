import { sendGetRequest } from './baseMethods';

/**
 * Retrieves an assistant by its org id from the server.
 *
 * @param {string} organizationId - The ID of the organization to retrieve.
 * @returns {Promise<object>} - The organizationAssistants data retrieved from the server.
 */
export async function getOrgMethodsByOrganizationId(organizationId) {
  return sendGetRequest(
    `api/organization-methods/organization/${organizationId}`
  );
}
