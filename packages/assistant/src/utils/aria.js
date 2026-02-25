/**
 * ARIA Utilities
 * Consistent ARIA attribute management for accessibility and AI agent compatibility
 *
 * @module utils/aria
 */

/**
 * ARIA utility functions for consistent accessibility implementation
 */
export const ariaUtils = {
  /**
   * Set multiple ARIA attributes on an element
   * @param {HTMLElement} element - The element to set attributes on
   * @param {Object} attributes - Key-value pairs of attributes to set
   */
  setAttributes(element, attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(key, value);
      }
    });
  },

  /**
   * Create button with ARIA attributes
   * @param {string} label - Accessible label for the button
   * @param {Object} options - Additional ARIA options
   * @param {boolean} [options.pressed] - Toggle button pressed state
   * @param {boolean} [options.expanded] - Expandable button expanded state
   * @param {boolean} [options.disabled] - Disabled state
   * @param {string} [options.controls] - ID of element this button controls
   * @returns {HTMLButtonElement} Button element with ARIA attributes
   */
  createButton(label, options = {}) {
    const button = document.createElement('button');
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', label);

    if (options.pressed !== undefined) {
      button.setAttribute('aria-pressed', options.pressed.toString());
    }
    if (options.expanded !== undefined) {
      button.setAttribute('aria-expanded', options.expanded.toString());
    }
    if (options.disabled) {
      button.setAttribute('aria-disabled', 'true');
      button.disabled = true;
    }
    if (options.controls) {
      button.setAttribute('aria-controls', options.controls);
    }

    return button;
  },

  /**
   * Create live region for dynamic content announcements
   * @param {string} level - Live region level ('polite' or 'assertive')
   * @param {string} [label] - Optional label for the region
   * @returns {HTMLDivElement} Live region element
   */
  createLiveRegion(level = 'polite', label = '') {
    const region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', level);
    region.setAttribute('aria-atomic', 'true');
    if (label) {
      region.setAttribute('aria-label', label);
    }
    return region;
  },

  /**
   * Announce message to screen readers
   * Creates a temporary live region, announces message, then removes it
   * @param {string} message - Message to announce
   * @param {string} [priority] - Priority level ('polite' or 'assertive')
   */
  announce(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute(
      'role',
      priority === 'assertive' ? 'alert' : 'status'
    );
    announcement.setAttribute('aria-live', priority);
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement (give screen readers time to read)
    setTimeout(() => announcement.remove(), 1000);
  },

  /**
   * Create visually hidden element (screen reader only)
   * @param {string} text - Text content for screen readers
   * @returns {HTMLSpanElement} Screen reader only element
   */
  createSROnly(text) {
    const element = document.createElement('span');
    element.className = 'sr-only';
    element.textContent = text;
    return element;
  },

  /**
   * Toggle button pressed state
   * @param {HTMLElement} button - Button element to toggle
   * @returns {boolean} New pressed state
   */
  togglePressed(button) {
    const pressed = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', (!pressed).toString());
    return !pressed;
  },

  /**
   * Toggle expanded state
   * @param {HTMLElement} element - Element to toggle
   * @returns {boolean} New expanded state
   */
  toggleExpanded(element) {
    const expanded = element.getAttribute('aria-expanded') === 'true';
    element.setAttribute('aria-expanded', (!expanded).toString());
    return !expanded;
  },

  /**
   * Set invalid state with error message for form inputs
   * @param {HTMLInputElement} input - Input element to mark as invalid
   * @param {string} errorMessage - Error message to display
   * @returns {HTMLSpanElement} Error element created
   */
  setInvalid(input, errorMessage) {
    input.setAttribute('aria-invalid', 'true');
    const errorId = `error-${input.id || Math.random().toString(36).substr(2, 9)}`;
    input.setAttribute('aria-describedby', errorId);

    const error = document.createElement('span');
    error.id = errorId;
    error.setAttribute('role', 'alert');
    error.className = 'error-message';
    error.textContent = errorMessage;

    input.parentNode.appendChild(error);
    return error;
  },

  /**
   * Clear invalid state from form input
   * @param {HTMLInputElement} input - Input element to clear invalid state from
   */
  clearInvalid(input) {
    input.setAttribute('aria-invalid', 'false');
    const errorId = input.getAttribute('aria-describedby');
    if (errorId) {
      const error = document.getElementById(errorId);
      if (error) error.remove();
      input.removeAttribute('aria-describedby');
    }
  },

  /**
   * Create a region container with ARIA role
   * @param {string} label - Accessible label for the region
   * @param {string} [description] - Optional description
   * @returns {HTMLDivElement} Region element
   */
  createRegion(label, description = '') {
    const region = document.createElement('div');
    region.setAttribute('role', 'region');
    region.setAttribute('aria-label', label);
    if (description) {
      const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
      region.setAttribute('aria-describedby', descId);

      const descElement = this.createSROnly(description);
      descElement.id = descId;
      region.appendChild(descElement);
    }
    return region;
  },

  /**
   * Create a dialog with ARIA attributes
   * @param {string} title - Dialog title
   * @param {boolean} [modal] - Whether dialog is modal
   * @returns {Object} Dialog elements (container, title element, content element)
   */
  createDialog(title, modal = true) {
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    if (modal) {
      dialog.setAttribute('aria-modal', 'true');
    }

    const titleId = `dialog-title-${Math.random().toString(36).substr(2, 9)}`;
    dialog.setAttribute('aria-labelledby', titleId);

    const titleElement = document.createElement('h2');
    titleElement.id = titleId;
    titleElement.textContent = title;

    const contentElement = document.createElement('div');

    dialog.appendChild(titleElement);
    dialog.appendChild(contentElement);

    return { dialog, titleElement, contentElement };
  },

  /**
   * Set or update the label on an element
   * @param {HTMLElement} element - Element to label
   * @param {string} label - New label text
   */
  setLabel(element, label) {
    element.setAttribute('aria-label', label);
  },

  /**
   * Create progress indicator
   * @param {string} label - Label for the progress bar
   * @param {number} [min] - Minimum value (default 0)
   * @param {number} [max] - Maximum value (default 100)
   * @param {number} [current] - Current value (default 0)
   * @returns {HTMLDivElement} Progress bar element
   */
  createProgressBar(label, min = 0, max = 100, current = 0) {
    const progress = document.createElement('div');
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-label', label);
    progress.setAttribute('aria-valuemin', min.toString());
    progress.setAttribute('aria-valuemax', max.toString());
    progress.setAttribute('aria-valuenow', current.toString());
    return progress;
  },

  /**
   * Update progress bar value
   * @param {HTMLElement} progressBar - Progress bar element
   * @param {number} value - New value
   */
  updateProgress(progressBar, value) {
    progressBar.setAttribute('aria-valuenow', value.toString());
    const max = parseInt(progressBar.getAttribute('aria-valuemax'));
    const percent = Math.round((value / max) * 100);
    const label = progressBar.getAttribute('aria-label').split(':')[0];
    progressBar.setAttribute('aria-label', `${label}: ${percent}% complete`);
  },
};

/**
 * Default export
 */
export default ariaUtils;
