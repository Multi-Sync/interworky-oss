'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Zap, Activity, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import CoreWebVitalsModal from './CoreWebVitalsModal';
import { GlassCard } from '@/app/components/ui/Glassmorphism';

export default function CoreWebVitals({ metricsData, isLoading }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <GlassCard key={i} variant="compact" accentColor="gray" className="animate-pulse">
            <div className="h-20"></div>
          </GlassCard>
        ))}
      </div>
    );
  }

  if (!metricsData || Object.keys(metricsData).length === 0) {
    return (
      <GlassCard accentColor="gray" className="p-8 text-center">
        <Activity className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Metrics Available</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Performance metrics will appear here once your website is visited.
        </p>
      </GlassCard>
    );
  }

  // Handle both flattened (summary) and nested (full) data structures
  const coreWebVitals = metricsData.core_web_vitals || {
    fcp: metricsData.fcp,
    lcp: metricsData.lcp,
    ttfb: metricsData.ttfb,
    cls: metricsData.cls,
    inp: metricsData.inp,
    fid: metricsData.fid,
  };
  const loadingPerformance = metricsData.loading_performance || {};
  const score = metricsData.score || 0;

  // Helper function to get metric rating
  const getRating = (metric, value) => {
    if (!value && value !== 0)
      return { label: 'N/A', color: 'gray', bgColor: 'bg-gray-100 dark:bg-gray-800', icon: Minus };

    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      ttfb: { good: 600, poor: 800 },
    };

    const threshold = thresholds[metric];
    if (!threshold)
      return {
        label: 'OK',
        color: 'blue',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        icon: Minus,
      };

    if (value <= threshold.good) {
      return {
        label: 'Good',
        color: 'green',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        icon: TrendingUp,
      };
    } else if (value <= threshold.poor) {
      return {
        label: 'Needs Improvement',
        color: 'yellow',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        icon: Minus,
      };
    } else {
      return {
        label: 'Poor',
        color: 'red',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        icon: TrendingDown,
      };
    }
  };

  const fcpRating = getRating('fcp', coreWebVitals.fcp);
  const lcpRating = getRating('lcp', coreWebVitals.lcp);
  const ttfbRating = getRating('ttfb', coreWebVitals.ttfb);

  // Helper function to get rating color classes (Tailwind JIT compatibility)
  const getRatingColorClass = color => {
    const colorMap = {
      green: 'text-green-700 dark:text-green-400',
      yellow: 'text-yellow-700 dark:text-yellow-400',
      red: 'text-red-700 dark:text-red-400',
      gray: 'text-gray-700 dark:text-gray-400',
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* First Contentful Paint */}
        <GlassCard
          variant="compact"
          accentColor="gray"
          hover
          animated
          className="group cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-xl font-bold">FCP</h1>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
          </div>
          <div className="mb-2">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">First Contentful Paint</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {coreWebVitals.fcp ? Math.round(coreWebVitals.fcp) : 'N/A'}
              </span>
              {coreWebVitals.fcp && <span className="text-sm text-gray-600 dark:text-gray-400">ms</span>}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${fcpRating.bgColor} ${getRatingColorClass(fcpRating.color)}`}
            >
              {fcpRating.icon && <fcpRating.icon className="w-3 h-3" />}
              {fcpRating.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
              Click for details →
            </span>
          </div>
        </GlassCard>

        {/* Largest Contentful Paint */}
        <GlassCard
          variant="compact"
          accentColor="gray"
          hover
          animated
          delay={0.1}
          className="group cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-xl font-bold">LCP</h1>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
          </div>
          <div className="mb-2">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Largest Contentful Paint</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {coreWebVitals.lcp ? Math.round(coreWebVitals.lcp) : 'N/A'}
              </span>
              {coreWebVitals.lcp && <span className="text-sm text-gray-600 dark:text-gray-400">ms</span>}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${lcpRating.bgColor} ${getRatingColorClass(lcpRating.color)}`}
            >
              {lcpRating.icon && <lcpRating.icon className="w-3 h-3" />}
              {lcpRating.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
              Click for details →
            </span>
          </div>
        </GlassCard>

        {/* Time to First Byte */}
        <GlassCard
          variant="compact"
          accentColor="gray"
          hover
          animated
          delay={0.2}
          className="group cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-xl font-bold">TTB</h1>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
          </div>
          <div className="mb-2">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Time to First Byte</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {coreWebVitals.ttfb ? Math.round(coreWebVitals.ttfb) : 'N/A'}
              </span>
              {coreWebVitals.ttfb && <span className="text-sm text-gray-600 dark:text-gray-400">ms</span>}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ttfbRating.bgColor} ${getRatingColorClass(ttfbRating.color)}`}
            >
              {ttfbRating.icon && <ttfbRating.icon className="w-3 h-3" />}
              {ttfbRating.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
              Click for details →
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Modal */}
      <CoreWebVitalsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} metricsData={metricsData} />
    </>
  );
}
