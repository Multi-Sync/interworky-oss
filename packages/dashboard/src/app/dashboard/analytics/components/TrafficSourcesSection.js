'use client';

import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import InfoTooltip from './InfoTooltip';
import { GlassCard } from '@/app/components/ui/Glassmorphism';

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

/**
 * Traffic Sources Section
 * Shows a pie chart and table of traffic source breakdown
 */
export default function TrafficSourcesSection({ sources, isLoading, onExpand, isCompact = false }) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 relative overflow-hidden rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-cyan-400/40 dark:border-cyan-500/30 p-6"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-40 mb-4"></div>
          <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded h-64"></div>
        </div>
      </motion.div>
    );
  }

  if (!sources || sources.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 relative overflow-hidden rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-cyan-400/40 dark:border-cyan-500/30 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Traffic Sources</h3>
        </div>
        <div className="text-center py-16 text-gray-600 dark:text-gray-400">
          <p>No traffic data available</p>
        </div>
      </motion.div>
    );
  }

  // Prepare data for pie chart
  const chartData = sources.map(source => ({
    name: formatSourceName(source.source_name, source.source_type),
    value: source.visitors,
    percentage: source.percentage,
  }));

  return (
    <GlassCard className="h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Share2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Traffic Sources</h3>
        <InfoTooltip
          title="Traffic Sources"
          description="Discover which channels bring visitors to your site - organic search, social media, direct traffic, referrals, or paid ads."
          marketingValue="Focus your budget on channels that work. If organic search dominates, invest in SEO. High social traffic means your content is shareable. Low direct traffic suggests weak brand awareness. Diversify channels to reduce dependency on any single source."
        />
        <span className="text-sm text-gray-600 dark:text-gray-500 ml-auto">Where your visitors come from</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-64 relative">
          {/* Shadow layer for 3D effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-40 h-40 rounded-full blur-2xl opacity-40"
              style={{
                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.6), transparent 70%)',
              }}
            />
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {chartData.map((entry, index) => (
                  <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={90}
                innerRadius={0}
                fill="#8884d8"
                dataKey="value"
                startAngle={90}
                endAngle={450}
                paddingAngle={2}
                style={{
                  filter: 'drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.5))',
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#gradient-${index})`}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    style={{
                      filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.3))',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="overflow-hidden">
          <div className="overflow-y-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="text-left border-b border-gray-300 dark:border-gray-700">
                <tr>
                  <th className="pb-2 text-gray-600 dark:text-gray-400 font-medium">Source</th>
                  <th className="pb-2 text-gray-600 dark:text-gray-400 font-medium text-right">Visitors</th>
                  <th className="pb-2 text-gray-600 dark:text-gray-400 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formatSourceName(source.source_name, source.source_type)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-700 dark:text-gray-300">
                      {source.visitors.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-cyan-700 dark:text-cyan-400 font-semibold">
                      {source.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// Custom label for pie chart with 3D text effect
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null; // Hide labels for small slices

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      {/* Shadow text for 3D effect */}
      <text
        x={x + 1}
        y={y + 1}
        fill="rgba(0, 0, 0, 0.5)"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="14"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      {/* Main text */}
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="14"
        fontWeight="bold"
        style={{ filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.8))' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

// Format source names to be user-friendly
function formatSourceName(name, type) {
  const sourceMap = {
    direct: 'Direct',
    search: 'Search Engines',
    google: 'Google Search',
    bing: 'Bing Search',
    social: 'Social Media',
    facebook: 'Facebook',
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    referral: 'Referral',
    email: 'Email',
    paid: 'Paid Ads',
    organic: 'Organic Search',
  };

  const lowerName = name?.toLowerCase() || '';
  return sourceMap[lowerName] || name || type || 'Unknown';
}
