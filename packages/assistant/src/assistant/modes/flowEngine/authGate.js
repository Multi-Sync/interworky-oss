// src/assistant/modes/flowEngine/authGate.js
/**
 * Auth Gate - Shows Google sign-in modal before results
 * Uses Auth Bridge to delegate authentication to the frontend
 */

import { createElement } from '../../ui/baseMethods';
import { logger } from '../../../utils/logger';
import {
  isFlowAuthenticated,
  getFlowUser,
  requestAuth,
  chargeFlowTokens,
  updateFlowUserBalance,
} from '../../../utils/authBridge';

/**
 * Show the auth gate modal
 * @param {Object} flowConfig - Flow configuration
 * @param {string} sessionId - Current session ID
 * @param {Function} onSuccess - Callback when auth succeeds (receives { user, chargeResult })
 * @param {Function} onSkip - Callback when user skips auth (if allowed)
 * @param {boolean} skipCharging - If true, skip token charging (for dual-agent mode)
 */
export function showAuthGate(flowConfig, sessionId, onSuccess, onSkip = null, skipCharging = false) {
  // Check if already authenticated
  if (isFlowAuthenticated()) {
    const user = getFlowUser();
    // User is already logged in, proceed to charge and show results
    handleAuthSuccess(user, flowConfig, sessionId, onSuccess, skipCharging);
    return;
  }

  const themeColor = flowConfig?.output_schema?.theme_color || '#57534e';

  // Create overlay
  const overlay = createElement(
    'div',
    {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10002',
      animation: 'fadeIn 0.3s ease-out',
    },
    { id: 'flow-auth-gate-overlay' }
  );

  // Add animations
  const style = document.createElement('style');
  style.id = 'flow-auth-gate-styles';
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `;
  if (!document.getElementById('flow-auth-gate-styles')) {
    document.head.appendChild(style);
  }

  // Modal container
  const modal = createElement(
    'div',
    {
      backgroundColor: '#fafaf9',
      borderRadius: '20px',
      padding: '32px',
      maxWidth: '400px',
      width: '90%',
      textAlign: 'center',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      animation: 'slideUp 0.4s ease-out',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    {}
  );

  // Success icon with theme color
  const iconContainer = createElement(
    'div',
    {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      backgroundColor: themeColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
    },
    {}
  );
  iconContainer.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`;

  // Title
  const title = createElement(
    'h2',
    {
      fontSize: '22px',
      fontWeight: '600',
      color: '#292524',
      marginBottom: '10px',
    },
    { textContent: 'Your results are ready!' }
  );

  // Subtitle
  const subtitle = createElement(
    'p',
    {
      fontSize: '15px',
      color: '#57534e',
      marginBottom: '24px',
      lineHeight: '1.5',
    },
    { textContent: 'Sign in with Google to view your results and get 1 million free tokens.' }
  );

  // Token bonus badge
  const tokenBadge = createElement(
    'div',
    {
      backgroundColor: '#ecfdf5',
      border: '1px solid #6ee7b7',
      borderRadius: '8px',
      padding: '12px 16px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    {}
  );
  tokenBadge.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    <span style="color: #059669; font-weight: 500; font-size: 14px;">New users get 1,000,000 free tokens!</span>
  `;

  // Google Sign-in button
  const googleBtn = createElement(
    'button',
    {
      width: '100%',
      padding: '14px 20px',
      fontSize: '15px',
      fontWeight: '500',
      color: '#292524',
      backgroundColor: '#fff',
      border: '1px solid #d6d3d1',
      borderRadius: '10px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      transition: 'all 0.2s ease',
      marginBottom: '12px',
    },
    { id: 'flow-google-signin-btn' }
  );

  // Google logo SVG
  googleBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    <span>Continue with Google</span>
  `;

  googleBtn.addEventListener('mouseenter', () => {
    googleBtn.style.backgroundColor = '#f5f5f4';
    googleBtn.style.borderColor = '#a8a29e';
  });
  googleBtn.addEventListener('mouseleave', () => {
    googleBtn.style.backgroundColor = '#fff';
    googleBtn.style.borderColor = '#d6d3d1';
  });

  googleBtn.addEventListener('click', () => {
    initiateGoogleSignIn(flowConfig, sessionId, onSuccess, overlay, skipCharging);
  });

  // Assemble modal
  modal.appendChild(iconContainer);
  modal.appendChild(title);
  modal.appendChild(subtitle);
  modal.appendChild(tokenBadge);
  modal.appendChild(googleBtn);

  // Skip option (if allowed - for free flows or testing)
  if (onSkip && !flowConfig.token_cost) {
    const skipLink = createElement(
      'button',
      {
        background: 'none',
        border: 'none',
        color: '#78716c',
        fontSize: '13px',
        cursor: 'pointer',
        marginTop: '12px',
        padding: '8px',
        textDecoration: 'underline',
      },
      { textContent: 'Skip for now' }
    );
    skipLink.addEventListener('click', () => {
      overlay.remove();
      onSkip();
    });
    modal.appendChild(skipLink);
  }

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

/**
 * Initiate Google Sign-In flow via Auth Bridge
 * Opens popup to frontend which handles OAuth via NextAuth
 * @param {boolean} skipCharging - If true, skip token charging (for dual-agent mode)
 */
async function initiateGoogleSignIn(flowConfig, sessionId, onSuccess, overlay, skipCharging = false) {
  const btn = document.getElementById('flow-google-signin-btn');
  if (btn) {
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#57534e" stroke-width="2" class="animate-spin">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"/>
      </svg>
      <span>Signing in...</span>
    `;
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.7';
  }

  try {
    // Use Auth Bridge to request auth from frontend
    const { user, token } = await requestAuth({
      flowId: flowConfig?.flow_id,
      sessionId,
    });

    logger.info('FLOW_AUTH', 'Auth successful via bridge', { userId: user?.id });
    overlay.remove();
    handleAuthSuccess(user, flowConfig, sessionId, onSuccess, skipCharging);
  } catch (error) {
    logger.error('FLOW_AUTH', 'Auth failed', { error: error.message });
    showAuthError(overlay, error.message);
  }
}

/**
 * Handle successful authentication
 * @param {boolean} skipCharging - If true, skip token charging (for dual-agent mode)
 */
async function handleAuthSuccess(user, flowConfig, sessionId, onSuccess, skipCharging = false) {
  let chargeResult = null;

  // Charge tokens if flow has a cost (unless skipCharging is true for dual-agent mode)
  if (!skipCharging && flowConfig.token_cost && flowConfig.token_cost > 0) {
    try {
      chargeResult = await chargeFlowTokens(flowConfig.flow_id, sessionId);
      logger.info('FLOW_AUTH', 'Tokens charged', {
        amount: chargeResult.amount,
        newBalance: chargeResult.new_balance,
      });
      // Update localStorage with new balance
      if (chargeResult?.new_balance !== undefined) {
        updateFlowUserBalance(chargeResult.new_balance);
      }
    } catch (error) {
      logger.error('FLOW_AUTH', 'Failed to charge tokens', { error: error.message });
      // Continue anyway - don't block results for payment issues
    }
  } else if (skipCharging) {
    logger.info('FLOW_AUTH', 'Skipping token charge (dual-agent mode - will charge after quality approval)');
  }

  onSuccess({ user, chargeResult });
}

/**
 * Show auth error in the modal
 */
function showAuthError(overlay, message) {
  const btn = document.getElementById('flow-google-signin-btn');
  if (btn) {
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="m15 9-6 6M9 9l6 6"/>
      </svg>
      <span style="color: #dc2626;">Try again</span>
    `;
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
    btn.style.borderColor = '#fca5a5';
  }

  // Show error message
  const modal = overlay.querySelector('div');
  let errorEl = modal.querySelector('.auth-error');
  if (!errorEl) {
    errorEl = createElement(
      'div',
      {
        color: '#dc2626',
        fontSize: '13px',
        marginTop: '12px',
        padding: '8px 12px',
        backgroundColor: '#fef2f2',
        borderRadius: '6px',
      },
      { className: 'auth-error', textContent: message }
    );
    modal.insertBefore(errorEl, btn.nextSibling);
  } else {
    errorEl.textContent = message;
  }
}

/**
 * Check if auth is required for this flow
 */
export function requiresAuth(flowConfig) {
  return flowConfig?.requires_auth === true || flowConfig?.token_cost > 0;
}
