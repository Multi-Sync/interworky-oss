'use client';

import { motion } from 'framer-motion';

/**
 * GlassBadge - A glassmorphism styled badge with status indicators
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} [props.variant='default'] - Badge variant: 'default', 'success', 'warning', 'error', 'info'
 * @param {boolean} [props.pulse=false] - Enable pulse animation
 * @param {React.ReactNode} [props.icon] - Optional icon
 * @param {string} [props.className] - Additional CSS classes
 */
const GlassBadge = ({ children, variant = 'default', pulse = false, icon, className = '' }) => {
  const variantStyles = {
    default: {
      bg: 'bg-gray-200 dark:bg-gray-500/20',
      border: 'border-gray-400 dark:border-gray-500/30',
      text: 'text-gray-700 dark:text-gray-300',
      dot: 'bg-gray-600 dark:bg-gray-400',
    },
    success: {
      bg: 'bg-green-100 dark:bg-green-500/20',
      border: 'border-green-500 dark:border-green-500/30',
      text: 'text-green-700 dark:text-green-400',
      dot: 'bg-green-600 dark:bg-green-400',
    },
    warning: {
      bg: 'bg-yellow-100 dark:bg-yellow-500/20',
      border: 'border-yellow-500 dark:border-yellow-500/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      dot: 'bg-yellow-600 dark:bg-yellow-400',
    },
    error: {
      bg: 'bg-red-100 dark:bg-red-500/20',
      border: 'border-red-500 dark:border-red-500/30',
      text: 'text-red-700 dark:text-red-400',
      dot: 'bg-red-600 dark:bg-red-400',
    },
    info: {
      bg: 'bg-cyan-100 dark:bg-cyan-500/20',
      border: 'border-cyan-500 dark:border-cyan-500/30',
      text: 'text-cyan-700 dark:text-cyan-400',
      dot: 'bg-cyan-600 dark:bg-cyan-400',
    },
  };

  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        ${styles.bg}
        border ${styles.border}
        ${className}
      `}
    >
      {/* Pulse dot indicator */}
      {pulse && (
        <div className="relative flex items-center justify-center">
          <motion.div
            className={`w-2 h-2 rounded-full ${styles.dot}`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.6, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className={`absolute w-2 h-2 rounded-full ${styles.dot}`}
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      )}

      {/* Icon */}
      {icon && <span className={styles.text}>{icon}</span>}

      {/* Badge text */}
      <span className={`text-xs font-medium ${styles.text}`}>{children}</span>
    </div>
  );
};

export default GlassBadge;
