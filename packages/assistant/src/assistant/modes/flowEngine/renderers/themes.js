// src/assistant/modes/flowEngine/renderers/themes.js
/**
 * Theme Registry
 *
 * Themes define the visual styling for flow outputs.
 * Each theme must follow the Theme Contract.
 *
 * THEME CONTRACT:
 * {
 *   colors: {
 *     primary: string,      // Main brand color
 *     secondary: string,    // Secondary accent
 *     background: string,   // Content background
 *     surface: string,      // Card/container background
 *     text: string,         // Primary text color
 *     textMuted: string,    // Secondary text color
 *     border: string,       // Border color
 *     success: string,      // Success state color
 *     error: string,        // Error state color
 *   },
 *   fonts: {
 *     heading: string,      // Font family for headings
 *     body: string,         // Font family for body text
 *     mono: string,         // Font family for code/data
 *   },
 *   spacing: {
 *     xs: string,           // Extra small (4px)
 *     sm: string,           // Small (8px)
 *     md: string,           // Medium (16px)
 *     lg: string,           // Large (24px)
 *     xl: string,           // Extra large (32px)
 *   },
 *   borderRadius: {
 *     sm: string,           // Small radius
 *     md: string,           // Medium radius
 *     lg: string,           // Large radius
 *     full: string,         // Full/pill radius
 *   },
 *   shadows: {
 *     sm: string,           // Subtle shadow
 *     md: string,           // Medium shadow
 *     lg: string,           // Large shadow
 *   }
 * }
 */

// Theme registry
const themes = {};

/**
 * Register a theme
 * @param {string} id - Unique theme identifier
 * @param {object} theme - Theme object following the contract
 */
export function registerTheme(id, theme) {
  themes[id] = theme;
}

/**
 * Get a theme by ID
 * @param {string} id - Theme identifier
 * @returns {object} Theme object or default theme
 */
export function getTheme(id) {
  return themes[id] || themes.professional;
}

/**
 * Get all registered theme IDs
 * @returns {string[]} Array of theme IDs
 */
export function getAvailableThemes() {
  return Object.keys(themes);
}

// ============================================
// PROFESSIONAL THEME - Clean, corporate look
// ============================================
registerTheme('professional', {
  id: 'professional',
  name: 'Professional',
  description: 'Clean, corporate styling suitable for resumes and reports',
  colors: {
    primary: '#1f2937',
    secondary: '#4b5563',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    success: '#059669',
    error: '#dc2626',
  },
  fonts: {
    heading: "'Georgia', 'Times New Roman', serif",
    body: "'Georgia', 'Times New Roman', serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
});

// ============================================
// MINIMAL THEME - Ultra clean, lots of whitespace
// ============================================
registerTheme('minimal', {
  id: 'minimal',
  name: 'Minimal',
  description: 'Ultra clean design with lots of whitespace',
  colors: {
    primary: '#000000',
    secondary: '#525252',
    background: '#ffffff',
    surface: '#fafafa',
    text: '#171717',
    textMuted: '#737373',
    border: '#e5e5e5',
    success: '#22c55e',
    error: '#ef4444',
  },
  fonts: {
    heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, SFMono-Regular, monospace",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '32px',
    xl: '48px',
  },
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
    full: '9999px',
  },
  shadows: {
    sm: 'none',
    md: '0 1px 3px rgba(0, 0, 0, 0.08)',
    lg: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
});

// ============================================
// MODERN THEME - Contemporary with subtle gradients
// ============================================
registerTheme('modern', {
  id: 'modern',
  name: 'Modern',
  description: 'Contemporary design with subtle accents',
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    error: '#f43f5e',
  },
  fonts: {
    heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 8px rgba(0, 0, 0, 0.06)',
    lg: '0 12px 24px rgba(0, 0, 0, 0.08)',
  },
});

// ============================================
// PLAYFUL THEME - Fun, colorful, energetic
// ============================================
registerTheme('playful', {
  id: 'playful',
  name: 'Playful',
  description: 'Fun and energetic styling for casual content',
  colors: {
    primary: '#ec4899',
    secondary: '#f97316',
    background: '#fffbeb',
    surface: '#ffffff',
    text: '#1c1917',
    textMuted: '#78716c',
    border: '#fde68a',
    success: '#84cc16',
    error: '#ef4444',
  },
  fonts: {
    heading: "'Poppins', 'Comic Sans MS', cursive, sans-serif",
    body: "'Nunito', 'Trebuchet MS', sans-serif",
    mono: "'Fira Code', ui-monospace, monospace",
  },
  spacing: {
    xs: '6px',
    sm: '12px',
    md: '20px',
    lg: '28px',
    xl: '40px',
  },
  borderRadius: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    full: '9999px',
  },
  shadows: {
    sm: '0 2px 4px rgba(236, 72, 153, 0.1)',
    md: '0 6px 12px rgba(236, 72, 153, 0.15)',
    lg: '0 12px 24px rgba(236, 72, 153, 0.2)',
  },
});

// ============================================
// DARK THEME - Dark mode styling
// ============================================
registerTheme('dark', {
  id: 'dark',
  name: 'Dark',
  description: 'Dark mode styling for low-light environments',
  colors: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#334155',
    success: '#34d399',
    error: '#f87171',
  },
  fonts: {
    heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, SFMono-Regular, monospace",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 8px rgba(0, 0, 0, 0.4)',
    lg: '0 12px 24px rgba(0, 0, 0, 0.5)',
  },
});

// ============================================
// CORPORATE THEME - Enterprise/business styling
// ============================================
registerTheme('corporate', {
  id: 'corporate',
  name: 'Corporate',
  description: 'Enterprise-ready professional styling',
  colors: {
    primary: '#0369a1',
    secondary: '#0284c7',
    background: '#ffffff',
    surface: '#f0f9ff',
    text: '#0c4a6e',
    textMuted: '#64748b',
    border: '#bae6fd',
    success: '#059669',
    error: '#dc2626',
  },
  fonts: {
    heading: "'Arial', 'Helvetica Neue', sans-serif",
    body: "'Arial', 'Helvetica Neue', sans-serif",
    mono: "'Courier New', monospace",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '6px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
});

export { themes };
