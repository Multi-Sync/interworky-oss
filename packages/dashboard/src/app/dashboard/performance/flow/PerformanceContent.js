'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { getOrganization } from '@/_common/utils/localStorage';
import { themeClasses, combineThemeClasses } from '@/_common/utils/themeUtils';

export default function PerformanceContent() {
  const [timeFilter, setTimeFilter] = useState('30d');

  // Get organization
  const organization = getOrganization()?.organization;
  const orgId = organization?.id;

  // Calculate date range based on time filter
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    if (timeFilter === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeFilter === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate.setDate(startDate.getDate() - 90);
    }
    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    };
  }, [timeFilter]);

  // Placeholder stats - will be replaced with real data when backend is ready
  const logsStats = {
    totalEvents: 0,
    resolvedCount: 0,
    errorCount: 0,
    successRate: 0,
    errorRate: 0,
    avgLatency: 0,
  };

  const isLoading = false;

  return (
    <div className="min-h-screen bg-performance-light dark:bg-performance-dark transition-colors duration-200 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className={combineThemeClasses('text-2xl md:text-3xl font-bold', themeClasses.text.primary)}>
                  System Performance
                </h1>
                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-cyan-400">
                    <div className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full" />
                    Loading...
                  </div>
                )}
              </div>
              <p className={combineThemeClasses('text-sm mt-1', themeClasses.text.secondary)}>
                System logs and performance metrics
              </p>
            </div>

            {/* Time Filter */}
            <div className="flex bg-[#0a0e27]/60 backdrop-blur-xl border border-cyan-500/20 rounded-lg p-1">
              {['7d', '30d', '90d'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    timeFilter === filter
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : combineThemeClasses(themeClasses.text.secondary, themeClasses.hover.text)
                  }`}
                >
                  Last {filter === '7d' ? '7' : filter === '30d' ? '30' : '90'} Days
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#0a0e27]/60 backdrop-blur-xl border border-blue-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className={combineThemeClasses('text-sm font-medium mb-2', themeClasses.text.secondary)}>
              TOTAL EVENTS
            </div>
            <div className={combineThemeClasses('text-3xl font-bold', themeClasses.text.primary)}>
              {logsStats.totalEvents.toLocaleString()}
            </div>
            <div className={combineThemeClasses('text-xs mt-2', themeClasses.text.tertiary)}>
              {timeFilter === '7d' ? 'Last 7 days' : timeFilter === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </div>
          </motion.div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0a0e27]/60 backdrop-blur-xl border border-green-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className={combineThemeClasses('text-sm font-medium mb-2', themeClasses.text.secondary)}>
              SUCCESS RATE
            </div>
            <div className={combineThemeClasses('text-3xl font-bold', themeClasses.text.primary)}>
              {logsStats.successRate}%
            </div>
            <div className="text-xs text-green-400 mt-2">{logsStats.resolvedCount} resolved</div>
          </motion.div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0a0e27]/60 backdrop-blur-xl border border-amber-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Zap className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div className={combineThemeClasses('text-sm font-medium mb-2', themeClasses.text.secondary)}>
              AVG LATENCY
            </div>
            <div className={combineThemeClasses('text-3xl font-bold', themeClasses.text.primary)}>
              {logsStats.avgLatency}ms
            </div>
            <div className={combineThemeClasses('text-xs mt-2', themeClasses.text.tertiary)}>Processing time</div>
          </motion.div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0a0e27]/60 backdrop-blur-xl border border-red-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <div className={combineThemeClasses('text-sm font-medium mb-2', themeClasses.text.secondary)}>
              ERROR RATE
            </div>
            <div className={combineThemeClasses('text-3xl font-bold', themeClasses.text.primary)}>
              {logsStats.errorRate}%
            </div>
            <div className="text-xs text-red-400 mt-2">{logsStats.errorCount} errors tracked</div>
          </motion.div>
        </div>

        {/* Coming Soon Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0a0e27]/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-12"
        >
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Activity className="w-10 h-10 text-cyan-400" />
            </div>
            <h3 className={combineThemeClasses('text-2xl font-bold mb-3', themeClasses.text.primary)}>
              Performance Flow Visualization
            </h3>
            <p className={combineThemeClasses('max-w-md mx-auto', themeClasses.text.secondary)}>
              Advanced flow visualization and detailed performance metrics coming soon. This feature will provide
              real-time insights into system logs and performance patterns.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
