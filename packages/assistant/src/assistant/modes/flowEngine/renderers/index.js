// src/assistant/modes/flowEngine/renderers/index.js
/**
 * Modular Output Renderer System
 * Allows flows to define custom output rendering and download actions
 *
 * COMPONENT CONTRACTS:
 * - Renderers: { render(data, config), toPlainText(data), toHTML(data) }
 * - Themes: See themes.js for Theme Contract
 * - Layouts: See layouts.js for Layout Contract
 * - Actions: { execute(data, config), label, icon }
 */

import { createElement } from '../../../ui/baseMethods';
import { getTheme, getAvailableThemes, themes } from './themes';
import { getLayout, getAvailableLayouts, layouts } from './layouts';

// Registry of available renderers
const renderers = {};

// Registry of available actions (download handlers)
const actions = {};

/**
 * Register a renderer
 */
export function registerRenderer(type, renderer) {
  renderers[type] = renderer;
}

/**
 * Register an action (download handler, etc.)
 */
export function registerAction(type, action) {
  actions[type] = action;
}

/**
 * Get a renderer by type
 */
export function getRenderer(type) {
  return renderers[type] || renderers.default;
}

/**
 * Get an action by type
 */
export function getAction(type) {
  return actions[type];
}

/**
 * Get all registered action types
 */
export function getAvailableActions() {
  return Object.keys(actions);
}

/**
 * Helper: Extract value from flow data (handles arrays and nested objects)
 */
export function extractValue(data, key, field = null) {
  const blockData = data[key];
  if (!blockData) return null;

  if (Array.isArray(blockData)) {
    if (field) {
      return blockData[0]?.[field];
    }
    return blockData[0];
  }

  if (field && typeof blockData === 'object') {
    return blockData[field];
  }

  return blockData;
}

/**
 * Helper: Extract all values from an array in flow data
 */
export function extractAllValues(data, key) {
  const blockData = data[key];
  if (!blockData) return [];
  return Array.isArray(blockData) ? blockData : [blockData];
}

/**
 * Helper: Parse summary from generate_resume tool (handles JSON string)
 */
export function parseSummary(data) {
  const resumeData = data.generate_resume;
  if (!resumeData) return '';

  const item = Array.isArray(resumeData) ? resumeData[0] : resumeData;
  if (!item) return '';

  // Handle case where summary is the item itself
  if (typeof item === 'string') {
    try {
      const parsed = JSON.parse(item);
      return parsed.summary || item;
    } catch {
      return item;
    }
  }

  return item.summary || '';
}

/**
 * Helper: Apply theme colors to an element
 * @param {HTMLElement} element - Element to style
 * @param {object} theme - Theme object
 * @param {object} styleMap - Map of theme keys to CSS properties
 */
export function applyTheme(element, theme, styleMap) {
  if (!theme || !styleMap) return;
  Object.entries(styleMap).forEach(([themeKey, cssProperty]) => {
    const value = themeKey.split('.').reduce((obj, key) => obj?.[key], theme);
    if (value !== undefined) {
      element.style[cssProperty] = value;
    }
  });
}

/**
 * Helper: Create a themed container
 * @param {object} config - Output schema config
 * @returns {object} { container, theme, layout }
 */
export function createThemedContainer(config = {}) {
  const theme = getTheme(config.theme);
  const layout = getLayout(config.layout);

  const container = createElement(
    'div',
    {
      fontFamily: theme.fonts.body,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      lineHeight: '1.6',
    },
    {}
  );

  return { container, theme, layout };
}

/**
 * Helper: Create a themed section with title
 * @param {string} title - Section title
 * @param {object} theme - Theme object
 * @returns {HTMLElement}
 */
export function createThemedSection(title, theme) {
  const section = createElement('div', { marginBottom: theme.spacing.lg }, {});

  const titleEl = createElement(
    'h2',
    {
      fontSize: '18px',
      fontWeight: 'bold',
      fontFamily: theme.fonts.heading,
      color: theme.colors.text,
      borderBottom: `1px solid ${theme.colors.border}`,
      paddingBottom: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    { textContent: title }
  );

  section.appendChild(titleEl);
  return section;
}

/**
 * Helper: Create a themed card
 * @param {string} title - Card title
 * @param {object} theme - Theme object
 * @param {string} accentColor - Optional accent color override
 * @returns {HTMLElement}
 */
export function createThemedCard(title, theme, accentColor = null) {
  const card = createElement(
    'div',
    {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      boxShadow: theme.shadows.md,
      borderTop: `4px solid ${accentColor || theme.colors.primary}`,
    },
    {}
  );

  if (title) {
    const cardTitle = createElement(
      'h3',
      {
        fontSize: '16px',
        fontWeight: '600',
        fontFamily: theme.fonts.heading,
        color: theme.colors.text,
        margin: `0 0 ${theme.spacing.md} 0`,
      },
      { textContent: title }
    );
    card.appendChild(cardTitle);
  }

  return card;
}

/**
 * Default renderer - just shows JSON
 */
registerRenderer('default', {
  render: (data, config) => {
    const container = createElement('div', { padding: '32px' }, {});
    const pre = createElement(
      'pre',
      {
        backgroundColor: '#f5f5f5',
        padding: '16px',
        borderRadius: '8px',
        overflow: 'auto',
        fontSize: '12px',
        whiteSpace: 'pre-wrap',
      },
      { textContent: JSON.stringify(data, null, 2) }
    );
    container.appendChild(pre);
    return container;
  },

  toPlainText: (data) => JSON.stringify(data, null, 2),

  toHTML: (data) => `<pre>${JSON.stringify(data, null, 2)}</pre>`,
});

// Re-export theme and layout utilities
export { getTheme, getAvailableThemes, themes };
export { getLayout, getAvailableLayouts, layouts };

export { renderers, actions };
