'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Map, AlertCircle, Settings, Power } from 'lucide-react';
import { getOrganization } from '@/_common/utils/localStorage';
import { useAnalyticsSummary } from '@/app/hooks/useAnalyticsSummary';
import HeroMetrics from './HeroMetrics';
import VisitorTrendsSection from './VisitorTrendsSection';
import TrafficSourcesSection from './TrafficSourcesSection';
import VisitorCountriesMap from './VisitorCountriesMap';
import ConversionFunnelChart from './ConversionFunnelChart';
import ConversionConfigForm from './ConversionConfigForm';
import Dialog from '@/app/components/Dialog';
import Link from 'next/link';
import useAssistantState from '@/_common/hooks/useAssistantState';
import ToggleSwitch from '@/app/components/ToggleSwitch';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import { fetcher } from '@/_common/utils/swrFetcher';
import PluginNotConnectedWarning from '@/app/components/PluginNotConnectedWarning';
import ThemeToggle from '@/app/components/ThemeToggle';
import { GlassCard } from '@/app/components/ui/Glassmorphism';
import { Button } from '@/app/components/ui/Button';

/**
 * Unified Analytics View
 * Main dashboard component that displays simplified, business-focused analytics
 */
export default function UnifiedAnalyticsView() {
  const [period, setPeriod] = useState('7d');
  const [isConversionConfigModalOpen, setIsConversionConfigModalOpen] = useState(false);

  // Expanded view modals
  const [expandedView, setExpandedView] = useState(null); // 'funnel', 'trends', 'map'

  // Get assistant state for analytics toggle
  const { state, dispatch } = useAssistantState();

  // Get organization
  const organization = getOrganization()?.organization;
  const orgId = organization?.id;

  // Fetch plugin status
  const { data: pluginStatusData } = useSWR(orgId ? `/api/plugin-status/${orgId}` : null, fetcher);
  const pluginStatus = {
    isInstalled: pluginStatusData?.isInstalled || false,
    websiteUrl: pluginStatusData?.installation?.websiteUrl,
  };

  // Handle analytics toggle
  const handleAnalyticsEnabledToggle = async checkedOrEvent => {
    const checked =
      typeof checkedOrEvent === 'boolean' ? checkedOrEvent : (checkedOrEvent?.target?.checked ?? checkedOrEvent);

    if (!state.organizationId || !state.assistantId) {
      console.error('Missing required data:', { organizationId: state.organizationId, assistantId: state.assistantId });
      toast.error('Unable to update - missing organization or assistant data');
      return;
    }

    dispatch({ type: 'UPDATE_FIELD', field: 'analyticsEnabled', value: checked });

    try {
      const response = await fetch(`/api/assistant-info/${state.organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistant_id: state.assistantId,
          analytics_enabled: checked,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error Response:', errorData);
        throw new Error(errorData?.message || 'Failed to update analytics status');
      }

      toast.success(checked ? 'Analytics enabled' : 'Analytics disabled');
    } catch (error) {
      console.error('Error updating analytics status:', error);
      toast.error(error.message || 'Failed to update analytics status');
      dispatch({ type: 'UPDATE_FIELD', field: 'analyticsEnabled', value: !checked });
    }
  };

  // Fetch unified summary (only if analytics is enabled)
  const { summary, isLoading, error } = useAnalyticsSummary(orgId, period, !!orgId && state.analyticsEnabled);

  // Period options
  const periodOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
  ];

  if (!orgId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50  transition-colors duration-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-xl text-gray-700 dark:text-gray-300">Organization not found</p>
            <p className="text-sm text-gray-600 dark:text-gray-500 mt-2">
              Please select an organization to view analytics
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 transition-colors duration-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-xl text-gray-700 dark:text-gray-300">Failed to load analytics</p>
            <p className="text-sm text-gray-600 dark:text-gray-500 mt-2">{error?.message || 'An error occurred'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br transition-colors duration-200 p-4 md:p-6">
      {/* Theme Toggle - Top Right */}
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Master Toggle Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <GlassCard>
            <div className=" backdrop-blur-xl   rounded-xl transition-colors duration-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      state.analyticsEnabled
                        ? 'bg-cyan-500/20 border border-cyan-500/30'
                        : 'bg-gray-500/10 border border-gray-500/20'
                    }`}
                  >
                    <Power className={`w-6 h-6 ${state.analyticsEnabled ? 'text-cyan-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Analytics Tracking</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {state.analyticsEnabled ? 'Tracking visitor journey' : 'Currently disabled'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full border ${
                      state.analyticsEnabled
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500 dark:border-green-500/30'
                        : 'bg-gray-200 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-400 dark:border-gray-500/30'
                    }`}
                  >
                    {state.analyticsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <ToggleSwitch checked={state.analyticsEnabled} onChange={handleAnalyticsEnabledToggle} />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Conditional Content */}
        {state.analyticsEnabled ? (
          <>
            {/* Plugin Not Connected Warning */}
            {!pluginStatus.isInstalled && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <PluginNotConnectedWarning websiteUrl={pluginStatus.websiteUrl} />
              </motion.div>
            )}

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Analytics Dashboard
                  </h1>
                  <p className="text-gray-700 dark:text-gray-400">Track your growth, traffic sources, and more</p>
                </div>

                {/* Period Selector and AI Report Button */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Conversion Config Button */}
                  <Button
                    onClick={() => setIsConversionConfigModalOpen(true)}
                    disabled={!orgId}
                    className={'flex items-center gap-4 '}
                  >
                    <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    <span className="hidden sm:inline">Configure Conversion</span>
                  </Button>

                  {/* Period Selector */}
                  <GlassCard>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 hidden sm:block" />
                      <div className="flex  transition-colors duration-200">
                        {periodOptions.map(option => (
                          <button
                            key={option.value}
                            onClick={() => setPeriod(option.value)}
                            className={`px-4 rounded-md text-sm font-medium transition-all ${
                              period === option.value
                                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </motion.div>

            {/* Hero Metrics */}
            <HeroMetrics metrics={summary?.hero_metrics} isLoading={isLoading} />

            {/* Conversion Funnel & Visitor Trends */}
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-[500px]">
              <ConversionFunnelChart
                organizationId={orgId}
                period={period}
                enabled={state.analyticsEnabled}
                onExpand={() => setExpandedView('funnel')}
                isCompact={true}
              />
              <VisitorTrendsSection
                trends={summary?.trends}
                isLoading={isLoading}
                onExpand={() => setExpandedView('trends')}
                isCompact={true}
              />
            </div>

            {/* Traffic Sources & Traffic Map */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 auto-rows-[500px]">
              <TrafficSourcesSection sources={summary?.traffic_sources} isLoading={isLoading} />

              <VisitorCountriesMap
                countries={summary?.top_countries}
                isLoading={isLoading}
                onExpand={() => setExpandedView('map')}
                isCompact={true}
              />
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8"
            >
              <Link
                href="/dashboard/analytics/journeys"
                className="relative overflow-hidden rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 backdrop-blur-xl border border-cyan-500/30 p-6 hover:border-cyan-400/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-cyan-500/20">
                    <Map className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      View Detailed Journeys
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Explore individual visitor sessions and paths
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/performance"
                className="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-xl border border-purple-500/30 p-6 hover:border-purple-400/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-500/20">
                    <AlertCircle className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Performance Dashboard
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Monitor errors, performance metrics, and system health
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Conversion Config Modal */}
            <Dialog
              isOpen={isConversionConfigModalOpen}
              onClose={() => setIsConversionConfigModalOpen(false)}
              title="Configure Conversion Tracking"
              className="max-w-2xl w-full bg-white/95 dark:bg-[#0a0e27]/95 backdrop-blur-xl border border-cyan-500/30 shadow-2xl"
              backdropColor="bg-black/70 backdrop-blur-sm"
            >
              <ConversionConfigForm organizationId={orgId} />
            </Dialog>

            {/* Expanded View Modals */}
            {/* Conversion Funnel Expanded */}
            <Dialog
              isOpen={expandedView === 'funnel'}
              onClose={() => setExpandedView(null)}
              title="Conversion Funnel - Detailed View"
              className="max-w-4xl w-full bg-white/95 dark:bg-[#0a0e27]/95 backdrop-blur-xl border border-purple-500/30 shadow-2xl"
              backdropColor="bg-black/70 backdrop-blur-sm"
            >
              <ConversionFunnelChart
                organizationId={orgId}
                period={period}
                enabled={state.analyticsEnabled}
                isCompact={false}
              />
            </Dialog>

            {/* Visitor Trends Expanded */}
            <Dialog
              isOpen={expandedView === 'trends'}
              onClose={() => setExpandedView(null)}
              title="Visitor Trends - Detailed View"
              className="max-w-4xl w-full bg-white/95 dark:bg-[#0a0e27]/95 backdrop-blur-xl border border-cyan-500/30 shadow-2xl"
              backdropColor="bg-black/70 backdrop-blur-sm"
            >
              <VisitorTrendsSection trends={summary?.trends} isLoading={isLoading} isCompact={false} />
            </Dialog>

            {/* Traffic Map Expanded */}
            <Dialog
              isOpen={expandedView === 'map'}
              onClose={() => setExpandedView(null)}
              title="Traffic Map - Detailed View"
              className="max-w-4xl w-full bg-white/95 dark:bg-[#0a0e27]/95 backdrop-blur-xl border border-cyan-500/30 shadow-2xl"
              backdropColor="bg-black/70 backdrop-blur-sm"
            >
              <VisitorCountriesMap
                countries={summary?.top_countries}
                isLoading={isLoading}
                isCompact={false}
                height="400px"
              />
            </Dialog>
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-500/10 border border-gray-500/20 flex items-center justify-center">
                <Power className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Analytics Disabled</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Enable analytics tracking to view visitor behavior, conversion metrics, and insights.
              </p>
              <button
                onClick={() => handleAnalyticsEnabledToggle(true)}
                className="px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg border border-cyan-500/30 transition-all font-medium"
              >
                Enable Analytics
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
