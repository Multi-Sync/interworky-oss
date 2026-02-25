'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import useSWR from 'swr';
import { fetcher } from '@/_common/utils/swrFetcher';
import { Button } from '../../components/ui/Button';
import UserInfoModal from '../../components/UserInfoModal';
import { getOrganization } from '@/_common/utils/localStorage';
import OnboardingCTA from '../../components/Dashboard/OnboardingCTA';
import GitHubOptionalCard from '../../components/Dashboard/GitHubOptionalCard';
import useAssistantState from '@/_common/hooks/useAssistantState';
import toast from 'react-hot-toast';
import WebsiteEntryModal from '../../components/Dashboard/WebsiteEntryModal';
import ThemeToggle from '../../components/ThemeToggle';
import { themeClasses, combineThemeClasses, useThemeIconColor } from '@/_common/utils/themeUtils';
import { useTheme } from '@/context/ThemeContext';
import { useNotification } from '@/_common/utils/handleSlackNotification';

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const router = useRouter();
  const { isDark } = useTheme();
  const { handleNotification } = useNotification();
  const hasTrackedConversion = useRef(false);

  // Theme-aware icon color
  const iconStrokeColor = useThemeIconColor({ isActive: false });

  // Theme-aware skeleton colors
  const skeletonBaseColor = isDark ? '#1a1f3a' : '#e5e7eb';
  const skeletonHighlightColor = isDark ? '#2a2f4a' : '#f3f4f6';

  // Get assistant state for module status
  const { state: assistantState, isLoadingAssistantData } = useAssistantState();

  // OSS: All features always available
  const hasCXAccess = true;

  // Get organization ID for SWR key
  const organization = getOrganization()?.organization;
  const orgId = organization?.id;

  // Use SWR for plugin status
  const {
    data: pluginStatusData,
    error: pluginStatusError,
    isLoading: isLoadingPluginStatus,
    mutate: mutatePluginStatus,
  } = useSWR(orgId ? `/api/plugin-status/${orgId}` : null, fetcher);

  // Transform SWR data to match existing component expectations
  const pluginStatus = {
    isInstalled: pluginStatusData?.isInstalled || false,
    isResponding: pluginStatusData?.isResponding || false,
    loading: isLoadingPluginStatus,
    websiteUrl: pluginStatusData?.installation?.websiteUrl,
    lastHeartbeat: pluginStatusData?.lastHeartbeat,
  };

  useEffect(() => {
    // Simulate loading for a brief moment
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Check for GitHub connection success
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('github') === 'connected') {
      const repo = params.get('repo');
      toast.success(repo ? `GitHub connected successfully! Repository: ${repo}` : 'GitHub connected successfully!', {
        duration: 5000,
        icon: '✅',
      });
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/home');
    }
  }, []);

  // Track conversion for users coming from /new flow
  useEffect(() => {
    if (hasTrackedConversion.current) return;
    if (typeof window === 'undefined') return;

    // Check if user came from /new flow (password was set after /new journey)
    const newFlowPasswordSet = sessionStorage.getItem('newFlowPasswordSet');
    const pendingSyncData = sessionStorage.getItem('pendingSync');

    if (newFlowPasswordSet && pendingSyncData) {
      try {
        const { domain } = JSON.parse(pendingSyncData);
        handleNotification(`[/new → Dashboard] 🎉 CONVERSION COMPLETE: ${domain} landed on dashboard`);
        hasTrackedConversion.current = true;

        // Clean up /new flow session data
        sessionStorage.removeItem('newFlowPasswordSet');
        sessionStorage.removeItem('pendingSync');
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [handleNotification]);

  const getQuickActionIcon = path => {
    const icons = {
      '/dashboard/tutorial': (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconStrokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-puzzle"
        >
          <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
        </svg>
      ),
      '/dashboard/assistantInfo': (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconStrokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-palette"
        >
          <circle cx="13.5" cy="6.5" r=".5" />
          <circle cx="17.5" cy="10.5" r=".5" />
          <circle cx="8.5" cy="7.5" r=".5" />
          <circle cx="6.5" cy="12.5" r=".5" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
      ),
      '/dashboard/patients': (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconStrokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-users"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="m22 21-2-2a4 4 0 0 0-3-3" />
          <circle cx="16" cy="7" r="1" />
        </svg>
      ),
      '/dashboard/appointments': (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconStrokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-calendar"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      ),
      '/dashboard/analytics': (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconStrokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-bar-chart-3"
        >
          <path d="M3 3v18h18" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      ),
      '/dashboard/analytics/flow?view=logs': (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconStrokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-activity"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      '/dashboard/performance-monitoring': (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconStrokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-activity"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      '/dashboard/performance': (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconStrokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-gauge"
        >
          <path d="m12 14 4-4" />
          <path d="M3.34 19a10 10 0 1 1 17.32 0" />
        </svg>
      ),
      '/dashboard/settings': (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconStrokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-settings"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      '/dashboard/customer-support': (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconStrokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-headset"
        >
          <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
          <path d="M21 16v2a4 4 0 0 1-4 4h-5" />
        </svg>
      ),
      'https://carla.interworky.com': (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconStrokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    };
    return icons[path];
  };

  const quickActions = [
    { name: 'Plugin Integration', path: '/dashboard/tutorial' },
    { name: 'Performance', path: '/dashboard/performance' },
    { name: 'Analytics', path: '/dashboard/analytics' },
    { name: 'Chat Widget', path: '/dashboard/customer-support' },
    { name: 'Settings', path: '/dashboard/settings' },
    { name: 'Documentation', path: 'https://carla.interworky.com', external: true },
  ];

  // Helper function to get module status configuration
  const getModuleStatus = (isEnabled, moduleName, enablePath, requiresTrial = false, hasTrialAccess = true) => {
    // If feature requires trial but user doesn't have access, show locked state
    if (isEnabled) {
      return {
        label: 'Active',
        color: 'green',
        borderColor: 'border-green-500/20',
        bgColor: 'bg-green-500/10',
        iconColor: 'text-green-500',
        textColor: 'text-green-400',
        pulseColor: 'bg-green-500',
        description: 'Module is enabled and running',
        showButton: false,
        isLocked: false,
      };
    } else {
      return {
        label: 'Inactive',
        color: 'gray',
        borderColor: 'border-gray-500/20',
        bgColor: 'bg-gray-500/10',
        iconColor: 'text-gray-500',
        textColor: 'text-gray-400',
        pulseColor: 'bg-gray-500',
        description: 'Module is disabled',
        showButton: true,
        buttonText: 'Enable',
        buttonPath: enablePath,
        isLocked: false,
      };
    }
  };

  const handleQuickAction = (path, external) => {
    if (external) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      router.push(path);
    }
  };

  return (
    <div className={combineThemeClasses('min-h-screen p-4 transition-colors duration-200', themeClasses.bg.app)}>
      {/* Theme Toggle - Top Right */}
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div
            className={combineThemeClasses(
              'p-6 rounded-lg shadow-sm transition-colors duration-200',
              themeClasses.bg.surface,
              themeClasses.border.default,
              'border',
            )}
          >
            <Skeleton
              height={40}
              width={300}
              baseColor={skeletonBaseColor}
              highlightColor={skeletonHighlightColor}
              className="mb-4"
            />
            <Skeleton
              height={20}
              width={200}
              baseColor={skeletonBaseColor}
              highlightColor={skeletonHighlightColor}
              className="mb-2"
            />
            <Skeleton
              height={20}
              width={150}
              baseColor={skeletonBaseColor}
              highlightColor={skeletonHighlightColor}
              className="mb-4"
            />
            <Skeleton height={100} width="100%" baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
          </div>

          <div className="md:grid-cols-2 lg:grid-cols-3 grid grid-cols-1 gap-6">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={combineThemeClasses(
                  'p-6 rounded-lg shadow-sm transition-colors duration-200',
                  themeClasses.bg.surface,
                  themeClasses.border.default,
                  'border',
                )}
              >
                <Skeleton
                  height={30}
                  width={150}
                  baseColor={skeletonBaseColor}
                  highlightColor={skeletonHighlightColor}
                  className="mb-4"
                />
                <Skeleton
                  height={60}
                  width="100%"
                  baseColor={skeletonBaseColor}
                  highlightColor={skeletonHighlightColor}
                />
              </div>
            ))}
          </div>

          <div
            className={combineThemeClasses(
              'p-6 rounded-lg shadow-sm transition-colors duration-200',
              themeClasses.bg.surface,
              themeClasses.border.default,
              'border',
            )}
          >
            <Skeleton
              height={30}
              width={200}
              baseColor={skeletonBaseColor}
              highlightColor={skeletonHighlightColor}
              className="mb-4"
            />
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton
                  key={i}
                  height={20}
                  width="100%"
                  baseColor={skeletonBaseColor}
                  highlightColor={skeletonHighlightColor}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Onboarding CTA - Shows based on completion status */}
      <OnboardingCTA pluginStatus={pluginStatus} />

      {/* Module Status Section */}
      <div className="mt-6">
        {/* Always show modules - blur if plugin not installed */}
        <div
          className={combineThemeClasses(
            'relative p-6 rounded-lg shadow-sm transition-colors duration-200',
            themeClasses.bg.surface,
            themeClasses.border.default,
            'border',
          )}
        >
          {/* Blur overlay when plugin not installed */}
          {!pluginStatus.isInstalled && (
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-gray-50/60 via-gray-100/80 to-gray-200/95 dark:from-[#0a0e27]/60 dark:via-[#0a0e27]/80 dark:to-[#0a0e27]/95 backdrop-blur-md rounded-lg flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 mx-auto text-primary animate-pulse"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className={combineThemeClasses('text-2xl font-bold mb-3', themeClasses.text.primary)}>
                  Unlock Modules
                </h3>
                <p className={combineThemeClasses('mb-6', themeClasses.text.secondary)}>
                  Complete the plugin integration to access Analytics, Performance Monitoring, and Chat Widget modules
                </p>
                <button
                  onClick={() => router.push('/dashboard/tutorial')}
                  className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors flex items-center gap-2 mx-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Complete Integration
                </button>
              </div>
            </div>
          )}

          <h2 className={combineThemeClasses('mb-4 text-xl font-bold', themeClasses.text.primary)}>Modules Status</h2>
          {isLoadingAssistantData ? (
            // Loading skeleton for 3-column grid
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={combineThemeClasses(
                    'relative overflow-hidden rounded-lg p-5 transition-colors duration-200',
                    themeClasses.bg.surfaceElevated,
                    themeClasses.border.subtle,
                    'border',
                  )}
                >
                  <Skeleton height={80} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Chat Widget Status */}
              {(() => {
                const status = getModuleStatus(
                  assistantState.cxEnabled,
                  'Chat Widget',
                  '/dashboard/customer-support',
                  true, // requiresTrial
                  hasCXAccess, // hasTrialAccess
                );
                return (
                  <div
                    className={combineThemeClasses(
                      'relative overflow-hidden rounded-lg p-5 transition-colors duration-200',
                      themeClasses.bg.surfaceElevated,
                      'border',
                      status.borderColor,
                    )}
                  >
                    {/* Lock badge */}
                    {status.isLocked && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 bg-yellow-600 text-white text-xs font-bold rounded flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          TRIAL
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={combineThemeClasses('text-sm font-medium mb-2', themeClasses.text.secondary)}>
                          Chat Widget
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <p className={`text-lg font-bold ${status.textColor}`}>{status.label}</p>
                        </div>
                        <div
                          className={combineThemeClasses('flex items-center gap-1 text-xs', themeClasses.text.tertiary)}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={
                                assistantState.cxEnabled
                                  ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                  : 'M6 18L18 6M6 6l12 12'
                              }
                            />
                          </svg>
                          <span>{status.description}</span>
                        </div>
                        {status.helpText && <p className="text-xs text-gray-500 mb-3 pl-4">{status.helpText}</p>}
                        {status.showButton && (
                          <button
                            onClick={() => router.push(status.buttonPath)}
                            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
                          >
                            {status.buttonText}
                          </button>
                        )}
                      </div>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${status.bgColor} border ${status.borderColor}`}
                      >
                        <svg
                          className={`w-6 h-6 ${status.iconColor}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"
                          />
                          <path d="M21 16v2a4 4 0 0 1-4 4h-5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Analytics Status */}
              {(() => {
                const status = getModuleStatus(assistantState.analyticsEnabled, 'Analytics', '/dashboard/analytics');
                return (
                  <div
                    className={combineThemeClasses(
                      'relative overflow-hidden rounded-lg p-5 transition-colors duration-200',
                      themeClasses.bg.surfaceElevated,
                      'border',
                      status.borderColor,
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={combineThemeClasses('text-sm font-medium mb-2', themeClasses.text.secondary)}>
                          Analytics
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <p className={`text-lg font-bold ${status.textColor}`}>{status.label}</p>
                        </div>
                        <div
                          className={combineThemeClasses('flex items-center gap-1 text-xs', themeClasses.text.tertiary)}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={
                                assistantState.analyticsEnabled
                                  ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                                  : 'M6 18L18 6M6 6l12 12'
                              }
                            />
                          </svg>
                          <span>{status.description}</span>
                        </div>
                        {status.showButton && (
                          <button
                            onClick={() => router.push(status.buttonPath)}
                            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
                          >
                            {status.buttonText}
                          </button>
                        )}
                      </div>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${status.bgColor} border ${status.borderColor}`}
                      >
                        <svg
                          className={`w-6 h-6 ${status.iconColor}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
                          <path d="M18 17V9" />
                          <path d="M13 17V5" />
                          <path d="M8 17v-3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Performance Monitoring Status */}
              {(() => {
                const status = getModuleStatus(
                  assistantState.monitoringEnabled,
                  'Performance Monitoring',
                  '/dashboard/performance',
                );
                return (
                  <div
                    className={combineThemeClasses(
                      'relative overflow-hidden rounded-lg p-5 transition-colors duration-200',
                      themeClasses.bg.surfaceElevated,
                      'border',
                      status.borderColor,
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={combineThemeClasses('text-sm font-medium mb-2', themeClasses.text.secondary)}>
                          Performance Monitoring
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <p className={`text-lg font-bold ${status.textColor}`}>{status.label}</p>
                        </div>
                        <div
                          className={combineThemeClasses('flex items-center gap-1 text-xs', themeClasses.text.tertiary)}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={
                                assistantState.monitoringEnabled ? 'M22 12h-4l-3 9L9 3l-3 9H2' : 'M6 18L18 6M6 6l12 12'
                              }
                            />
                          </svg>
                          <span>{status.description}</span>
                        </div>
                        {status.showButton && (
                          <button
                            onClick={() => router.push(status.buttonPath)}
                            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
                          >
                            {status.buttonText}
                          </button>
                        )}
                      </div>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${status.bgColor} border ${status.borderColor}`}
                      >
                        <svg
                          className={`w-6 h-6 ${status.iconColor}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M22 12h-4l-3 9L9 3l-3 9H2"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* System Status Section - Enhanced */}
      <div
        className={combineThemeClasses(
          'mt-6 p-6 rounded-lg shadow-sm transition-colors duration-200',
          themeClasses.bg.surface,
          themeClasses.border.default,
          'border',
        )}
      >
        <h2 className={combineThemeClasses('mb-4 text-xl font-bold', themeClasses.text.primary)}>System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Plugin Status */}
          <div
            className={`relative overflow-hidden rounded-lg p-5 border transition-all duration-200 ${
              pluginStatus.loading
                ? combineThemeClasses(themeClasses.bg.surface, themeClasses.border.default)
                : pluginStatus.isInstalled && pluginStatus.isResponding
                  ? combineThemeClasses(themeClasses.bg.surfaceElevated, 'border-green-500/30')
                  : pluginStatus.isInstalled
                    ? combineThemeClasses(themeClasses.bg.surfaceElevated, 'border-yellow-500/30')
                    : combineThemeClasses(themeClasses.bg.surface, themeClasses.border.default)
            }`}
          >
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className={combineThemeClasses('text-sm font-medium mb-2', themeClasses.text.secondary)}>
                  Plugin Status
                </p>
                <div className="flex items-center gap-2 mb-3">
                  {pluginStatus.loading ? (
                    <Skeleton
                      width={100}
                      height={20}
                      baseColor={skeletonBaseColor}
                      highlightColor={skeletonHighlightColor}
                    />
                  ) : (
                    <>
                      <p
                        className={`text-lg font-bold ${
                          pluginStatus.isInstalled && pluginStatus.isResponding
                            ? 'text-green-400'
                            : pluginStatus.isInstalled
                              ? 'text-yellow-400'
                              : 'text-gray-400'
                        }`}
                      >
                        {pluginStatus.isInstalled && pluginStatus.isResponding
                          ? 'Connected'
                          : pluginStatus.isInstalled
                            ? 'Installed'
                            : 'Not Installed'}
                      </p>
                    </>
                  )}
                </div>
                {!pluginStatus.loading && pluginStatus.lastHeartbeat && (
                  <div className={combineThemeClasses('flex items-center gap-1 text-xs', themeClasses.text.tertiary)}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Last seen: {new Date(pluginStatus.lastHeartbeat).toLocaleString()}</span>
                  </div>
                )}
                {!pluginStatus.loading && pluginStatus.websiteUrl && (
                  <div
                    className={combineThemeClasses('flex items-center gap-1 text-xs mt-1', themeClasses.text.tertiary)}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                    <span className="truncate">{pluginStatus.websiteUrl}</span>
                  </div>
                )}
                {!pluginStatus.loading && pluginStatus.isInstalled && pluginStatus.isResponding && (
                  <button
                    onClick={() => setShowWebsiteModal(true)}
                    className="mt-3 px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Update URL
                  </button>
                )}
              </div>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                  pluginStatus.loading
                    ? 'bg-surface-elevated border-border-subtle'
                    : pluginStatus.isInstalled && pluginStatus.isResponding
                      ? 'bg-green-500/10 border-green-500/30'
                      : pluginStatus.isInstalled
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-surface-elevated border-border-subtle'
                }`}
              >
                <svg
                  className={`w-6 h-6 ${
                    pluginStatus.loading
                      ? 'text-gray-400'
                      : pluginStatus.isInstalled && pluginStatus.isResponding
                        ? 'text-green-500'
                        : pluginStatus.isInstalled
                          ? 'text-yellow-500'
                          : 'text-gray-500'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* API Health */}
          <div
            className={combineThemeClasses(
              'relative overflow-hidden rounded-lg p-5 transition-colors duration-200 border border-green-500/20',
              themeClasses.bg.surfaceElevated,
            )}
          >
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className={combineThemeClasses('text-sm font-medium mb-2', themeClasses.text.secondary)}>
                  API Health
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-lg font-bold text-green-400">Operational</p>
                </div>
                <div className={combineThemeClasses('flex items-center gap-1 text-xs', themeClasses.text.tertiary)}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>All systems operational</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500/10 border border-green-500/30">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Response Time */}
          <div
            className={combineThemeClasses(
              'relative overflow-hidden rounded-lg p-5 transition-colors duration-200',
              themeClasses.bg.surfaceElevated,
              themeClasses.border.default,
              'border',
            )}
          >
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className={combineThemeClasses('text-sm font-medium mb-2', themeClasses.text.secondary)}>
                  Avg Response Time
                </p>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-2xl font-bold text-cyan-400">~2.3s</p>
                  <span className="text-xs text-green-400">-12%</span>
                </div>
                <div className={combineThemeClasses('flex items-center gap-1 text-xs', themeClasses.text.tertiary)}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  <span>Improved from last week</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500/10 border border-blue-500/30">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Optional Enhancement Card */}
      <GitHubOptionalCard />

      {/* Quick Actions Section */}
      <div
        className={combineThemeClasses(
          'p-6 mt-6 rounded-lg shadow-sm transition-colors duration-200',
          themeClasses.bg.surface,
          themeClasses.border.default,
          'border',
        )}
      >
        <h2 className={combineThemeClasses('mb-4 text-xl font-bold', themeClasses.text.primary)}>Quick Actions</h2>
        <div className="md:grid-cols-3 lg:grid-cols-7 grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              intent="secondary"
              size="small"
              className="flex flex-col items-center h-auto p-3 space-y-2"
              onClick={() => handleQuickAction(action.path, action.external)}
            >
              <div className="flex items-center justify-center">{getQuickActionIcon(action.path)}</div>
              <span className="text-xs font-medium">{action.name}</span>
            </Button>
          ))}
        </div>
      </div>

      <UserInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionType="hire"
        source="dashboard_call"
      />

      <WebsiteEntryModal
        isOpen={showWebsiteModal}
        onClose={() => setShowWebsiteModal(false)}
        initialUrl={pluginStatus.websiteUrl || ''}
        onSuccess={newUrl => {
          // Refresh plugin status to show updated URL
          mutatePluginStatus();
          setShowWebsiteModal(false);
        }}
      />
    </div>
  );
};

export default HomePage;
