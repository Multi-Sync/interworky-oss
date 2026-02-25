/**
 * Early Init Script for Personalization
 *
 * This module is imported first in index.js to apply cached personalization
 * before the main bundle renders, ensuring a seamless experience for returning visitors.
 *
 * Supports two personalization modes:
 * 1. UTM-based (instant): Uses pre-generated variations matched by UTM parameters
 * 2. Cache-based (returning visitors): Uses previously cached variations
 */

import { getVariations } from '../../utils/api/personalizationApi';
import logger from '../../utils/logger';

// Constants
const CACHE_KEY_PREFIX = 'iw_personalization_';
const VISITOR_ID_KEY = 'iw_visitor_id';

/**
 * Wait for DOM to be ready (interactive or complete)
 * @returns {Promise<void>}
 */
function waitForDOMReady() {
  return new Promise((resolve) => {
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    }
  });
}

/**
 * Wait for an element to appear in the DOM using polling
 * @param {string} selector - CSS selector
 * @param {number} timeout - Max wait time in ms
 * @returns {Promise<Element|null>}
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    // Check if element already exists
    const existing = document.querySelector(selector);
    if (existing) {
      logger.debug('IW_EARLY_INIT_050', 'Element found immediately', { selector });
      resolve(existing);
      return;
    }

    // Use polling to check for element (more reliable with React hydration)
    const startTime = Date.now();
    const pollInterval = 100; // Check every 100ms

    const poll = () => {
      const element = document.querySelector(selector);
      if (element) {
        logger.debug('IW_EARLY_INIT_051', 'Element found via polling', {
          selector,
          waitTime: Date.now() - startTime,
        });
        resolve(element);
        return;
      }

      if (Date.now() - startTime >= timeout) {
        logger.debug('IW_EARLY_INIT_052', 'Element poll timeout', { selector, timeout });
        resolve(null);
        return;
      }

      setTimeout(poll, pollInterval);
    };

    // Start polling after a brief delay to allow initial render
    setTimeout(poll, 50);
  });
}

/**
 * Get organization ID from config or script tags
 * This runs before the main assistant initializes, so we can't use getOrgId() from state
 * @returns {string|null}
 */
function getOrganizationId() {
  try {
    // 1. Try window config first (set by host page)
    if (window.InterworkyConfig && window.InterworkyConfig.organizationId) {
      return window.InterworkyConfig.organizationId;
    }

    // 2. Try localStorage (may be set from previous session)
    const storedOrgId = localStorage.getItem('orgId');
    if (storedOrgId) {
      return storedOrgId;
    }

    // 3. Try script tag data attribute
    const scripts = document.querySelectorAll('script[data-organization-id]');
    if (scripts.length > 0) {
      return scripts[0].getAttribute('data-organization-id');
    }

    // 4. Try script src query parameter
    const iwScripts = document.querySelectorAll('script[src*="interworky"]');
    for (let i = 0; i < iwScripts.length; i++) {
      const src = iwScripts[i].src;
      const match = src.match(/[?&]org(?:anization)?[_-]?id=([^&]+)/i);
      if (match) return match[1];
    }

    // 5. Try data-api-key attribute and decode it
    // API key format: base64(orgId$$assistantId) or base64(orgId:assistantId)
    const apiKeyScripts = document.querySelectorAll('script[data-api-key]');
    if (apiKeyScripts.length > 0) {
      const apiKey = apiKeyScripts[0].getAttribute('data-api-key');
      if (apiKey) {
        try {
          const decoded = atob(apiKey);
          // Split by $$ first, then by : if that fails
          let parts = decoded.split('$$');
          if (!parts || parts.length < 2) {
            parts = decoded.split(':');
          }
          // First part is always orgId
          if (parts.length >= 2 && parts[0]) {
            return parts[0];
          }
        } catch (e) {
          // Invalid base64 or format, skip
        }
      }
    }

    return null;
  } catch (e) {
    logger.warn('IW_EARLY_INIT_000', 'Failed to get organization ID', { error: e.message });
    return null;
  }
}

/**
 * Get visitor ID from localStorage
 * @returns {string}
 */
function getVisitorId() {
  try {
    return localStorage.getItem(VISITOR_ID_KEY) || '';
  } catch (e) {
    return '';
  }
}

/**
 * Simple hash function
 * @param {string} str - String to hash
 * @returns {string}
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get cache key for current page
 * @returns {string|null}
 */
function getCacheKey() {
  const visitorId = getVisitorId();
  if (!visitorId) return null;

  const urlHash = simpleHash(window.location.href);
  return `${CACHE_KEY_PREFIX}${visitorId}_${urlHash}`;
}

/**
 * Parse UTM parameters from URL
 * @returns {Object} UTM parameters
 */
function parseUTMParameters() {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source') || '',
      medium: params.get('utm_medium') || '',
      campaign: params.get('utm_campaign') || '',
      content: params.get('utm_content') || '',
      term: params.get('utm_term') || '',
    };
  } catch (e) {
    return { source: '', medium: '', campaign: '', content: '', term: '' };
  }
}

/**
 * Check if UTM parameters are present
 * @param {Object} utm - UTM parameters
 * @returns {boolean}
 */
function hasUTMParameters(utm) {
  return !!(utm.campaign || utm.content || utm.source || utm.term);
}

/**
 * Match UTM parameters to a pre-generated variation
 * Uses whole-word keyword matching - no AI call needed
 * @param {Object} utm - UTM parameters
 * @param {Object} variations - Pre-generated variations from backend
 * @returns {string} Matched variation key or 'default'
 */
function matchUTMToVariation(utm, variations) {
  if (!variations || typeof variations !== 'object') {
    return 'default';
  }

  // Get individual UTM values as an array of words
  const utmValues = [
    utm.campaign || '',
    utm.content || '',
    utm.source || '',
    utm.term || '',
  ];

  // Split into individual words for whole-word matching
  const utmWords = utmValues
    .join(' ')
    .toLowerCase()
    .split(/[\s,_-]+/)
    .filter(w => w.length > 0);

  if (utmWords.length === 0) {
    return 'default';
  }

  // First, check for exact variation key match (highest priority)
  const keys = Object.keys(variations);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key === 'default') continue;

    // Check if any UTM word exactly matches the variation key
    if (utmWords.includes(key.toLowerCase())) {
      logger.info('IW_EARLY_INIT_001', 'UTM keyword matched', {
        keyword: key,
        variation_key: key,
        utm_text: utmWords.join(' ').substring(0, 50),
        match_type: 'exact_key',
      });
      return key;
    }
  }

  // Then search through variations for keyword matches (whole-word only)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key === 'default') continue;

    const config = variations[key];
    const keywords = config.keywords || [];

    for (let j = 0; j < keywords.length; j++) {
      const keyword = keywords[j].toLowerCase();
      // Check if keyword matches any whole word in UTM values
      if (utmWords.includes(keyword)) {
        logger.info('IW_EARLY_INIT_001', 'UTM keyword matched', {
          keyword: keywords[j],
          variation_key: key,
          utm_text: utmWords.join(' ').substring(0, 50),
          match_type: 'keyword',
        });
        return key;
      }
    }
  }

  return 'default';
}

/**
 * Inject personalization styles (CSS-based, non-breaking)
 */
function injectPersonalizationStyles() {
  if (document.getElementById('iw-personalization-styles')) return;

  const style = document.createElement('style');
  style.id = 'iw-personalization-styles';
  style.textContent = `
    /* Interworky Personalization Styles - minimal, no visual changes */
    .iw-reordered { order: var(--iw-order, 0) !important; }
    .iw-section-container { display: flex; flex-direction: column; }
    /* Highlight/fade classes are intentionally empty - no visual styling */
    .iw-highlight { }
    .iw-fade { }
    .iw-hidden { display: none !important; }
  `;
  document.head.appendChild(style);
}

/**
 * Apply content variations (text changes)
 * @param {Array} variations - Content variations
 */
function applyContentVariations(variations) {
  if (!variations || !Array.isArray(variations)) return;

  logger.info('IW_EARLY_INIT_030', 'Applying content variations', { count: variations.length });

  variations.forEach((v) => {
    try {
      const selector = v.selector;
      const newText = v.new_text || v.newText;
      const originalText = v.original_text || v.originalText;

      logger.debug('IW_EARLY_INIT_031', 'Content variation attempt', { selector, newText: newText?.substring(0, 30) });

      if (!selector || !newText) {
        logger.warn('IW_EARLY_INIT_032', 'Missing selector or newText', { selector, hasNewText: !!newText });
        return;
      }

      const element = document.querySelector(selector);
      if (!element) {
        logger.warn('IW_EARLY_INIT_033', 'Element not found for selector', { selector });
        return;
      }

      logger.info('IW_EARLY_INIT_034', 'Element found, applying text change', { selector });

      // Verify it's the right element by checking original text
      const currentText = element.textContent.trim();
      if (originalText) {
        const matches = currentText === originalText ||
          currentText.indexOf(originalText.substring(0, 20)) !== -1;
        if (!matches) return;
      }

      // Preserve child elements if any (like icons)
      if (element.children.length > 0) {
        // Find text nodes and update only those
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        let textNode;
        while ((textNode = walker.nextNode())) {
          if (textNode.textContent.trim() === originalText ||
            (originalText && textNode.textContent.trim().indexOf(originalText.substring(0, 10)) !== -1)) {
            textNode.textContent = newText;
            break;
          }
        }
      } else {
        element.textContent = newText;
      }

      element.setAttribute('data-iw-personalized', 'true');
      logger.debug('IW_EARLY_INIT_002', 'Content variation applied', { selector });
    } catch (e) {
      // Silently fail
    }
  });
}

/**
 * Apply content variations with element waiting (async version)
 * @param {Array} variations - Content variations
 */
async function applyContentVariationsAsync(variations) {
  if (!variations || !Array.isArray(variations)) return;

  logger.info('IW_EARLY_INIT_030', 'Applying content variations (async)', { count: variations.length });

  for (const v of variations) {
    try {
      const selector = v.selector;
      const newText = v.new_text || v.newText;
      const originalText = v.original_text || v.originalText;

      if (!selector || !newText) {
        logger.warn('IW_EARLY_INIT_032', 'Missing selector or newText', { selector, hasNewText: !!newText });
        continue;
      }

      // Wait for element to appear in DOM
      const element = await waitForElement(selector, 5000);
      if (!element) {
        logger.warn('IW_EARLY_INIT_033', 'Element not found after waiting', { selector });
        continue;
      }

      logger.info('IW_EARLY_INIT_034', 'Element found, applying text change', { selector });

      // Verify it's the right element by checking original text
      const currentText = element.textContent.trim();
      if (originalText) {
        const matches = currentText === originalText ||
          currentText.indexOf(originalText.substring(0, 20)) !== -1;
        if (!matches) {
          logger.debug('IW_EARLY_INIT_035', 'Text mismatch, skipping', {
            selector,
            expected: originalText.substring(0, 30),
            actual: currentText.substring(0, 30),
          });
          continue;
        }
      }

      // For headlines (h1-h6), replace entire content (they may have styled spans)
      const tagName = element.tagName.toLowerCase();
      const isHeadline = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName);

      if (isHeadline) {
        // Headlines may have nested spans for colored text - replace everything
        element.textContent = newText;
      } else if (element.children.length > 0) {
        // For other elements with children (like buttons with icons), preserve structure
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        let textNode;
        let replaced = false;
        while ((textNode = walker.nextNode())) {
          if (!replaced && textNode.textContent.trim().length > 0) {
            textNode.textContent = newText;
            replaced = true;
            // Don't break - clear other text nodes
          } else if (replaced && textNode.textContent.trim().length > 0) {
            textNode.textContent = '';
          }
        }
      } else {
        element.textContent = newText;
      }

      element.setAttribute('data-iw-personalized', 'true');
      logger.info('IW_EARLY_INIT_036', 'Content variation applied successfully', { selector });
    } catch (e) {
      logger.warn('IW_EARLY_INIT_037', 'Error applying content variation', { error: e.message });
    }
  }
}

/**
 * Apply CTA variations with element waiting (async version)
 * @param {Array} variations - CTA variations
 */
async function applyCTAVariationsAsync(variations) {
  if (!variations || !Array.isArray(variations)) return;

  for (const v of variations) {
    try {
      const selector = v.selector;
      const newText = v.new_text || v.newText;
      const newHref = v.new_href || v.newHref;
      const originalText = v.original_text || v.originalText;

      if (!selector) continue;

      // Wait for element to appear in DOM
      const element = await waitForElement(selector, 5000);
      if (!element) continue;

      // Update text if provided (preserve icons)
      if (newText) {
        const currentText = element.textContent.trim();
        const matches = !originalText ||
          currentText === originalText ||
          currentText.indexOf(originalText.substring(0, 10)) !== -1;

        if (matches) {
          if (element.children.length > 0) {
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
            let textNode;
            while ((textNode = walker.nextNode())) {
              if (textNode.textContent.trim().length > 0) {
                textNode.textContent = newText;
                break;
              }
            }
          } else {
            element.textContent = newText;
          }
        }
      }

      // Update href if provided
      if (newHref && element.href !== undefined) {
        element.href = newHref;
      }

      element.setAttribute('data-iw-personalized', 'true');
      logger.debug('IW_EARLY_INIT_038', 'CTA variation applied', { selector });
    } catch (e) {
      // Silently fail
    }
  }
}

/**
 * Apply CTA variations (button/link changes)
 * @param {Array} variations - CTA variations
 */
function applyCTAVariations(variations) {
  if (!variations || !Array.isArray(variations)) return;

  variations.forEach((v) => {
    try {
      const selector = v.selector;
      const newText = v.new_text || v.newText;
      const newHref = v.new_href || v.newHref;
      const originalText = v.original_text || v.originalText;

      if (!selector) return;

      const element = document.querySelector(selector);
      if (!element) return;

      // Update text if provided (preserve icons)
      if (newText) {
        const currentText = element.textContent.trim();
        const matches = !originalText ||
          currentText === originalText ||
          currentText.indexOf(originalText.substring(0, 10)) !== -1;

        if (matches) {
          // Check for child elements (icons, etc.)
          if (element.children.length > 0) {
            // Find and update only text nodes
            const textNodes = [];
            const walker = document.createTreeWalker(
              element,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            let node;
            while ((node = walker.nextNode())) {
              if (node.textContent.trim()) {
                textNodes.push(node);
              }
            }
            // Update the first significant text node
            if (textNodes.length > 0) {
              textNodes[0].textContent = newText;
            }
          } else {
            element.textContent = newText;
          }
        }
      }

      // Update href if provided
      if (newHref && element.href !== undefined) {
        element.href = newHref;
      }

      element.setAttribute('data-iw-personalized', 'true');
      logger.debug('IW_EARLY_INIT_003', 'CTA variation applied', { selector });
    } catch (e) {
      // Silently fail
    }
  });
}

/**
 * Apply layout changes using CSS order (non-breaking)
 * Uses flexbox order property instead of DOM manipulation
 * @param {Array} changes - Layout changes
 */
function applyLayoutChanges(changes) {
  if (!changes || !Array.isArray(changes) || changes.length === 0) return;

  logger.info('IW_EARLY_INIT_040', 'Applying layout changes', { count: changes.length, changes: JSON.stringify(changes) });

  injectPersonalizationStyles();

  const container = document.querySelector('main') ||
    document.querySelector('[role="main"]') ||
    document.body;

  logger.debug('IW_EARLY_INIT_041', 'Container found', { tag: container.tagName, id: container.id });

  // Find sections
  let sections = container.querySelectorAll(
    'section[id], [id*="section"], [class*="section"]'
  );

  logger.debug('IW_EARLY_INIT_042', 'Sections found (first query)', { count: sections.length });

  if (sections.length === 0) {
    // Fallback to direct children with section-like attributes
    sections = container.querySelectorAll(
      'section, article, [class*="feature"], [class*="hero"], [class*="module"]'
    );
    logger.debug('IW_EARLY_INIT_043', 'Sections found (fallback query)', { count: sections.length });
  }

  if (sections.length === 0) {
    logger.warn('IW_EARLY_INIT_044', 'No sections found on page');
    return;
  }

  // Check if container can use flexbox ordering
  const containerStyle = window.getComputedStyle(container);
  const isFlexOrGrid = containerStyle.display === 'flex' || containerStyle.display === 'grid';

  if (!isFlexOrGrid) {
    // Add flex container class
    container.classList.add('iw-section-container');
  }

  // Sort changes by new priority
  const sorted = [...changes].sort((a, b) =>
    (a.new_priority || a.newPriority || 0) - (b.new_priority || b.newPriority || 0)
  );

  // Build section map
  const sectionMap = {};
  sections.forEach((section, i) => {
    const sectionId = section.id || extractSectionId(section) || `section-${i}`;
    sectionMap[sectionId.toLowerCase()] = section;
  });

  logger.info('IW_EARLY_INIT_045', 'Section map built', { sectionIds: Object.keys(sectionMap) });

  // Apply order to sections based on changes
  sorted.forEach((change, index) => {
    const sectionId = (change.section_id || change.sectionId || '').toLowerCase();
    let section = sectionMap[sectionId];

    logger.debug('IW_EARLY_INIT_046', 'Looking for section', { sectionId, found: !!section });

    // Try partial match if exact match fails
    if (!section) {
      const keys = Object.keys(sectionMap);
      for (let k = 0; k < keys.length; k++) {
        if (keys[k].indexOf(sectionId) !== -1 || sectionId.indexOf(keys[k]) !== -1) {
          section = sectionMap[keys[k]];
          logger.debug('IW_EARLY_INIT_047', 'Partial match found', { requested: sectionId, matched: keys[k] });
          break;
        }
      }
    }

    if (section) {
      section.style.setProperty('--iw-order', index);
      section.classList.add('iw-reordered');
      section.setAttribute('data-iw-personalized', 'true');
      logger.info('IW_EARLY_INIT_048', 'Section reordered', { sectionId, newOrder: index });
    } else {
      logger.warn('IW_EARLY_INIT_049', 'Section not found for reordering', { sectionId });
    }
  });

  logger.debug('IW_EARLY_INIT_004', 'Layout changes applied', { count: changes.length });
}

/**
 * Extract section ID from element
 * @param {Element} el - DOM element
 * @returns {string|null}
 */
function extractSectionId(el) {
  const text = (el.textContent || '').toLowerCase().substring(0, 500);
  const patterns = [
    { pattern: /ai bug hunter/i, id: 'ai-bug-hunter-section' },
    { pattern: /customer support|voice ai/i, id: 'ai-customer-support-section' },
    { pattern: /smart analytics|analytics/i, id: 'smart-analytics-section' },
    { pattern: /hero|welcome|get started/i, id: 'hero-section' },
    { pattern: /pricing|plans/i, id: 'pricing-section' },
    { pattern: /faq|frequently asked/i, id: 'faq-section' },
    { pattern: /integrat/i, id: 'integrations-section' },
  ];

  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i].pattern.test(text)) {
      return patterns[i].id;
    }
  }
  return null;
}

/**
 * Apply style emphasis (highlight/fade)
 * Uses CSS classes instead of inline styles
 * @param {Array} emphasis - Style emphasis array
 */
function applyStyleEmphasis(emphasis) {
  if (!emphasis || !Array.isArray(emphasis)) return;

  injectPersonalizationStyles();

  emphasis.forEach((item) => {
    try {
      const selector = item.selector;
      const action = item.action;

      if (!selector || !action) return;

      const element = document.querySelector(selector);
      if (!element) return;

      switch (action) {
        case 'highlight':
          element.classList.add('iw-highlight');
          break;
        case 'fade':
          element.classList.add('iw-fade');
          break;
        case 'hide':
          element.classList.add('iw-hidden');
          break;
      }

      element.setAttribute('data-iw-personalized', 'true');
    } catch (e) {
      // Silently fail
    }
  });

  logger.debug('IW_EARLY_INIT_005', 'Style emphasis applied', { count: emphasis.length });
}

/**
 * Apply all variations from a variation object
 * @param {Object} variation - Variation object with layout_changes, content_variations, etc.
 */
async function applyVariation(variation) {
  if (!variation) return;

  // Wait for DOM to be ready before applying any changes
  await waitForDOMReady();

  // Log full variation object for debugging
  logger.info('IW_EARLY_INIT_006', 'Applying variation', {
    layout_changes: variation.layout_changes?.length || 0,
    content_variations: variation.content_variations?.length || 0,
    cta_variations: variation.cta_variations?.length || 0,
    style_emphasis: variation.style_emphasis?.length || 0,
  });

  // Log the actual variation data
  console.log('[EarlyInit] Full variation object:', JSON.stringify(variation, null, 2));

  // Apply in order: layout first, then content, then CTAs, then emphasis
  applyLayoutChanges(variation.layout_changes || variation.layoutChanges || []);

  // Apply content and CTA variations with element waiting
  await applyContentVariationsAsync(variation.content_variations || variation.contentVariations || []);
  await applyCTAVariationsAsync(variation.cta_variations || variation.ctaVariations || []);

  applyStyleEmphasis(variation.style_emphasis || variation.styleEmphasis || []);
}

/**
 * Apply UTM-based personalization (fast, no AI call)
 * @returns {Promise<boolean>}
 */
async function applyUTMPersonalization() {
  const utm = parseUTMParameters();

  if (!hasUTMParameters(utm)) {
    logger.debug('IW_EARLY_INIT_007', 'No UTM parameters found');
    return false;
  }

  const organizationId = getOrganizationId();
  logger.info('IW_EARLY_INIT_008', 'UTM personalization starting', {
    org_id: organizationId,
    utm_campaign: utm.campaign,
    utm_content: utm.content?.substring(0, 30),
  });

  if (!organizationId) {
    logger.warn('IW_EARLY_INIT_009', 'No organization ID found');
    return false;
  }

  try {
    // Use the personalization API client
    const variations = await getVariations(organizationId);

    if (!variations) {
      logger.warn('IW_EARLY_INIT_010', 'No variations returned from API');
      return false;
    }

    const matchedKey = matchUTMToVariation(utm, variations);
    logger.info('IW_EARLY_INIT_011', 'Variation matching result', {
      matched_key: matchedKey,
      available_keys: Object.keys(variations),
    });

    if (matchedKey === 'default' || !variations[matchedKey]) {
      logger.info('IW_EARLY_INIT_012', 'No matching variation found (using default)');
      return false;
    }

    const variationConfig = variations[matchedKey];
    const variation = variationConfig.variation;

    if (!variation) {
      logger.warn('IW_EARLY_INIT_013', 'Variation config has no variation object');
      return false;
    }

    // Mark as applied
    window.__IW_UTM_PERSONALIZATION_APPLIED__ = true;
    window.__IW_UTM_MATCHED_KEY__ = matchedKey;
    window.__IW_UTM_VARIATION__ = variation;

    // Apply the variation (await since it's now async)
    await applyVariation(variation);

    logger.info('IW_EARLY_INIT_014', 'UTM personalization applied successfully', {
      matched_key: matchedKey,
    });

    return true;
  } catch (error) {
    logger.error('IW_EARLY_INIT_015', 'UTM personalization failed', {
      error: error.message,
    });
    return false;
  }
}

/**
 * Apply cache-based personalization (returning visitors)
 * @returns {boolean}
 */
function applyCachedPersonalization() {
  try {
    const cacheKey = getCacheKey();
    if (!cacheKey) return false;

    const cached = localStorage.getItem(cacheKey);
    if (!cached) return false;

    const data = JSON.parse(cached);

    // Check expiry
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      localStorage.removeItem(cacheKey);
      return false;
    }

    if (!data.variation) return false;

    // Mark as applied
    window.__IW_EARLY_PERSONALIZATION_APPLIED__ = true;
    window.__IW_CACHED_VARIATION__ = data.variation;

    // Apply when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        applyVariation(data.variation);
      });
    } else {
      applyVariation(data.variation);
    }

    logger.info('IW_EARLY_INIT_016', 'Cache-based personalization applied');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Initialize early personalization
 * Tries UTM-based first, then falls back to cache-based
 */
export function initEarlyPersonalization() {
  // Guard: only run in browser
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  logger.info('IW_EARLY_INIT_017', 'Starting early personalization');

  // Check if already applied
  if (window.__IW_EARLY_PERSONALIZATION_APPLIED__ || window.__IW_UTM_PERSONALIZATION_APPLIED__) {
    logger.debug('IW_EARLY_INIT_018', 'Already applied, skipping');
    return;
  }

  // Try UTM-based personalization first (for first-time visitors with UTM)
  const utm = parseUTMParameters();

  if (hasUTMParameters(utm)) {
    logger.info('IW_EARLY_INIT_019', 'UTM parameters detected', {
      campaign: utm.campaign,
      content: utm.content?.substring(0, 30),
      source: utm.source,
    });

    // UTM present - try async fetch but don't block
    applyUTMPersonalization()
      .then((applied) => {
        logger.info('IW_EARLY_INIT_020', 'UTM personalization result', { applied });
      })
      .catch((err) => {
        logger.error('IW_EARLY_INIT_021', 'UTM personalization error', { error: err.message });
        // Fallback to cache if UTM fails
        applyCachedPersonalization();
      });
  } else {
    logger.debug('IW_EARLY_INIT_022', 'No UTM parameters, trying cached personalization');
    // No UTM - use cached personalization
    applyCachedPersonalization();
  }
}

// Auto-initialize when imported
initEarlyPersonalization();
