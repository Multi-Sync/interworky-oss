import { getOrganization, setOrgId } from '../../assistant/utils/state';
import { sendGetRequest } from './baseMethods';

/**
 * Retrieves an organization by its ID from the server.
 *
 * @param {string} organizationId - The ID of the organization to retrieve.
 * @returns {Promise<object>} - The organization data retrieved from the server.
 */
export async function getOrganizationById(organizationId) {
  setOrgId(organizationId);
  return sendGetRequest(`api/organizations/${organizationId}`);
}

/**
 * Retrieves an assistant by its org id from the server.
 *
 * @param {string} organizationId - The ID of the organization to retrieve.
 * @returns {Promise<object>} - The organizationAssistants data retrieved from the server.
 */
export async function getAssistantByOrganizationId(organizationId) {
  return sendGetRequest(
    `api/organization-assistants/organization/${organizationId}`
  );
}

/**
 * Retrieves a user by the Id from the server.
 *
 * @param {string} userId - The ID of the user to retrieve.
 * @returns {Promise<object>} - The user data retrieved from the server.
 */
export async function getUser(userId) {
  return sendGetRequest(`api/users/${userId}`);
}

/**
 * Retrieves an organization usage by its ID from the server.
 *
 * @param {string} organizationId - The ID of the organization to retrieve.
 * @returns {Promise<object>} - The organization usage data retrieved from the server.
 */
export async function getOrganizationUsage() {
  const organizationId = getOrganization().id;
  return sendGetRequest(`api/organizations/usage/${organizationId}`);
}
