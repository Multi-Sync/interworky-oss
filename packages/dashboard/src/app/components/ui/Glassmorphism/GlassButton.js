'use client';

import { motion } from 'framer-motion';
import { forwardRef } from 'react';

/**
 * GlassButton - A glassmorphism styled button with glow effects
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} [props.variant='primary'] - Button variant: 'primary', 'secondary', 'ghost', 'danger'
 * @param {string} [props.accentColor='cyan'] - Accent color
 * @param {boolean} [props.glow=true] - Enable glow effect
 * @param {boolean} [props.isLoading=false] - Show loading state
 * @param {boolean} [props.disabled=false] - Disable button
 * @param {string} [props.className] - Additional CSS classes
 */
const GlassButton = forwardRef(
  (
    {
      children,
      variant = 'primary',
      accentColor = 'cyan',
      glow = true,
      isLoading = false,
      disabled = false,
      className = '',
      ...props
    },
    ref,
  ) => {
    const accentGradients = {
      cyan: 'from-neutral-800 to-neutral-700',
      purple: 'from-neutral-800 to-neutral-700',
      blue: 'from-blue-600 to-blue-500',
      green: 'from-green-500 to-emerald-500',
      orange: 'from-orange-500 to-yellow-500',
      pink: 'from-neutral-800 to-neutral-700',
      gray: 'from-neutral-800 to-neutral-700',
      interworky: 'from-[#058A7C] to-[#FCD966]', // Brand gradient
    };

    const glowColors = {
      cyan: '',
      purple: '',
      blue: 'hover:shadow-blue-500/20',
      green: 'hover:shadow-green-500/20',
      orange: 'hover:shadow-orange-500/20',
      pink: '',
      gray: '',
      interworky: 'hover:shadow-[#058A7C]/40 hover:shadow-lg', // Brand glow
    };

    const gradient = accentGradients[accentColor] || accentGradients.cyan;
    const glowColor = glowColors[accentColor] || glowColors.cyan;

    const variantStyles = {
      primary:
        accentColor === 'interworky' || accentColor === 'blue' || accentColor === 'green' || accentColor === 'orange'
          ? `bg-gradient-to-r ${gradient} text-white border border-white/20 shadow-lg ${glow ? glowColor : ''}`
          : `bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-900 dark:text-white border border-border-default-light dark:border-border-default shadow-sm`,
      secondary: `bg-surface-light dark:bg-surface border border-border-default-light dark:border-border-default text-gray-700 dark:text-gray-300 hover:bg-surface-elevated-light dark:hover:bg-surface-elevated`,
      ghost: `bg-transparent hover:bg-surface-elevated-light dark:hover:bg-surface-elevated text-gray-700 dark:text-gray-300`,
      danger: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm hover:shadow-red-500/20',
    };

    const baseStyles = variantStyles[variant] || variantStyles.primary;

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        disabled={disabled || isLoading}
        className={`
        relative px-6 py-3 rounded-lg
        font-medium text-sm
        ${baseStyles}
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Button content */}
        <span className={isLoading ? 'opacity-0' : ''}>{children}</span>
      </motion.button>
    );
  },
);

GlassButton.displayName = 'GlassButton';

export default GlassButton;
