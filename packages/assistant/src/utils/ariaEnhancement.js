import { logger } from './logger';

/**
 * ARIA Enhancement Engine
 * Loads cached ARIA rules from GCS and applies them to the DOM
 */
class ARIAEnhancementEngine {
  constructor(orgDomain) {
    this.orgDomain = orgDomain;
    this.rules = null;
    this.applied = false;
    this.observer = null;
    this.debounceTimer = null;
  }

  /**
   * Load ARIA enhancement rules from Google Cloud Storage
   */
  async loadRules() {
    if (this.rules) return this.rules; // Already loaded

    const url = `https://storage.googleapis.com/carla/${this.orgDomain}/aria-enhancements-${this.orgDomain}.json`;

    try {
      logger.debug('IW_ARIA_001', `Loading enhancement rules from: ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.rules = await response.json();
      logger.debug(
        'IW_ARIA_002',
        `Loaded ${this.rules.rules?.length || 0} enhancement rules`
      );
      return this.rules;
    } catch (error) {
      logger.warn('IW_ARIA_003', 'Failed to load enhancement rules', {
        error: error.message,
      });
      this.rules = { rules: [] }; // Empty fallback
      return this.rules;
    }
  }

  /**
   * Apply ARIA enhancement rules to the DOM
   */
  applyEnhancements() {
    if (!this.rules?.rules || this.rules.rules.length === 0) {
      logger.debug('IW_ARIA_004', 'No rules to apply');
      return;
    }

    let enhancedCount = 0;

    this.rules.rules.forEach((rule) => {
      try {
        const elements = document.querySelectorAll(rule.selector);

        elements.forEach((element) => {
          // Skip if already has ARIA attributes (non-destructive)
          if (
            element.hasAttribute('role') &&
            element.hasAttribute('aria-label')
          ) {
            return;
          }

          // Apply ARIA attributes from enhance object
          Object.entries(rule.enhance || {}).forEach(([attr, value]) => {
            if (!element.hasAttribute(attr)) {
              element.setAttribute(attr, value);
            }
          });

          // Generate and apply dynamic label if strategy exists
          if (rule.labelStrategy && !element.hasAttribute('aria-label')) {
            const label = this.generateLabel(element, rule.labelStrategy);
            if (label) {
              element.setAttribute('aria-label', label);
            }
          }

          enhancedCount++;
        });
      } catch (error) {
        logger.warn('IW_ARIA_005', `Failed to apply rule "${rule.selector}"`, {
          error: error.message,
        });
      }
    });

    if (enhancedCount > 0) {
      logger.debug('IW_ARIA_006', `Enhanced ${enhancedCount} elements`);
    }
  }

  /**
   * Generate dynamic ARIA labels based on strategy
   */
  generateLabel(element, strategy) {
    if (!strategy || !strategy.type) return null;

    try {
      switch (strategy.type) {
        case 'extractText':
          // Use element's text content
          return element.textContent?.trim() || null;

        case 'extractAttribute':
          // Extract from element attribute (e.g., placeholder, title)
          return element.getAttribute(strategy.attribute) || null;

        case 'contextual':
          // Use template with data from DOM
          if (!strategy.template) return null;

          // Find data source element
          let dataElement = element;
          if (strategy.dataSource) {
            const parts = strategy.dataSource.split(' ');
            if (parts[0].startsWith('closest(')) {
              const closestSelector = parts[0].match(
                /closest\(['"](.+)['"]\)/
              )?.[1];
              const parent = element.closest(closestSelector);
              if (parent && parts[1]) {
                dataElement = parent.querySelector(parts[1]);
              }
            }
          }

          if (!dataElement) return null;

          // Replace template placeholders
          const data = dataElement.textContent?.trim() || '';
          return strategy.template.replace(/\{(\w+)\}/g, () => data);

        case 'static':
          // Use static value from strategy
          return strategy.value || null;

        default:
          logger.warn(
            'IW_ARIA_007',
            `Unknown label strategy type: ${strategy.type}`
          );
          return null;
      }
    } catch (error) {
      logger.warn('IW_ARIA_008', 'Error generating label', {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Watch for DOM changes and re-apply enhancements (for SPAs)
   */
  watchForChanges() {
    if (this.observer) return; // Already watching

    this.observer = new MutationObserver((mutations) => {
      // Check if new nodes were added
      let hasNewNodes = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          hasNewNodes = true;
          break;
        }
      }

      if (hasNewNodes) {
        // Debounce to avoid excessive re-application
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.applyEnhancements();
        }, 300); // Wait 300ms after last DOM change
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    logger.debug(
      'IW_ARIA_009',
      'Watching for DOM changes (SPA support enabled)'
    );
  }

  /**
   * Main initialization method
   */
  async init() {
    logger.debug('IW_ARIA_010', 'Initializing enhancement engine');

    try {
      // Load rules from GCS
      await this.loadRules();

      // Apply to current DOM
      this.applyEnhancements();

      // Watch for dynamic changes
      this.watchForChanges();

      logger.debug(
        'IW_ARIA_011',
        'Enhancement engine initialized successfully'
      );
    } catch (error) {
      logger.error('IW_ARIA_012', 'Initialization failed', { error });
    }
  }

  /**
   * Cleanup and stop watching
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      logger.debug('IW_ARIA_013', 'Stopped watching DOM changes');
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}

/**
 * Extract clean domain from website URL
 */
export function extractDomain(websiteUrl) {
  if (!websiteUrl) return null;

  try {
    const url = new URL(websiteUrl);
    return url.hostname.replace(/^www\./, ''); // Remove www prefix
  } catch {
    logger.warn('IW_ARIA_014', 'Failed to extract domain from URL', {
      websiteUrl,
    });
    // Fallback: try to clean the URL string
    return websiteUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }
}

export default ARIAEnhancementEngine;
