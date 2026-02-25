'use client';

import { motion } from 'framer-motion';

/**
 * GlassSection - A section wrapper with optional divider and title
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Content to display
 * @param {string} [props.title] - Optional section title
 * @param {string} [props.subtitle] - Optional section subtitle
 * @param {boolean} [props.divider=true] - Show divider line
 * @param {string} [props.accentColor='cyan'] - Accent color for divider and title
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.delay=0] - Animation delay
 */
const GlassSection = ({
  children,
  title,
  subtitle,
  divider = true,
  accentColor = 'cyan',
  className = '',
  delay = 0,
}) => {
  const accentColors = {
    cyan: 'text-cyan-400',
    purple: 'text-primary',
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    pink: 'text-primary',
  };

  const dividerColors = {
    cyan: 'from-transparent via-cyan-500/50 to-transparent',
    purple: 'from-transparent via-primary/50 to-transparent',
    blue: 'from-transparent via-blue-500/50 to-transparent',
    green: 'from-transparent via-green-500/50 to-transparent',
    orange: 'from-transparent via-orange-500/50 to-transparent',
    pink: 'from-transparent via-primary/50 to-transparent',
  };

  const titleColor = accentColors[accentColor] || accentColors.cyan;
  const dividerGradient = dividerColors[accentColor] || dividerColors.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`space-y-4 ${className}`}
    >
      {/* Title and subtitle */}
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && <h3 className={`text-lg font-semibold ${titleColor}`}>{title}</h3>}
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
      )}

      {/* Content */}
      <div>{children}</div>

      {/* Divider */}
      {divider && (
        <div className="relative h-px my-6">
          <div className={`absolute inset-0 bg-gradient-to-r ${dividerGradient}`} />
        </div>
      )}
    </motion.div>
  );
};

export default GlassSection;
