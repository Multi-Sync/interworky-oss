// src/utils/api/flowAuthApi.js
/**
 * Flow Authentication API
 * Handles OAuth and token operations for standalone flow users
 */

import { logger } from '../logger';
import { sendGetRequest, sendPostRequest } from './baseMethods';

// Token storage keys
const TOKEN_KEY = 'iw_flow_token';
const USER_KEY = 'iw_flow_user';

/**
 * Get stored auth token
 */
export function getFlowAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Get stored user info
 */
export function getFlowUser() {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isFlowAuthenticated() {
  return !!getFlowAuthToken();
}

/**
 * Store auth token and user info
 */
function storeAuth(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    logger.warn('FLOW_AUTH', 'Failed to store auth', { error: e.message });
  }
}

/**
 * Clear stored auth
 */
export function clearFlowAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    // Ignore
  }
}

/**
 * Update stored user's token balance
 * @param {number} newBalance - The new token balance
 */
export function updateFlowUserBalance(newBalance) {
  try {
    const user = getFlowUser();
    if (user && newBalance !== undefined) {
      user.token_balance = newBalance;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      logger.info('FLOW_AUTH_API', 'Updated user balance in localStorage', { newBalance });
      return true;
    }
    return false;
  } catch (e) {
    logger.warn('FLOW_AUTH_API', 'Failed to update user balance', { error: e.message });
    return false;
  }
}

/**
 * Authenticate with Google (called after Google OAuth flow)
 * @param {Object} googleData - Google auth data { email, name, avatar_url, oauth_id }
 * @returns {Promise<Object>} - { token, user, is_new_user }
 */
export async function authenticateWithGoogle(googleData) {
  const result = await sendPostRequest('api/flows/auth/google', googleData);

  if (!result) {
    throw new Error('Authentication failed');
  }

  // Store auth data
  storeAuth(result.token, result.user);

  logger.info('FLOW_AUTH', 'Google auth successful', {
    isNewUser: result.is_new_user,
    userId: result.user.id,
  });

  return result;
}

/**
 * Get current user info from API
 */
export async function fetchFlowUser() {
  const token = getFlowAuthToken();
  if (!token) return null;

  const user = await sendGetRequest('api/flows/auth/me', '', token);

  if (!user || user.statusCode === 404) {
    clearFlowAuth();
    return null;
  }

  // Update stored user
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    // Ignore
  }

  return user;
}

/**
 * Get token balance
 */
export async function getTokenBalance() {
  const token = getFlowAuthToken();
  if (!token) return null;

  const result = await sendGetRequest('api/flows/auth/balance', '', token);

  if (!result) return null;

  return result.balance;
}

/**
 * Charge tokens for flow usage
 * @param {string} flowId - Flow ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} - { success, charged, amount, new_balance }
 */
export async function chargeFlowTokens(flowId, sessionId) {
  const token = getFlowAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const result = await sendPostRequest(
    `api/flows/${flowId}/charge`,
    { session_id: sessionId },
    '',
    token
  );

  if (!result) {
    throw new Error('Failed to charge tokens');
  }

  return result;
}

/**
 * Check if user can afford a flow
 * @param {number} tokenCost - Cost of the flow
 */
export async function checkAffordability(tokenCost) {
  const token = getFlowAuthToken();
  if (!token) return { sufficient: false, balance: 0 };

  const result = await sendPostRequest(
    'api/flows/auth/check-affordability',
    { token_cost: tokenCost },
    '',
    token
  );

  if (!result) return { sufficient: false, balance: 0 };

  return result;
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(limit = 20) {
  const token = getFlowAuthToken();
  if (!token) return [];

  const result = await sendGetRequest(`api/flows/auth/transactions?limit=${limit}`, '', token);

  if (!result) return [];

  return result.transactions || [];
}

/**
 * Save flow result for user to review later
 * @param {Object} options
 * @param {string} options.flowId - The flow ID
 * @param {string} options.sessionId - The session ID
 * @param {Object} options.collectedData - Data collected from flow tools
 * @param {Object} options.completionResult - The completion/analysis result
 * @param {string} options.renderedHtml - The rendered HTML output
 * @param {number} options.tokensCharged - Tokens charged for this result
 * @returns {Promise<{ success, result_id, duplicate, message }>}
 */
export async function saveFlowResult({
  flowId,
  sessionId,
  collectedData,
  completionResult,
  renderedHtml,
  tokensCharged = 0,
}) {
  const token = getFlowAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const result = await sendPostRequest(
    `api/flows/${flowId}/result`,
    {
      session_id: sessionId,
      collected_data: collectedData,
      completion_result: completionResult,
      rendered_html: renderedHtml,
      tokens_charged: tokensCharged,
    },
    '',
    token
  );

  if (!result) {
    throw new Error('Failed to save result');
  }

  return result;
}
