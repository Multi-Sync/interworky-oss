// src/utils/authBridge.js
/**
 * Auth Bridge - Communication protocol between widget and frontend
 *
 * This module handles popup-based authentication with the frontend.
 * For backend API calls, use flowAuthApi.js directly.
 *
 * Messages:
 *   Widget → Frontend:
 *     { type: 'iw:auth:request', flowId: string, sessionId: string }
 *
 *   Frontend → Widget:
 *     { type: 'iw:auth:success', user: object, token: string }
 *     { type: 'iw:auth:error', error: string }
 *     { type: 'iw:auth:cancel' }
 */

import { logger } from './logger';

// Re-export all flow auth API functions for backward compatibility
export {
  getFlowAuthToken,
  getFlowUser,
  isFlowAuthenticated,
  clearFlowAuth,
  updateFlowUserBalance,
  chargeFlowTokens,
  saveFlowResult,
} from './api/flowAuthApi';

// Import what we need locally
import { getFlowAuthToken, getFlowUser } from './api/flowAuthApi';

// Frontend auth URL - where auth happens
// In development, this should point to localhost:31531
const AUTH_URL = process.env.DASHBOARD_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:31531'
    : 'https://interworky.com');

// Token storage keys
const TOKEN_KEY = 'iw_flow_token';
const USER_KEY = 'iw_flow_user';

/**
 * Store auth data received from frontend
 */
export function storeAuthData(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return true;
  } catch (e) {
    logger.warn('AUTH_BRIDGE', 'Failed to store auth data', { error: e.message });
    return false;
  }
}

/**
 * Request authentication from frontend
 * Opens a popup to the frontend auth page and waits for response
 *
 * @param {Object} options - { flowId, sessionId }
 * @returns {Promise<{ user, token }>}
 */
export function requestAuth({ flowId, sessionId }) {
  return new Promise((resolve, reject) => {
    // Store existing token to detect changes
    const existingToken = getFlowAuthToken();

    const width = 450;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    // Build auth URL with params
    const authUrl = new URL(`${AUTH_URL}/flow/auth`);
    authUrl.searchParams.set('flowId', flowId || '');
    authUrl.searchParams.set('sessionId', sessionId || '');
    authUrl.searchParams.set('origin', window.location.origin);

    logger.info('AUTH_BRIDGE', 'Opening auth popup', { url: authUrl.toString() });

    const popup = window.open(
      authUrl.toString(),
      'Interworky Sign In',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup || popup.closed) {
      reject(new Error('Popup blocked. Please allow popups for this site.'));
      return;
    }

    let resolved = false;

    // Listen for messages from popup
    const handleMessage = (event) => {
      // Accept messages from frontend origin
      if (!event.origin.includes('interworky.com') && !event.origin.includes('localhost')) {
        return;
      }

      const { type, user, token, error } = event.data || {};

      if (type === 'iw:auth:success') {
        resolved = true;
        window.removeEventListener('message', handleMessage);
        popup.close();

        // Store auth data
        storeAuthData(token, user);

        logger.info('AUTH_BRIDGE', 'Auth successful via postMessage', { userId: user?.id });
        resolve({ user, token });
      } else if (type === 'iw:auth:error') {
        resolved = true;
        window.removeEventListener('message', handleMessage);
        popup.close();

        logger.error('AUTH_BRIDGE', 'Auth error', { error });
        reject(new Error(error || 'Authentication failed'));
      } else if (type === 'iw:auth:cancel') {
        resolved = true;
        window.removeEventListener('message', handleMessage);
        popup.close();

        logger.info('AUTH_BRIDGE', 'Auth cancelled by user');
        reject(new Error('Authentication cancelled'));
      }
    };

    window.addEventListener('message', handleMessage);

    // Poll for popup close and localStorage changes (fallback for COOP blocking postMessage)
    const checkInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkInterval);
        window.removeEventListener('message', handleMessage);

        // If already resolved via postMessage, don't do anything
        if (resolved) return;

        // Check if auth succeeded via localStorage (fallback for blocked postMessage)
        const newToken = getFlowAuthToken();
        const user = getFlowUser();

        if (newToken && newToken !== existingToken && user) {
          logger.info('AUTH_BRIDGE', 'Auth successful via localStorage fallback', { userId: user?.id });
          resolve({ user, token: newToken });
        } else {
          reject(new Error('Authentication cancelled'));
        }
      }
    }, 500);
  });
}
