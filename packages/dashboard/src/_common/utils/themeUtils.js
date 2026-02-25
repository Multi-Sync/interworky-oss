/**
 * Theme Utilities
 * Modular utilities for theme-aware components
 * Usage: Import and use these utilities in any component that needs theme-specific values
 */

import { useTheme } from '@/context/ThemeContext';

/**
 * Custom hook to get theme-aware values
 * @param {Object} values - Object with light and dark values
 * @param {*} values.light - Value for light mode
 * @param {*} values.dark - Value for dark mode
 * @returns {*} The appropriate value based on current theme
 *
 * @example
 * const bgColor = useThemeValue({ light: '#ffffff', dark: '#171717' });
 * const logo = useThemeValue({ light: '/finallogo.png', dark: '/dark-logo.png' });
 */
export function useThemeValue(values) {
  const { isDark } = useTheme();
  return isDark ? values.dark : values.light;
}

/**
 * Theme-aware class names
 * Returns appropriate Tailwind classes based on theme
 */
export const themeClasses = {
  // Backgrounds
  bg: {
    app: 'bg-app-bg-light dark:bg-app-bg',
    surface: 'bg-surface-light dark:bg-surface',
    surfaceElevated: 'bg-surface-elevated-light dark:bg-surface-elevated',
  },

  // Borders
  border: {
    default: 'border-border-default-light dark:border-border-default',
    subtle: 'border-gray-300 dark:border-border-subtle',
  },

  // Text colors
  text: {
    primary: 'text-gray-900 dark:text-gray-50',
    secondary: 'text-gray-700 dark:text-gray-300',
    tertiary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500',
  },

  // Hover states
  hover: {
    bg: 'hover:bg-gray-100 dark:hover:bg-surface-elevated/50',
    bgElevated: 'hover:bg-gray-200 dark:hover:bg-neutral-700',
    text: 'hover:text-gray-900 dark:hover:text-gray-100',
  },

  // Active/highlighted states
  active: {
    bg: 'bg-surface-elevated-light dark:bg-surface-elevated',
    text: 'text-gray-900 dark:text-gray-50',
    border: 'border-gray-300 dark:border-border-subtle',
  },
};

/**
 * Theme-aware assets
 * Returns appropriate asset paths based on theme
 */
export const themeAssets = {
  logo: {
    light: '/finallogo.png',
    dark: '/dark-logo.png',
  },
};

/**
 * Hook to get theme-aware logo
 * @returns {string} Logo path for current theme
 *
 * @example
 * const logo = useThemeLogo();
 * <Image src={logo} alt="Logo" />
 */
export function useThemeLogo() {
  return useThemeValue(themeAssets.logo);
}

/**
 * Get theme-aware stroke color for SVG icons
 * @param {Object} options
 * @param {boolean} options.isActive - Whether the item is active
 * @returns {string} Hex color for stroke
 *
 * @example
 * const strokeColor = useThemeIconColor({ isActive: true });
 * <svg stroke={strokeColor}>...</svg>
 */
export function useThemeIconColor({ isActive = false } = {}) {
  const { isDark } = useTheme();

  if (isActive) {
    return isDark ? '#fafafa' : '#111827'; // gray-50 : gray-900
  }
  return isDark ? '#737373' : '#9ca3af'; // gray-500 : gray-400
}

/**
 * Combine multiple theme classes
 * @param {...string} classes - Classes to combine
 * @returns {string} Combined class string
 *
 * @example
 * const classes = combineThemeClasses(
 *   themeClasses.bg.surface,
 *   themeClasses.text.primary,
 *   'rounded-lg p-4'
 * );
 */
export function combineThemeClasses(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Theme-aware navigation item classes
 * Commonly used pattern for sidebar/navigation items
 */
