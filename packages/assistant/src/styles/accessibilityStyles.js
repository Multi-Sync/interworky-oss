/**
 * Accessibility Styles
 * Injects CSS for accessibility features like screen reader only content and focus indicators
 */

/**
 * Injects accessibility CSS into the document
 * Should be called once during initialization
 */
export function injectAccessibilityStyles() {
  // Check if styles are already injected
  if (document.getElementById('interworky-accessibility-styles')) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = 'interworky-accessibility-styles';
  styleElement.textContent = `
    /* Screen reader only content */
    /* Visually hidden but accessible to assistive technology and AI agents */
    .sr-only {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border-width: 0 !important;
    }

    /* Focus visible styles */
    /* Ensure keyboard focus is clearly visible */
    *:focus-visible {
      outline: 2px solid #4A90E2 !important;
      outline-offset: 2px !important;
    }

    /* Skip to main content link (if needed in the future) */
    .skip-to-main {
      position: absolute !important;
      top: -40px !important;
      left: 0 !important;
      background: #000 !important;
      color: #fff !important;
      padding: 8px !important;
      z-index: 100000 !important;
      text-decoration: none !important;
    }

    .skip-to-main:focus {
      top: 0 !important;
    }

    /* Ensure buttons and interactive elements have pointer cursor */
    [role="button"],
    button,
    [tabindex="0"]:not(input):not(textarea) {
      cursor: pointer !important;
    }

    /* Improve focus indicators for Interworky elements */
    #interworky-chat *:focus-visible,
    #assistant-container *:focus-visible,
    #interworky-customer-assistant-popup *:focus-visible {
      outline: 2px solid #4A90E2 !important;
      outline-offset: 2px !important;
    }
  `;

  document.head.appendChild(styleElement);
}

/**
 * Remove accessibility styles (for cleanup)
 */
export function removeAccessibilityStyles() {
  const styleElement = document.getElementById(
    'interworky-accessibility-styles'
  );
  if (styleElement) {
    styleElement.remove();
  }
}
