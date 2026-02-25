'use client';

import { motion } from 'framer-motion';
import { Users, TrendingUp, MousePointer, Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * Analytics Mockup Component for Landing Page
 * Displays a professional, animated preview of analytics features
 */
export default function AnalyticsMockup() {
  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {/* Container */}
      <div className="relative rounded-[24px]">
        {/* Inner container */}
        <div className="bg-[#0F1615] border border-white/10 backdrop-blur-lg rounded-[20px] p-4 md:p-6 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Analytics Overview</h4>
                <p className="text-gray-500 text-xs">Last 7 days</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium rounded-full">
                Live
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <MetricCard icon={Users} label="Visitors" value="2,847" change={12.5} color="cyan" delay={0} />
            <MetricCard icon={Eye} label="Page Views" value="8,392" change={8.3} color="purple" delay={0.1} />
            <MetricCard
              icon={MousePointer}
              label="Interactions"
              value="1,284"
              change={23.1}
              color="emerald"
              delay={0.2}
            />
            <MetricCard icon={TrendingUp} label="Conversion" value="4.2%" change={-2.1} color="amber" delay={0.3} />
          </div>

          {/* Chart Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mini Line Chart */}
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white text-sm font-medium">Visitor Trends</span>
                <span className="text-gray-500 text-xs">This week</span>
              </div>
              <MiniChart />
            </div>

            {/* Conversion Funnel Mini */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <span className="text-white text-sm font-medium block mb-4">Funnel</span>
              <MiniFunnel />
            </div>
          </div>

          {/* Bottom Stats Row */}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <StatItem label="Avg. Session" value="3m 42s" />
              <StatItem label="Bounce Rate" value="34.2%" />
              <StatItem label="Top Page" value="/pricing" />
            </div>
            <div className="text-xs text-gray-500">Updated just now</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, change, color, delay }) {
  const isPositive = change >= 0;

  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  };

  const iconColors = {
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-3`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-4 h-4 ${iconColors[color]}`} />
        <div
          className={`flex items-center gap-0.5 text-[10px] font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <div className="text-white text-lg font-bold">{value}</div>
      <div className="text-gray-500 text-[10px]">{label}</div>
    </motion.div>
  );
}

function MiniChart() {
  // Sample data points for the chart
  const points = [40, 65, 45, 80, 55, 90, 75];
  const maxValue = Math.max(...points);

  return (
    <div className="h-24 flex items-end justify-between gap-1">
      {points.map((value, index) => (
        <motion.div
          key={index}
          initial={{ height: 0 }}
          animate={{ height: `${(value / maxValue) * 100}%` }}
          transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
          className="flex-1 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-sm relative group"
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white/10 px-1.5 py-0.5 rounded text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {value * 10}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MiniFunnel() {
  const stages = [
    { label: 'Visitors', value: 100, color: 'bg-cyan-500' },
    { label: 'Engaged', value: 68, color: 'bg-blue-500' },
    { label: 'Converted', value: 24, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-2">
      {stages.map((stage, index) => (
        <motion.div
          key={stage.label}
          initial={{ width: 0 }}
          animate={{ width: `${stage.value}%` }}
          transition={{ delay: 0.5 + index * 0.15, duration: 0.5, ease: 'easeOut' }}
          className="relative"
        >
          <div
            className={`${stage.color} h-6 rounded-r-full flex items-center justify-between px-2`}
            style={{ minWidth: '60px' }}
          >
            <span className="text-white text-[10px] font-medium truncate">{stage.label}</span>
            <span className="text-white/80 text-[10px]">{stage.value}%</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="text-center md:text-left">
      <div className="text-white text-sm font-medium">{value}</div>
      <div className="text-gray-500 text-[10px]">{label}</div>
    </div>
  );
}
