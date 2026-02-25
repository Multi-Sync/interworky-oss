'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Maximize2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import InfoTooltip from './InfoTooltip';
import { GlassCard } from '@/app/components/ui/Glassmorphism';

/**
 * Visitor Trends Section
 * Shows a line graph of visitor trends over time
 */
export default function VisitorTrendsSection({ trends, isLoading, onExpand, isCompact = false }) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 relative overflow-hidden rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-cyan-400/40 dark:border-cyan-500/20 p-6"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-40 mb-4"></div>
          <div className="h-64 bg-gray-100 dark:bg-white/5 rounded"></div>
        </div>
      </motion.div>
    );
  }

  if (!trends || trends.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 relative overflow-hidden rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-cyan-400/40 dark:border-cyan-500/20 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visitor Trends</h3>
        </div>
        <div className="text-center py-16 text-gray-600 dark:text-gray-400">
          <p>No trend data available</p>
        </div>
      </motion.div>
    );
  }

  // Format data for chart
  const chartData = trends.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'New Visitors': item.new_visitors,
    'Returning Visitors': item.returning_visitors,
    Total: item.total_visitors,
  }));

  return (
    <GlassCard>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visitor Trends</h3>
        <InfoTooltip
          title="Visitor Trends"
          description="Monitor your daily visitor growth patterns. Track new vs. returning visitors to understand your audience growth and retention."
          marketingValue="Spot growth trends and seasonal patterns. Growing new visitors means your acquisition is working. High returning visitors shows strong content engagement. Use these insights to time campaigns and content releases for maximum impact."
          onExpand={onExpand}
        />
        <span className="text-sm text-gray-600 dark:text-gray-500 ml-auto">Daily visitor growth over time</span>
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line
              type="monotone"
              dataKey="Total"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={{ fill: '#06b6d4', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="New Visitors"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="Returning Visitors"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats - Only show in expanded view */}
      {!isCompact && (
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-300 dark:border-gray-700/50">
          <StatBox label="Total Period" value={calculateTotal(trends, 'total_visitors')} />
          <StatBox label="Peak Day" value={calculatePeak(trends)} />
          <StatBox label="Avg Daily" value={calculateAverage(trends, 'total_visitors')} />
        </div>
      )}

      {/* Expand Button - Only show in compact view */}
      {isCompact && onExpand && (
        <button
          onClick={onExpand}
          className="absolute bottom-4 right-4 p-2 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 hover:bg-cyan-200 dark:hover:bg-cyan-500/30 border border-cyan-400/50 dark:border-cyan-500/30 hover:border-cyan-500 dark:hover:border-cyan-500/50 text-cyan-600 dark:text-cyan-400 transition-all group"
          title="Expand view"
        >
          <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      )}
    </GlassCard>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-600 dark:text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function calculateTotal(trends, field) {
  return trends.reduce((sum, item) => sum + (item[field] || 0), 0).toLocaleString();
}

function calculateAverage(trends, field) {
  if (trends.length === 0) return '0';
  const total = trends.reduce((sum, item) => sum + (item[field] || 0), 0);
  return Math.round(total / trends.length).toLocaleString();
}

function calculatePeak(trends) {
  if (trends.length === 0) return '0';
  const max = Math.max(...trends.map(item => item.total_visitors || 0));
  return max.toLocaleString();
}
