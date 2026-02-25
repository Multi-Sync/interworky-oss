'use client';

import { motion } from 'framer-motion';
import { Users, UserPlus, FileText, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Hero Metrics Component
 * Displays 4 key metric cards with period-over-period comparison
 */
export default function HeroMetrics({ metrics, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-gray-200 dark:border-cyan-500/20 p-6"
          >
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 dark:bg-white/10 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const cards = [
    {
      label: 'Total Visitors',
      value: metrics.total_visitors?.value || 0,
      change: metrics.total_visitors?.change || 0,
      icon: Users,
      color: 'cyan',
      tooltip: 'Total number of visitors in the selected period',
    },
    {
      label: 'New Visitors',
      value: `${metrics.new_visitors?.percentage || 0}%`,
      subValue: `${metrics.new_visitors?.count || 0} visitors`,
      change: metrics.new_visitors?.change || 0,
      icon: UserPlus,
      color: 'emerald',
      tooltip: 'Percentage of first-time visitors vs returning visitors',
    },
    {
      label: 'Avg Pages per Session',
      value: formatPagesPerSession(metrics.avg_pages_per_session?.value || 0),
      change: metrics.avg_pages_per_session?.change || 0,
      icon: FileText,
      color: 'purple',
      tooltip: 'Average number of pages viewed per visitor session',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {cards.map((card, index) => (
        <MetricCard key={card.label} card={card} index={index} />
      ))}
    </div>
  );
}

function MetricCard({ card, index }) {
  const { label, value, subValue, change, icon: Icon, color, tooltip, isAlert } = card;

  // Color variants for light and dark mode
  const colorClasses = {
    cyan: 'bg-gradient-to-br from-white/80 to-white/80 dark:from-cyan-500/20 dark:to-cyan-500/5 border-cyan-400/40 dark:border-cyan-500/30',
    emerald:
      'bg-gradient-to-br from-white/80 to-white/80 dark:from-emerald-500/20 dark:to-emerald-500/5 border-emerald-400/40 dark:border-emerald-500/30',
    purple:
      'bg-gradient-to-br from-white/80 to-white/80 dark:from-purple-500/20 dark:to-purple-500/5 border-purple-400/40 dark:border-purple-500/30',
    red: 'bg-gradient-to-br from-white/80 to-white/80 dark:from-red-500/20 dark:to-red-500/5 border-red-400/40 dark:border-red-500/30',
    gray: 'bg-gradient-to-br from-white/80 to-white/80 dark:from-gray-500/20 dark:to-gray-500/5 border-gray-400/40 dark:border-gray-500/30',
  };

  const iconColorClasses = {
    cyan: 'text-cyan-600 dark:text-cyan-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    purple: 'text-purple-600 dark:text-purple-400',
    red: 'text-red-600 dark:text-red-400',
    gray: 'text-gray-600 dark:text-gray-400',
  };

  const hoverBorderClasses = {
    cyan: 'hover:border-cyan-500 dark:hover:border-cyan-400/50',
    emerald: 'hover:border-emerald-500 dark:hover:border-emerald-400/50',
    purple: 'hover:border-purple-500 dark:hover:border-purple-400/50',
    red: 'hover:border-red-500 dark:hover:border-red-400/50',
    gray: 'hover:border-gray-500 dark:hover:border-gray-400/50',
  };

  const glowClasses = {
    cyan: 'from-cyan-500/20 dark:from-cyan-500/10',
    emerald: 'from-emerald-500/20 dark:from-emerald-500/10',
    purple: 'from-purple-500/20 dark:from-purple-500/10',
    red: 'from-red-500/20 dark:from-red-500/10',
    gray: 'from-gray-500/20 dark:from-gray-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative overflow-hidden rounded-lg ${colorClasses[color]} backdrop-blur-xl border ${hoverBorderClasses[color]} p-4 transition-all duration-300 group`}
      title={tooltip}
    >
      {/* Background Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${glowClasses[color]} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      ></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header with Icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-700 dark:text-gray-400 font-medium">{label}</span>
          <Icon className={`w-5 h-5 ${iconColorClasses[color]}`} />
        </div>

        {/* Value */}
        <div className="flex items-center gap-4">
          <div
            className={`text-2xl md:text-3xl font-bold mb-2 ${isAlert ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}
          >
            {value}
          </div>
          {change !== null && <ChangeIndicator change={change} />}
        </div>
      </div>
    </motion.div>
  );
}

function ChangeIndicator({ change }) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const Icon = icon;

  const colorClass = isNeutral
    ? 'text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-500/10'
    : isPositive
      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10'
      : 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/10';

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      <Icon className="w-3 h-3" />
      <span>{isNeutral ? '0%' : `${Math.abs(change)}%`}</span>
      <span className="text-gray-600 dark:text-gray-500 ml-1">vs last period</span>
    </div>
  );
}

// Format pages per session to readable format
function formatPagesPerSession(pages) {
  if (pages === 0) return '0';
  return pages.toFixed(1);
}
