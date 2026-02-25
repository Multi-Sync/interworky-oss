'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, Activity, Power, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { getOrganization } from '@/_common/utils/localStorage';
import { useErrorsData } from './hooks/useErrorsData';
import { useErrorStats } from './hooks/useErrorStats';
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics';
import ErrorTrendsChart from './components/ErrorTrendsChart';
import ErrorList from './components/ErrorList';
import ErrorDetailsModal from './components/ErrorDetailsModal';
import CoreWebVitals from './components/CoreWebVitals';
import OptimizationOpportunities from './components/OptimizationOpportunities';
import useAssistantState from '@/_common/hooks/useAssistantState';
import ToggleSwitch from '@/app/components/ToggleSwitch';
import InfoLabel from '@/app/components/InfoTooltip';
import useSWR from 'swr';
import { fetcher } from '@/_common/utils/swrFetcher';
import toast from 'react-hot-toast';
import PluginNotConnectedWarning from '@/app/components/PluginNotConnectedWarning';
import { useSession } from 'next-auth/react';
import { useAutoFixToggle } from '@/_common/hooks/useAutoFixToggle';
import { useRouter } from 'next/navigation';
import { themeClasses, combineThemeClasses } from '@/_common/utils/themeUtils';
import ThemeToggle from '@/app/components/ThemeToggle';
import { GlassCard } from '@/app/components/ui/Glassmorphism';

// Performance metrics refresh interval (in milliseconds)
const METRICS_REFRESH_INTERVAL = 10000; // 10 seconds

export default function ErrorsContent() {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState('7d');
  const [selectedError, setSelectedError] = useState(null);
  const [performanceData, setPerformanceData] = useState({
    totalRenderTime: 0,
    apiResponseTime: 0,
    componentLoadTime: 0,
  });
  const [fixingErrorId, setFixingErrorId] = useState(null);

  // Section collapse/expand state with localStorage persistence
  const [sectionsCollapsed, setSectionsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('performanceSectionsCollapsed');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved section state:', e);
        }
      }
    }
    return {
      coreWebVitals: false,
      optimizationOpportunities: false,
      errorTrends: false,
      errorList: false,
    };
  });

  // Toggle section collapse and save to localStorage
  const toggleSection = section => {
    setSectionsCollapsed(prev => {
      const newState = {
        ...prev,
        [section]: !prev[section],
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('performanceSectionsCollapsed', JSON.stringify(newState));
      }
      return newState;
    });
  };

  // Get session for user email
  const { data: session } = useSession();

  // Get subscription status
  const hasAutoFixAccess = true; // OSS: All features available

  // Modal state for premium feature gate
  const [showAutoFixLockedModal, setShowAutoFixLockedModal] = useState(false);

  // Get assistant state for monitoring toggle
  const { state, dispatch, mutateAssistantData } = useAssistantState();

  // Get organization
  const organization = getOrganization()?.organization;
  const orgId = organization?.id;

  // Fetch organization version control for auto-fix status
  const {
    data: versionControl,
    error: versionControlError,
    mutate: mutateVersionControl,
  } = useSWR(orgId ? `/api/models/organization-version-control/${orgId}` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 10000, // Prevent duplicate requests within 10 seconds
    revalidateIfStale: false, // Don't auto-revalidate stale data
    shouldRetryOnError: false, // Don't retry on 404 (no GitHub installation)
    onError: error => {
      // Silently handle 404 - it just means GitHub is not connected yet
      if (error?.response?.status !== 404) {
        console.error('[VersionControl] Error fetching version control data:', error);
      }
    },
  });

  // Auto-fix toggle hook
  // Only initialize if versionControl data exists (GitHub is connected)
  const {
    autoFixEnabled,
    isLoading: isTogglingAutoFix,
    error: autoFixError,
    toggleAutoFix,
  } = useAutoFixToggle(orgId, versionControl?.data?.auto_fix_enabled || false);

  // Fetch GitHub connection status
  const { data: githubStatus, isLoading: isLoadingGitHub } = useSWR(
    orgId ? `/api/mcp/github/status?organization_id=${orgId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );
  const isGitHubConnected = githubStatus?.connected || false;

  // Fetch plugin status
  const { data: pluginStatusData } = useSWR(orgId ? `/api/plugin-status/${orgId}` : null, fetcher);
  const pluginStatus = {
    isInstalled: pluginStatusData?.isInstalled || false,
    websiteUrl: pluginStatusData?.installation?.websiteUrl,
  };

  // Handle monitoring toggle
  const handleMonitoringEnabledToggle = async checkedOrEvent => {
    const checked =
      typeof checkedOrEvent === 'boolean' ? checkedOrEvent : (checkedOrEvent?.target?.checked ?? checkedOrEvent);

    if (!state.organizationId || !state.assistantId) {
      console.error('Missing required data:', { organizationId: state.organizationId, assistantId: state.assistantId });
      toast.error('Unable to update - missing organization or assistant data');
      return;
    }

    // Optimistic update - update local state immediately
    dispatch({ type: 'UPDATE_FIELD', field: 'monitoringEnabled', value: checked });

    try {
      const response = await fetch(`/api/assistant-info/${state.organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitoring_enabled: checked,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error Response:', errorData);
        throw new Error(errorData?.message || 'Failed to update performance monitoring status');
      }

      // Revalidate SWR cache without refetching (keeps local state)
      await mutateAssistantData(
        currentData => ({
          ...currentData,
          monitoring_enabled: checked,
        }),
        { revalidate: false },
      );

      toast.success(checked ? 'Performance monitoring enabled' : 'Performance monitoring disabled');
    } catch (error) {
      console.error('Error updating performance monitoring status:', error);
      toast.error(error.message || 'Failed to update performance monitoring status');
      // Revert on error
      dispatch({ type: 'UPDATE_FIELD', field: 'monitoringEnabled', value: !checked });
    }
  };

  // Handle auto fix toggle (using useAutoFixToggle hook)
  const handleAutoFixToggle = async checkedOrEvent => {
    const checked =
      typeof checkedOrEvent === 'boolean' ? checkedOrEvent : (checkedOrEvent?.target?.checked ?? checkedOrEvent);

    if (!isGitHubConnected) {
      toast.error('Please connect GitHub first to enable Auto Fix');
      return;
    }

    // Check if user has subscription access when trying to enable
    if (checked && !hasAutoFixAccess) {
      setShowAutoFixLockedModal(true);
      return;
    }

    try {
      await toggleAutoFix(checked);

      // Manually update the SWR cache to reflect the new value (optimistic update)
      mutateVersionControl(
        currentData => ({
          ...currentData,
          auto_fix_enabled: checked,
        }),
        false, // Don't revalidate immediately
      );

      toast.success(checked ? 'Auto Fix enabled' : 'Auto Fix disabled');
    } catch (error) {
      // Error is already handled by the hook, just show the toast
      toast.error(autoFixError || 'Failed to update Auto Fix status');
    }
  };

  // Calculate date range based on time filter
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();

    switch (timeFilter) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [timeFilter]);

  // Track component load time
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      setPerformanceData(prev => ({
        ...prev,
        componentLoadTime: endTime - startTime,
      }));
    };
  }, []);

  // Fetch errors data with performance monitoring (only if monitoring is enabled)
  const {
    data: errorsData,
    pagination,
    isLoading: isLoadingErrors,
    error: errorsError,
    refetch: refetchErrors,
    performanceMetrics: errorsMetrics,
  } = useErrorsData({
    organizationId: orgId,
    startDate,
    endDate,
    limit: 100,
    enabled: !!orgId && state.monitoringEnabled,
  });

  // Fetch stats data with performance monitoring (only if monitoring is enabled)
  const {
    stats: statsData,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
    performanceMetrics: statsMetrics,
  } = useErrorStats({
    organizationId: orgId,
    startDate,
    endDate,
    recentLimit: 10,
    enabled: !!orgId && state.monitoringEnabled,
  });

  // Fetch performance metrics (Core Web Vitals, resource analysis)
  const {
    data: performanceMetricsData,
    isLoading: isLoadingMetrics,
    error: metricsError,
    lastUpdated: metricsLastUpdated,
    isRefreshing: isMetricsRefreshing,
    refetch: refetchMetrics,
  } = usePerformanceMetrics({
    organizationId: orgId,
    refreshInterval: METRICS_REFRESH_INTERVAL,
    enabled: !!orgId && state.monitoringEnabled,
  });

  // Track API response times
  useEffect(() => {
    if (errorsMetrics.lastFetchTime || statsMetrics.lastFetchTime) {
      const avgTime = (errorsMetrics.averageResponseTime || 0 + statsMetrics.averageResponseTime || 0) / 2;
      setPerformanceData(prev => ({
        ...prev,
        apiResponseTime: avgTime,
      }));
    }
  }, [errorsMetrics, statsMetrics]);

  // Deduplicate resource issues to ensure unique optimization opportunities
  // This prevents showing the same issue multiple times (e.g., same image with same optimization needed)
  // Deduplication key: URL + type combination (e.g., "logo.png-large_image")
  const deduplicatedMetricsData = useMemo(() => {
    if (!performanceMetricsData?.resource_issues) {
      return performanceMetricsData;
    }

    const rawIssues = performanceMetricsData.resource_issues;

    // Deduplicate based on URL + type combination
    // Example: If "logo.png" appears twice with type "large_image", only keep one instance
    const uniqueIssues = Array.from(
      new Map(rawIssues.map(issue => [`${issue.url || 'no-url'}-${issue.type}`, issue])).values(),
    );

    return {
      ...performanceMetricsData,
      resource_issues: uniqueIssues,
      resource_summary: {
        ...performanceMetricsData.resource_summary,
        total: uniqueIssues.length, // Update total to reflect deduplicated count
      },
    };
  }, [performanceMetricsData]);

  // Handle fix with Carla
  const handleFixWithCarla = async error => {
    if (!error?.id) return;

    setFixingErrorId(error.id);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/models/performance-monitoring/errors/${error.id}/fix-with-carla`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || errorData?.error || 'Failed to start Carla fix');
      }

      const data = await response.json();

      // Refetch errors to update status
      refetchErrors();

      // Show success message
      toast.success('Carla is analyzing the error and will create a PR or issue');
    } catch (error) {
      console.error('Failed to start Carla fix:', error);
      // Show error message
      toast.error(`Failed to start Carla fix: ${error.message}`);
    } finally {
      setFixingErrorId(null);
    }
  };

  // Handle resolve error
  const handleResolveError = async error => {
    if (!error?.id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/models/performance-monitoring/errors/${error.id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'resolved',
          resolved_by: session?.email || 'unknown',
          resolution_notes: 'Manually resolved via performance dashboard',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || errorData?.error || 'Failed to resolve error');
      }

      // Refetch both errors and stats to update list and resolved count
      refetchErrors();
      refetchStats();
    } catch (error) {
      console.error('Failed to resolve error:', error);
      throw error; // Re-throw so modal can handle it
    }
  };

  // Handle delete error
  const handleDeleteError = async error => {
    if (!error?.id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/models/performance-monitoring/errors/${error.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || errorData?.error || 'Failed to delete error');
      }

      // Refetch both errors and stats to update list and counts
      refetchErrors();
      refetchStats();
    } catch (error) {
      console.error('Failed to delete error:', error);
      throw error; // Re-throw so modal can handle it
    }
  };

  // Process trend data from errors
  const trendData = useMemo(() => {
    if (!errorsData || errorsData.length === 0) {
      // Return empty trend data
      const days = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 90;
      return Array.from({ length: days }, (_, i) => {
        const date = new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000);
        return {
          date: date.toISOString(),
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          total: 0,
        };
      });
    }

    // Group errors by day (using UTC to match how error list displays dates)
    const days = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 90;
    const dayGroups = {};

    // Initialize all days with zero counts (using UTC dates)
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000);
      // Use UTC date string for consistency (YYYY-MM-DD in UTC)
      const dateKey = date.toISOString().split('T')[0];
      dayGroups[dateKey] = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    }

    // Count errors by severity for each day (using UTC dates)
    errorsData.forEach(error => {
      // Convert error timestamp to UTC date string (YYYY-MM-DD in UTC)
      const errorDate = new Date(error.timestamp);
      const dateKey = errorDate.toISOString().split('T')[0];

      if (dayGroups[dateKey]) {
        const severity = error.severity || 'medium';
        // Ensure severity exists in dayGroups object
        if (dayGroups[dateKey][severity] !== undefined) {
          dayGroups[dateKey][severity]++;
        }
        dayGroups[dateKey].total++;
      }
    });

    // Convert to array format for chart
    return Object.entries(dayGroups)
      .map(([date, counts]) => ({
        // Convert YYYY-MM-DD back to ISO string for consistency
        date: new Date(date + 'T00:00:00Z').toISOString(),
        ...counts,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [errorsData, timeFilter]);

  // Calculate error stats for selected time range (matches time filter)
  const errorStats = useMemo(() => {
    // Ensure errorsData is an array (handle undefined/null case)
    const errors = errorsData || [];

    // Count all errors in the selected time range (7d/30d/90d)
    // errorsData is already filtered by the selected date range from the API
    const critical = errors.filter(e => e.severity?.toLowerCase() === 'critical').length;
    const high = errors.filter(e => e.severity?.toLowerCase() === 'high').length;
    const medium = errors.filter(e => e.severity?.toLowerCase() === 'medium').length;
    const low = errors.filter(e => e.severity?.toLowerCase() === 'low').length;

    return {
      total: errors.length,
      critical,
      high,
      medium,
      low,
    };
  }, [errorsData]);

  const isLoading = isLoadingErrors || isLoadingStats;

  // Helper function to get time range label
  const getTimeRangeLabel = () => {
    switch (timeFilter) {
      case '7d':
        return 'Last 7 days';
      case '30d':
        return 'Last 30 days';
      case '90d':
        return 'Last 90 days';
      default:
        return 'Last 7 days';
    }
  };

  return (
    <>
      <div className="relative min-h-screen bg-gradient-to-br  transition-colors duration-200 p-4 md:p-6">
        {/* Theme Toggle - Top Right */}
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Master Toggle Section */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <GlassCard accentColor="gray">
              {/* Performance Monitoring Toggle */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      state.monitoringEnabled
                        ? 'bg-red-500/20 border border-red-500/30'
                        : 'bg-gray-500/10 border border-gray-500/20'
                    }`}
                  >
                    <Power className={`w-6 h-6 ${state.monitoringEnabled ? 'text-red-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Performance Monitoring</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {state.monitoringEnabled ? 'Tracking errors and metrics' : 'Currently disabled'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full border ${
                      state.monitoringEnabled
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500 dark:border-green-500/30'
                        : 'bg-gray-200 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-400 dark:border-gray-500/30'
                    }`}
                  >
                    {state.monitoringEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <ToggleSwitch
                    id="monitoring-enabled-toggle"
                    checked={state.monitoringEnabled}
                    onChange={handleMonitoringEnabledToggle}
                  />
                </div>
              </div>

              {/* Auto Fix Toggle - Only show when monitoring is enabled */}
              {state.monitoringEnabled && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700/50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <InfoLabel
                        label="Auto Fix"
                        tooltipText="AI-powered automatic error fixing. Creates GitHub issues or pull requests when new errors are detected. Carla analyzes errors and generates fixes using AI. Requires GitHub connection and premium subscription."
                      />
                      {isLoadingGitHub ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full border border-blue-500/50 dark:border-blue-500/30 flex items-center gap-1.5">
                          <div className="animate-spin w-3 h-3 border-2 border-blue-700 dark:border-blue-400 border-t-transparent rounded-full" />
                          Checking GitHub...
                        </span>
                      ) : !isGitHubConnected ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-full border border-yellow-500/50 dark:border-yellow-500/30">
                            GitHub Required
                          </span>
                          <button
                            onClick={() => router.push('/onboarding/github')}
                            className="px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            Connect GitHub
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      {isTogglingAutoFix && (
                        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                      )}
                      {autoFixError && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full border border-red-500/50 dark:border-red-500/30">
                          Error: {autoFixError}
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${
                          autoFixEnabled
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500 dark:border-green-500/30'
                            : 'bg-gray-200 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-400 dark:border-gray-500/30'
                        }`}
                      >
                        {autoFixEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <ToggleSwitch
                        id="auto-fix-toggle"
                        checked={autoFixEnabled}
                        onChange={handleAutoFixToggle}
                        disabled={
                          !isGitHubConnected || isLoadingGitHub || isTogglingAutoFix || !state.monitoringEnabled
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Conditional Content: Show dashboard if enabled, message if disabled */}
          {state.monitoringEnabled ? (
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
                      Error Dashboard
                    </h1>
                    <p className="text-gray-700 dark:text-gray-400">Monitor and fix errors in real-time</p>
                  </div>

                  {/* Time Filter and Performance Metrics */}
                  <div className="flex flex-wrap items-center gap-3 ">
                    {/* Performance Metrics */}
                    <div className="flex items-center gap-2 text-xs bg-white/80 dark:bg-surface backdrop-blur-xl border border-green-500/30 dark:border-green-500/20 rounded-lg px-3 py-2">
                      <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <div className="text-gray-600 dark:text-gray-400 hidden sm:block ">
                        API:{' '}
                        <span className="text-green-600 dark:text-green-400 font-mono">
                          {errorsMetrics.averageResponseTime?.toFixed(0) || 0}ms
                        </span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 hidden sm:block ml-2">
                        Fetches:{' '}
                        <span className="text-blue-600 dark:text-blue-400 font-mono">
                          {errorsMetrics.fetchCount + statsMetrics.fetchCount}
                        </span>
                      </div>
                    </div>

                    {/* Time Filter */}
                    <div className="flex bg-white/80 dark:bg-surface backdrop-blur-xl border border-red-500/30 dark:border-red-500/20 rounded-lg p-1 transition-colors duration-200">
                      {['7d', '30d', '90d'].map(filter => (
                        <button
                          key={filter}
                          onClick={() => setTimeFilter(filter)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            timeFilter === filter
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          Last {filter === '7d' ? '7' : filter === '30d' ? '30' : '90'} days
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <GlassCard variant="compact" accentColor="gray" animated delay={0}>
                  <div className="text-gray-600 dark:text-gray-400 text-[10px] md:text-xs font-medium mb-1">
                    TOTAL ERRORS
                  </div>
                  <div className="text-base md:text-xl font-bold text-gray-900 dark:text-white">
                    {errorStats.total.toLocaleString()}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mt-1 hidden md:block">
                    {getTimeRangeLabel()}
                  </div>
                </GlassCard>

                <GlassCard variant="compact" accentColor="gray" animated delay={0.1}>
                  <div className="text-gray-600 dark:text-gray-400 text-[10px] md:text-xs font-medium mb-1">
                    CRITICAL
                  </div>
                  <div className="text-base md:text-xl font-bold text-gray-900 dark:text-white">
                    {errorStats.critical.toLocaleString()}
                  </div>
                  <div className="text-[10px] md:text-xs text-red-700 dark:text-red-400 mt-1 hidden lg:block">
                    Requires immediate action
                  </div>
                </GlassCard>

                <GlassCard variant="compact" accentColor="gray" animated delay={0.2}>
                  <div className="text-gray-600 dark:text-gray-400 text-[10px] md:text-xs font-medium mb-1">
                    HIGH PRIORITY
                  </div>
                  <div className="text-base md:text-xl font-bold text-gray-900 dark:text-white">
                    {errorStats.high.toLocaleString()}
                  </div>
                  <div className="text-[10px] md:text-xs text-orange-700 dark:text-orange-400 mt-1 hidden lg:block">
                    Fix this week
                  </div>
                </GlassCard>

                <GlassCard variant="compact" accentColor="gray" animated delay={0.3}>
                  <div className="text-gray-600 dark:text-gray-400 text-[10px] md:text-xs font-medium mb-1">
                    MEDIUM PRIORITY
                  </div>
                  <div className="text-base md:text-xl font-bold text-gray-900 dark:text-white">
                    {errorStats.medium.toLocaleString()}
                  </div>
                  <div className="text-[10px] md:text-xs text-yellow-700 dark:text-yellow-400 mt-1 hidden lg:block">
                    Fix this month
                  </div>
                </GlassCard>

                <GlassCard variant="compact" accentColor="gray" animated delay={0.4}>
                  <div className="text-gray-600 dark:text-gray-400 text-[10px] md:text-xs font-medium mb-1">
                    LOW PRIORITY
                  </div>
                  <div className="text-base md:text-xl font-bold text-gray-900 dark:text-white">
                    {errorStats.low.toLocaleString()}
                  </div>
                  <div className="text-[10px] md:text-xs text-green-700 dark:text-green-400 mt-1 hidden lg:block">
                    Minor issues
                  </div>
                </GlassCard>
              </div>

              {/* Core Web Vitals Section */}
              <GlassCard accentColor="gray">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="mb-4">
                    <h3 className="text-black dark:text-white font-bold text-base sm:text-lg mb-3">Core Web Vitals</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                      {metricsLastUpdated && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Updated {new Date(metricsLastUpdated).toLocaleTimeString()}
                        </span>
                      )}
                      <button
                        onClick={() => refetchMetrics()}
                        disabled={isLoadingMetrics || isMetricsRefreshing}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        title="Refresh now"
                        aria-label="Refresh metrics"
                      >
                        <RefreshCw
                          className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${isMetricsRefreshing || isLoadingMetrics ? 'animate-spin' : ''}`}
                        />
                      </button>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-900/30 border border-green-500/30 rounded-full">
                        <div
                          className={`w-2 h-2 rounded-full bg-green-500 ${isMetricsRefreshing ? 'animate-pulse' : ''}`}
                        />
                        <span className="text-xs font-medium text-green-700 dark:text-green-400 whitespace-nowrap">
                          LIVE • {METRICS_REFRESH_INTERVAL / 1000}s
                        </span>
                      </div>
                    </div>
                  </div>
                  <CoreWebVitals metricsData={performanceMetricsData} isLoading={isLoadingMetrics} />
                </motion.div>
              </GlassCard>
              {/* Optimization Opportunities Section */}
              <GlassCard accentColor="gray" animated delay={0.1} className="my-6">
                <div className="mb-4">
                  {/* Header Row - Mobile Responsive */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-gray-900 dark:text-white font-bold text-base sm:text-lg">
                        Optimization Opportunities
                      </h3>
                      {deduplicatedMetricsData?.resource_summary?.total > 0 && (
                        <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800">
                          {deduplicatedMetricsData.resource_summary.total}{' '}
                          {deduplicatedMetricsData.resource_summary.total === 1 ? 'issue' : 'issues'}
                        </span>
                      )}
                    </div>
                    {/* Show/Hide Button - Always Visible on Right */}
                    <button
                      onClick={() => toggleSection('optimizationOpportunities')}
                      className="min-w-[44px] min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-900/30 hover:bg-gray-200 dark:hover:bg-gray-900/50 text-gray-700 dark:text-gray-400 rounded-lg border border-gray-300 dark:border-gray-800 transition-all font-medium text-sm self-start sm:self-center touch-manipulation"
                      aria-label={
                        sectionsCollapsed.optimizationOpportunities
                          ? 'Show optimization opportunities'
                          : 'Hide optimization opportunities'
                      }
                    >
                      {sectionsCollapsed.optimizationOpportunities ? (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide
                        </>
                      )}
                    </button>
                  </div>
                  {/* Controls Row - Mobile: Wrap to new line */}
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    {metricsLastUpdated && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Updated {new Date(metricsLastUpdated).toLocaleTimeString()}
                      </span>
                    )}
                    <button
                      onClick={() => refetchMetrics()}
                      disabled={isLoadingMetrics || isMetricsRefreshing}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      title="Refresh now"
                      aria-label="Refresh metrics"
                    >
                      <RefreshCw
                        className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${isMetricsRefreshing || isLoadingMetrics ? 'animate-spin' : ''}`}
                      />
                    </button>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-900/30 border border-green-500/30 rounded-full">
                      <div
                        className={`w-2 h-2 rounded-full bg-green-500 ${isMetricsRefreshing ? 'animate-pulse' : ''}`}
                      />
                      <span className="text-xs font-medium text-green-700 dark:text-green-400 whitespace-nowrap">
                        LIVE • {METRICS_REFRESH_INTERVAL / 1000}s
                      </span>
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {!sectionsCollapsed.optimizationOpportunities && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <OptimizationOpportunities metricsData={deduplicatedMetricsData} isLoading={isLoadingMetrics} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>

              {/* Dashboard Content */}
              <div className="grid grid-cols-1 gap-6">
                {/* Error Trends Chart - Full Width */}
                <GlassCard accentColor="gray" animated>
                  <div className="mb-4">
                    <h3 className="text-gray-900 dark:text-white font-bold text-sm md:text-base flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Error Trends
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All dates shown in UTC</p>
                  </div>
                  <ErrorTrendsChart data={trendData} isLoading={isLoadingErrors} />
                </GlassCard>

                {/* Error List - Full Width */}
                <GlassCard accentColor="gray" animated delay={0.1}>
                  {/* Header with border bottom */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-800/50">
                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-gray-700 dark:text-gray-400 flex-shrink-0" />
                      <h3 className="text-gray-900 dark:text-white font-bold text-base sm:text-lg">
                        Error List (Grouped by similarity)
                      </h3>
                      {errorsData?.length > 0 && (
                        <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800">
                          {errorsData?.length || 0} errors
                        </span>
                      )}
                    </div>
                    {/* Show/Hide Button */}
                    <button
                      onClick={() => toggleSection('errorList')}
                      className="min-w-[44px] min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-900/30 hover:bg-gray-200 dark:hover:bg-gray-900/50 text-gray-700 dark:text-gray-400 rounded-lg border border-gray-300 dark:border-gray-800 transition-all font-medium text-sm self-start sm:self-center touch-manipulation"
                      aria-label={sectionsCollapsed.errorList ? 'Show error list' : 'Hide error list'}
                    >
                      {sectionsCollapsed.errorList ? (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide
                        </>
                      )}
                    </button>
                  </div>
                  <AnimatePresence>
                    {!sectionsCollapsed.errorList && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <ErrorList
                          errors={errorsData}
                          isLoading={isLoadingErrors}
                          onErrorClick={error => setSelectedError(error)}
                          onFixWithCarla={handleFixWithCarla}
                          autoFixEnabled={autoFixEnabled}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>

                {/* Performance Monitoring Panel */}
                <GlassCard accentColor="gray" animated delay={0.2}>
                  <h3 className="text-gray-900 dark:text-white font-bold text-sm md:text-base mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Errors API Performance */}
                    <GlassCard accentColor="gray">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Errors API</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-500">Last Fetch:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-400 font-mono">
                            {errorsMetrics.lastFetchTime?.toFixed(0) || 0}ms
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-500">Average:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-400 font-mono">
                            {errorsMetrics.averageResponseTime?.toFixed(0) || 0}ms
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-500">Total Fetches:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-400 font-mono">
                            {errorsMetrics.fetchCount}
                          </span>
                        </div>
                      </div>
                    </GlassCard>

                    {/* Stats API Performance */}
                    <GlassCard accentColor="gray">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Stats API</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-500">Last Fetch:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-400 font-mono">
                            {statsMetrics.lastFetchTime?.toFixed(0) || 0}ms
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-500">Average:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-400 font-mono">
                            {statsMetrics.averageResponseTime?.toFixed(0) || 0}ms
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-500">Total Fetches:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-400 font-mono">
                            {statsMetrics.fetchCount}
                          </span>
                        </div>
                      </div>
                    </GlassCard>

                    {/* Component Performance */}
                    <GlassCard accentColor="gray">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Component</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-500">Load Time:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-400 font-mono">
                            {performanceData.componentLoadTime?.toFixed(0) || 0}ms
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-500">API Response:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-400 font-mono">
                            {performanceData.apiResponseTime?.toFixed(0) || 0}ms
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-500">Total Errors:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-400 font-mono">
                            {errorsData?.length || 0}
                          </span>
                        </div>
                      </div>
                    </GlassCard>
                  </div>

                  {/* Error/Success Message */}
                  {(errorsError || statsError) && (
                    <div className="mt-4 bg-red-100 dark:bg-red-500/10 border border-red-400 dark:border-red-500/20 rounded-lg p-3">
                      <div className="text-xs text-red-700 dark:text-red-400">
                        <div className="font-bold mb-1">API Error:</div>
                        <div>{errorsError || statsError}</div>
                      </div>
                    </div>
                  )}

                  {!isLoading && !errorsError && !statsError && (
                    <div className="mt-4 bg-green-100 dark:bg-green-500/10 border border-green-400 dark:border-green-500/20 rounded-lg p-3">
                      <div className="text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-700 dark:bg-green-400 rounded-full animate-pulse"></div>
                        <span>All systems operational • Data loaded successfully</span>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Error Details Modal */}
              <ErrorDetailsModal
                error={selectedError}
                isOpen={!!selectedError}
                onClose={() => setSelectedError(null)}
                onFixWithCarla={handleFixWithCarla}
                onResolveError={handleResolveError}
                onDeleteError={handleDeleteError}
                autoFixEnabled={autoFixEnabled}
              />
            </>
          ) : (
            /* Disabled State Message */
            <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-500/10 border border-gray-500/20 flex items-center justify-center">
                  <Power className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Performance Monitoring Disabled
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Enable performance monitoring to track widget performance metrics and errors. This helps identify and
                  fix issues quickly.
                </p>
                <button
                  onClick={() => handleMonitoringEnabledToggle(true)}
                  className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg border border-red-500/30 transition-all font-medium"
                >
                  Enable Monitoring
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </>
  );
}
