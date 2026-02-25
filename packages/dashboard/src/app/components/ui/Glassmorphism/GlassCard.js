'use client';

import { motion } from 'framer-motion';
import { forwardRef } from 'react';

/**
 * GlassCard - A glassmorphism card component with customizable variants
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Content to display inside the card
 * @param {string} [props.variant='default'] - Card variant: 'default', 'header', 'content', 'compact'
 * @param {string} [props.accentColor='cyan'] - Accent color: 'cyan', 'purple', 'blue', 'green', 'orange', 'pink'
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.animated=true] - Enable entrance animation
 * @param {boolean} [props.hover=true] - Enable hover effects
 * @param {number} [props.delay=0] - Animation delay in seconds
 */
const GlassCard = forwardRef(
  (
    {
      children,
      variant = 'default',
      accentColor = 'cyan',
      className = '',
      animated = true,
      hover = true,
      delay = 0,
      ...props
    },
    ref,
  ) => {
    // Accent color gradients (neutralized)
    const accentColors = {
      cyan: 'from-gray-600 to-gray-700',
      purple: 'from-gray-600 to-gray-700',
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-emerald-500',
      orange: 'from-orange-500 to-yellow-500',
      pink: 'from-gray-600 to-gray-700',
      gray: 'from-gray-600 to-gray-700',
      interworky: 'from-[#058A7C] to-[#FCD966]', // Brand gradient
    };

    // Border colors (neutralized)
    const borderColors = {
      cyan: 'border-border-default-light dark:border-border-default',
      purple: 'border-border-default-light dark:border-border-default',
      blue: 'border-blue-500/30',
      green: 'border-green-500/30',
      orange: 'border-orange-500/30',
      pink: 'border-border-default-light dark:border-border-default',
      gray: 'border-border-default-light dark:border-border-default',
      interworky: 'border-[#058A7C]/30', // Brand border
    };

    // Glow colors for hover (removed glow)
    const glowColors = {
      cyan: '',
      purple: '',
      blue: 'shadow-blue-500/20',
      green: 'shadow-green-500/20',
      orange: 'shadow-orange-500/20',
      pink: '',
      gray: '',
      interworky: 'shadow-[#058A7C]/30', // Brand glow
    };

    // Variant styles
    const variantStyles = {
      default: 'p-6',
      header: 'p-4 md:p-6',
      content: 'p-2 md:p-4',
      compact: 'p-4',
    };

    const gradient = accentColors[accentColor] || accentColors.cyan;
    const borderColor = borderColors[accentColor] || borderColors.cyan;
    const glowColor = glowColors[accentColor] || glowColors.cyan;
    const padding = variantStyles[variant] || variantStyles.default;

    return (
      <motion.div
        ref={ref}
        initial={animated ? { opacity: 0, y: 20, scale: 0.95 } : false}
        animate={animated ? { opacity: 1, y: 0, scale: 1 } : false}
        transition={{
          duration: 0.5,
          delay,
          ease: [0.23, 1, 0.32, 1],
        }}
        className={`relative group ${className}`}
        {...props}
      >
        {/* Glass card */}
        <div
          className={`
          relative bg-surface-light dark:bg-surface
          border ${borderColor} rounded-lg 
          ${padding}
          shadow-sm
          ${hover ? `hover:border-border-subtle ${glowColor}` : ''}
          transition-all duration-200 h-full w-full
        `}
        >
          {children}
        </div>
      </motion.div>
    );
  },
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
