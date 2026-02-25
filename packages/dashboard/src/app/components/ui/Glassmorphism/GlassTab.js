'use client';

import { motion } from 'framer-motion';

/**
 * GlassTab - A glassmorphism styled tab navigation
 *
 * @param {object} props
 * @param {Array<{id: string, label: string, icon?: React.ReactNode}>} props.tabs - Array of tab objects
 * @param {string} props.activeTab - Currently active tab ID
 * @param {function} props.onTabChange - Callback when tab changes
 * @param {string} [props.accentColor='cyan'] - Accent color for active tab
 * @param {string} [props.className] - Additional CSS classes
 */
const GlassTab = ({ tabs = [], activeTab, onTabChange, accentColor = 'cyan', className = '' }) => {
  const accentGradients = {
    cyan: 'from-neutral-700 to-neutral-600',
    purple: 'from-neutral-700 to-neutral-600',
    blue: 'from-blue-600 to-blue-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-yellow-500',
    pink: 'from-neutral-700 to-neutral-600',
    gray: 'from-neutral-700 to-neutral-600',
  };

  const textColors = {
    cyan: 'text-gray-600 dark:text-gray-300',
    purple: 'text-gray-600 dark:text-gray-300',
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    pink: 'text-gray-600 dark:text-gray-300',
    gray: 'text-gray-600 dark:text-gray-300',
  };

  const gradient = accentGradients[accentColor] || accentGradients.cyan;
  const textColor = textColors[accentColor] || textColors.cyan;

  return (
    <div className={`relative ${className}`}>
      {/* Tab container with glassmorphism */}
      <div className="bg-surface-light dark:bg-surface border border-border-default-light dark:border-border-default rounded-lg p-1 inline-flex gap-1">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative px-6 py-2.5 rounded-md transition-all duration-300"
            >
              {/* Active tab background */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute inset-0 bg-surface-elevated-light dark:bg-surface-elevated rounded-md border border-gray-300 dark:border-border-subtle`}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Tab content */}
              <div className="relative flex items-center gap-2">
                {tab.icon && (
                  <span className={isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                    {tab.icon}
                  </span>
                )}
                <span
                  className={`font-medium text-sm whitespace-nowrap ${
                    isActive
                      ? 'text-gray-900 dark:text-white'
                      : `${textColor} hover:text-gray-900 dark:hover:text-white`
                  } transition-colors`}
                >
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GlassTab;
