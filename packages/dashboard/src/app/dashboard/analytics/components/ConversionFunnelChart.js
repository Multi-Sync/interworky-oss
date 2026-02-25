'use client';

import { motion } from 'framer-motion';
import { TrendingDown, Users, Eye, MousePointer, ShoppingCart, Maximize2 } from 'lucide-react';
import { useFunnelData } from '@/app/hooks/useFunnelData';
import InfoTooltip from './InfoTooltip';
import { GlassCard } from '@/app/components/ui/Glassmorphism';

/**
 * Normalize funnel stages to ensure proper hierarchy
 * Awareness >= Consideration >= Conversion (always)
 */
function normalizeFunnelStages(stages) {
  if (!stages || stages.length === 0) return stages;

  // Create a copy to avoid mutating original data
  const normalized = [...stages];

  // Ensure we have exactly 3 stages (Awareness, Consideration, Conversion)
  if (normalized.length !== 3) return normalized;

  // Extract counts
  let awarenessCount = normalized[0]?.count || 0;
  let considerationCount = normalized[1]?.count || 0;
  let conversionCount = normalized[2]?.count || 0;

  // Enforce hierarchy: Awareness >= Consideration >= Conversion
  // Step 1: Consideration cannot exceed Awareness
  if (considerationCount > awarenessCount) {
    considerationCount = awarenessCount;
  }

  // Step 2: Conversion cannot exceed Awareness
  if (conversionCount > awarenessCount) {
    conversionCount = awarenessCount;
  }

  // Step 3: If someone converted, they must have been in consideration
  // So consideration should at least equal conversion
  if (considerationCount < conversionCount) {
    considerationCount = conversionCount;
  }

  // Update normalized stages with corrected counts
  normalized[0] = {
    ...normalized[0],
    count: awarenessCount,
    percentage: 100, // Awareness is always 100% of itself
  };

  normalized[1] = {
    ...normalized[1],
    count: considerationCount,
    percentage: awarenessCount > 0 ? (considerationCount / awarenessCount) * 100 : 0,
    dropOff: Math.max(0, awarenessCount - considerationCount),
  };

  normalized[2] = {
    ...normalized[2],
    count: conversionCount,
    percentage: awarenessCount > 0 ? (conversionCount / awarenessCount) * 100 : 0,
    dropOff: Math.max(0, considerationCount - conversionCount),
  };

  return normalized;
}

/**
 * Calculate metrics from normalized stages
 */
function calculateMetrics(stages) {
  if (!stages || stages.length !== 3) {
    return {
      considerationRate: 0,
      conversionRate: 0,
    };
  }

  const awareness = stages[0]?.count || 0;
  const consideration = stages[1]?.count || 0;
  const conversion = stages[2]?.count || 0;

  return {
    considerationRate: awareness > 0 ? ((consideration / awareness) * 100).toFixed(1) : '0.0',
    conversionRate: awareness > 0 ? ((conversion / awareness) * 100).toFixed(1) : '0.0',
  };
}

/**
 * Conversion Funnel Chart
 * Displays 3-stage funnel: Awareness → Consideration → Conversion
 */
export default function ConversionFunnelChart({ organizationId, period, enabled = true, onExpand, isCompact = false }) {
  const { funnel, isLoading, error } = useFunnelData(organizationId, period, !!organizationId && enabled);
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-purple-300/40 dark:border-purple-500/20 p-6"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-white/5 rounded"></div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-red-300/40 dark:border-red-500/20 p-6"
      >
        <div className="text-center py-12">
          <TrendingDown className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 font-medium">Failed to load funnel data</p>
          <p className="text-sm text-gray-600 dark:text-gray-500 mt-2">{error?.message || 'Please try again'}</p>
        </div>
      </motion.div>
    );
  }

  if (!funnel || !funnel.stages) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-gray-300 dark:border-gray-500/20 p-6"
      >
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-400 font-medium">No funnel data available</p>
          <p className="text-sm text-gray-600 dark:text-gray-500 mt-2">
            Configure conversion tracking to see funnel metrics
          </p>
        </div>
      </motion.div>
    );
  }

  let { stages, metrics } = funnel;

  // Normalize funnel data to ensure Awareness >= Consideration >= Conversion
  // This prevents display errors from bad data or calculation issues
  const normalizedStages = normalizeFunnelStages(stages);

  // Recalculate metrics based on normalized stages
  const normalizedMetrics = calculateMetrics(normalizedStages);

  return (
    <GlassCard>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conversion Funnel</h3>
          <InfoTooltip
            title="Conversion Funnel"
            description="Track how visitors move through your website from initial awareness to final conversion. See exactly where potential customers drop off."
            marketingValue="Identify weak points in your customer journey. If many visitors drop between Awareness and Consideration, your messaging needs work. Low conversion from Consideration means your call-to-action or offer needs optimization."
            onExpand={onExpand}
          />
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">Last {funnel.period?.days || 7} days</div>
      </div>

      {/* Funnel Stages */}
      <div className="space-y-4">
        {normalizedStages.map((stage, index) => (
          <FunnelStage
            key={stage.name}
            stage={stage}
            index={index}
            total={normalizedStages[0].count}
            isCompact={isCompact}
          />
        ))}
      </div>

      {/* Summary - Only show in expanded view */}
      {!isCompact && (
        <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700/50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Consideration Rate</p>
              <p className="text-gray-900 dark:text-white font-semibold">{normalizedMetrics.considerationRate}%</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Overall Conversion Rate</p>
              <p className="text-gray-900 dark:text-white font-semibold">{normalizedMetrics.conversionRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Expand Button - Only show in compact view */}
      {isCompact && onExpand && (
        <button
          onClick={onExpand}
          className="absolute bottom-4 right-4 p-2 rounded-lg bg-purple-100 dark:bg-purple-500/20 hover:bg-purple-200 dark:hover:bg-purple-500/30 border border-purple-400/50 dark:border-purple-500/30 hover:border-purple-500 dark:hover:border-purple-500/50 text-purple-600 dark:text-purple-400 transition-all group"
          title="Expand view"
        >
          <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      )}
    </GlassCard>
  );
}

/**
 * Funnel Stage Component
 */
function FunnelStage({ stage, index, total, isCompact }) {
  // Calculate width percentage for visual funnel effect
  const widthPercentage = total > 0 ? (stage.count / total) * 100 : 0;

  // Stage colors for light and dark mode
  const colors = [
    {
      bg: 'bg-cyan-500',
      border: 'border-cyan-500',
      text: 'text-cyan-700 dark:text-cyan-400',
      lightBorder: 'rgba(6, 182, 212, 0.5)',
      darkBorder: 'rgba(6, 182, 212, 0.25)',
    },
    {
      bg: 'bg-blue-500',
      border: 'border-blue-500',
      text: 'text-blue-700 dark:text-blue-400',
      lightBorder: 'rgba(59, 130, 246, 0.5)',
      darkBorder: 'rgba(59, 130, 246, 0.25)',
    },
    {
      bg: 'bg-purple-500',
      border: 'border-purple-500',
      text: 'text-purple-700 dark:text-purple-400',
      lightBorder: 'rgba(168, 85, 247, 0.5)',
      darkBorder: 'rgba(168, 85, 247, 0.25)',
    },
  ];

  const color = colors[index] || colors[0];

  return (
    <div className="relative">
      {/* Stage Bar */}
      <div
        className="relative overflow-hidden rounded-lg border backdrop-blur-xl transition-all duration-300 hover:shadow-lg"
        style={{
          width: `${Math.max(widthPercentage, 20)}%`,
          borderColor: color.lightBorder,
        }}
      >
        <div className={`absolute inset-0 ${color.bg} opacity-20 dark:opacity-10`} />
        <div className="relative p-4">
          <div className="flex items-center justify-between">
            {!isCompact && (
              <div>
                <h4 className={`font-semibold ${color.text} mb-1`}>{stage.label}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">{stage.description}</p>
              </div>
            )}
            <div className={isCompact ? 'w-full text-center' : 'text-right'}>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stage.count.toLocaleString()}</p>
              <p className={`text-sm ${color.text}`}>{stage.percentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Drop-off indicator */}
      {index < 2 && stage.dropOff > 0 && (
        <div className="mt-2 ml-4 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-500">
          <TrendingDown className="w-3 h-3" />
          <span>{stage.dropOff.toLocaleString()} visitors dropped off</span>
        </div>
      )}
    </div>
  );
}
