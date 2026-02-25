'use client';

import { forwardRef } from 'react';

/**
 * GlassTextarea - A glassmorphism styled textarea field
 *
 * @param {object} props
 * @param {string} [props.accentColor='cyan'] - Accent color for focus state
 * @param {string} [props.placeholder] - Textarea placeholder
 * @param {string} [props.error] - Error message to display
 * @param {number} [props.rows=4] - Number of rows
 * @param {string} [props.className] - Additional CSS classes
 */
const GlassTextarea = forwardRef(
  ({ accentColor = 'cyan', placeholder = '', error = '', rows = 4, className = '', ...props }, ref) => {
    const focusColors = {
      cyan: 'focus:border-blue-500/50 focus:ring-blue-500/20',
      purple: 'focus:border-blue-500/50 focus:ring-blue-500/20',
      blue: 'focus:border-blue-500/50 focus:ring-blue-500/20',
      green: 'focus:border-green-500/50 focus:ring-green-500/20',
      orange: 'focus:border-orange-500/50 focus:ring-orange-500/20',
      pink: 'focus:border-blue-500/50 focus:ring-blue-500/20',
      gray: 'focus:border-border-subtle focus:ring-neutral-600/20',
    };

    const focusColor = focusColors[accentColor] || focusColors.cyan;

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          rows={rows}
          placeholder={placeholder}
          className={`
          w-full px-4 py-3 rounded-lg
          bg-surface-elevated-light dark:bg-surface-elevated
          border ${error ? 'border-red-500/50' : 'border-border-default-light dark:border-border-default'}
          ${focusColor}
          text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2
          transition-all duration-300
          resize-vertical
          ${className}
        `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  },
);

GlassTextarea.displayName = 'GlassTextarea';

export default GlassTextarea;
