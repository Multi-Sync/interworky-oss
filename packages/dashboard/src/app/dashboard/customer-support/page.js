'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, GlassButton, GlassBadge, ParticleBackground } from '@/app/components/ui/Glassmorphism';
import { Power, Settings, MessageCircle, TrendingUp } from 'lucide-react';
import ToggleSwitch from '@/app/components/ToggleSwitch';
import useAssistantState from '@/_common/hooks/useAssistantState';
import Skeleton from 'react-loading-skeleton';
import { getOrganization } from '@/_common/utils/localStorage';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import { fetcher } from '@/_common/utils/swrFetcher';
import PluginNotConnectedWarning from '@/app/components/PluginNotConnectedWarning';
import { themeClasses, combineThemeClasses } from '@/_common/utils/themeUtils';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/app/components/ThemeToggle';

export default function CustomerSupportHub() {
  const router = useRouter();
  const { state, dispatch, isLoadingAssistantData } = useAssistantState();
  const hasCXAccess = true; // OSS: All features available
  const { isDark } = useTheme();
  const [stats, setStats] = useState({
    conversationsToday: 0,
    totalConversations: 0,
    avgResponseTime: '0',
  });
  const [recentInteractions, setRecentInteractions] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Theme-aware skeleton colors
  const skeletonBaseColor = isDark ? '#1a1f3a' : '#e5e7eb';
  const skeletonHighlightColor = isDark ? '#2a2f4a' : '#f3f4f6';

  // Get organization
  const organization = getOrganization()?.organization;
  const orgId = organization?.id;

  // Fetch plugin status
  const { data: pluginStatusData } = useSWR(orgId ? `/api/plugin-status/${orgId}` : null, fetcher);
  const pluginStatus = {
    isInstalled: pluginStatusData?.isInstalled || false,
    websiteUrl: pluginStatusData?.installation?.websiteUrl,
  };

  // Fetch conversations and calculate real stats
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        if (!orgId) return;

        // Fetch all conversations
        const response = await fetch(`/api/models/conversations/organization/${orgId}?skip=0&limit=10000`);
        if (response.ok) {
          const data = await response.json();
          const conversations = data.conversations || [];

          // Calculate conversations today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const conversationsToday = conversations.filter(conv => {
            const convDate = new Date(conv.createdAt || conv.created_at);
            convDate.setHours(0, 0, 0, 0);
            return convDate.getTime() === today.getTime();
          }).length;

          // Total conversations (all time)
          const totalConversations = conversations.length;

          // Calculate average response time (in minutes)
          let totalResponseTime = 0;
          let conversationsWithMessages = 0;

          conversations.forEach(conv => {
            if (conv.messages && conv.messages.length >= 2) {
              // Find first user message and first assistant response
              const firstUserMsg = conv.messages.find(m => m.role === 'user');
              const firstAssistantMsg = conv.messages.find(m => m.role === 'assistant');

              if (firstUserMsg && firstAssistantMsg) {
                const userTime = new Date(firstUserMsg.timestamp || firstUserMsg.createdAt);
                const assistantTime = new Date(firstAssistantMsg.timestamp || firstAssistantMsg.createdAt);
                const diffMinutes = (assistantTime - userTime) / (1000 * 60);

                if (diffMinutes > 0 && diffMinutes < 60) {
                  // Only count reasonable response times (< 1 hour)
                  totalResponseTime += diffMinutes;
                  conversationsWithMessages++;
                }
              }
            }
          });

          const avgResponseTime =
            conversationsWithMessages > 0 ? (totalResponseTime / conversationsWithMessages).toFixed(2) : '0';

          setStats({
            conversationsToday,
            totalConversations,
            avgResponseTime,
          });

          // Extract recent interactions (last 5 conversations with latest user message)
          const recent = conversations
            .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
            .slice(0, 5)
            .map(conv => {
              // Get the last user message
              const lastUserMsg = conv.messages?.filter(m => m.role === 'user').pop();
              const messageText = lastUserMsg?.content?.substring(0, 60) || 'New conversation';

              // Format time
              const convDate = new Date(conv.createdAt || conv.created_at);
              const now = new Date();
              const diffMinutes = Math.floor((now - convDate) / (1000 * 60));

              let timeStr;
              if (diffMinutes < 1) timeStr = 'Just now';
              else if (diffMinutes < 60) timeStr = `${diffMinutes} min ago`;
              else if (diffMinutes < 1440)
                timeStr = `${Math.floor(diffMinutes / 60)} hour${Math.floor(diffMinutes / 60) > 1 ? 's' : ''} ago`;
              else
                timeStr = `${Math.floor(diffMinutes / 1440)} day${Math.floor(diffMinutes / 1440) > 1 ? 's' : ''} ago`;

              return {
                message: messageText,
                status: conv.status || 'active',
                time: timeStr,
              };
            });

          setRecentInteractions(recent);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (!isLoadingAssistantData && orgId) {
      fetchConversations();
    }
  }, [isLoadingAssistantData, orgId]);

  const handleCxEnabledToggle = async checkedOrEvent => {
    const checked =
      typeof checkedOrEvent === 'boolean' ? checkedOrEvent : (checkedOrEvent?.target?.checked ?? checkedOrEvent);

    if (!state.organizationId || !state.assistantId) {
      console.error('Missing required data:', { organizationId: state.organizationId, assistantId: state.assistantId });
      toast.error('Unable to update - missing organization or assistant data');
      return;
    }

    dispatch({ type: 'UPDATE_FIELD', field: 'cxEnabled', value: checked });

    try {
      const response = await fetch(`/api/assistant-info/${state.organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistant_id: state.assistantId,
          cx_enabled: checked,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error Response:', errorData);
        throw new Error(errorData?.message || 'Failed to update customer support status');
      }

      toast.success(checked ? 'Customer support module enabled' : 'Customer support module disabled');
    } catch (error) {
      console.error('Error updating customer support status:', error);
      toast.error(error.message || 'Failed to update customer support status');
      dispatch({ type: 'UPDATE_FIELD', field: 'cxEnabled', value: !checked });
    }
  };

  if (isLoadingAssistantData) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton height={100} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
        <Skeleton height={150} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
        <Skeleton height={200} count={2} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
      </div>
    );
  }

  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 bg-app-bg-light dark:bg-app-bg -z-10 transition-colors duration-200">
        <ParticleBackground particleCount={30} color="gray" />
      </div>

      <div className="relative min-h-screen pb-20">
        {/* Theme Toggle - Top Right */}
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Card */}
          <GlassCard variant="content" accentColor="gray" delay={0}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className={combineThemeClasses('text-2xl font-bold', themeClasses.text.primary)}>Chat Widget</h1>
                <p className={combineThemeClasses('text-sm mt-1', themeClasses.text.secondary)}>
                  Manage Carla AI chat widget on your website
                </p>
              </div>
              <GlassBadge variant={state.cxEnabled ? 'success' : 'warning'} pulse={state.cxEnabled}>
                {state.cxEnabled ? 'Enabled' : 'Disabled'}
              </GlassBadge>
            </div>
          </GlassCard>

          {/* Master Toggle */}
          <GlassCard variant="content" accentColor="gray" delay={0.1}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    state.cxEnabled
                      ? 'bg-surface-elevated-light dark:bg-surface-elevated border border-border-default-light dark:border-border-default'
                      : 'bg-gray-500/10 border border-gray-500/20'
                  }`}
                >
                  <Power
                    className={`w-6 h-6 ${state.cxEnabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}`}
                  />
                </div>
                <div>
                  <h2 className={combineThemeClasses('text-lg font-semibold', themeClasses.text.primary)}>
                    Chat Widget Status
                  </h2>
                </div>
              </div>
              <div className="flex justify-end md:justify-start">
                <ToggleSwitch checked={state.cxEnabled} onChange={handleCxEnabledToggle} />
              </div>
            </div>
          </GlassCard>

          {/* Plugin Not Connected Warning */}
          {state.cxEnabled && !pluginStatus.isInstalled && (
            <PluginNotConnectedWarning websiteUrl={pluginStatus.websiteUrl} />
          )}

          {/* Quick Actions - Only show if enabled */}
          {state.cxEnabled ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Configuration Card */}
                <GlassCard
                  variant="content"
                  accentColor="gray"
                  delay={0.2}
                  className="cursor-pointer hover:border-border-subtle transition-all group"
                  onClick={() => router.push('/dashboard/assistantInfo')}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated border border-border-default-light dark:border-border-default flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 dark:group-hover:bg-neutral-700 transition-colors">
                      <Settings className={combineThemeClasses('w-6 h-6', 'text-gray-700 dark:text-gray-300')} />
                    </div>
                    <div className="flex-1">
                      <h3 className={combineThemeClasses('text-lg font-semibold mb-1', themeClasses.text.primary)}>
                        Configuration
                      </h3>
                      <p className={combineThemeClasses('text-sm mb-4', themeClasses.text.secondary)}>
                        Customize appearance, capabilities, and advanced settings for Carla
                      </p>
                      <GlassButton variant="secondary" size="sm" className="w-full md:w-auto">
                        Configure Carla →
                      </GlassButton>
                    </div>
                  </div>
                </GlassCard>

                {/* Conversations Card */}
                <GlassCard
                  variant="content"
                  accentColor="gray"
                  delay={0.3}
                  className="cursor-pointer hover:border-border-subtle transition-all group"
                  onClick={() => router.push('/dashboard/patients')}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated border border-border-default-light dark:border-border-default flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 dark:group-hover:bg-neutral-700 transition-colors">
                      <MessageCircle className={combineThemeClasses('w-6 h-6', 'text-gray-700 dark:text-gray-300')} />
                    </div>
                    <div className="flex-1">
                      <h3 className={combineThemeClasses('text-lg font-semibold mb-1', themeClasses.text.primary)}>
                        Conversations
                      </h3>
                      <p className={combineThemeClasses('text-sm mb-4', themeClasses.text.secondary)}>
                        View chat history and customer interactions with Carla
                      </p>
                      <GlassButton variant="secondary" size="sm" className="w-full md:w-auto">
                        View Conversations →
                      </GlassButton>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Chat Widget Summary */}
              <GlassCard variant="content" accentColor="gray" delay={0.4}>
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-gray-300" />
                  <h2 className={combineThemeClasses('text-xl font-semibold', themeClasses.text.primary)}>
                    Chat Widget Summary
                  </h2>
                </div>

                {/* Stats Grid */}
                {loadingStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton height={100} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                    <Skeleton height={100} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                    <Skeleton height={100} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                      className={combineThemeClasses(
                        'rounded-xl p-6 hover:border-border-subtle transition-colors',
                        themeClasses.bg.surfaceElevated,
                        themeClasses.border.default,
                        'border',
                      )}
                    >
                      <div className="text-4xl font-bold text-blue-400 mb-2">{stats.conversationsToday}</div>
                      <div className={combineThemeClasses('text-sm', themeClasses.text.secondary)}>
                        Conversations Today
                      </div>
                    </div>
                    <div
                      className={combineThemeClasses(
                        'rounded-xl p-6 hover:border-border-subtle transition-colors',
                        themeClasses.bg.surfaceElevated,
                        themeClasses.border.default,
                        'border',
                      )}
                    >
                      <div className="text-4xl font-bold text-green-400 mb-2">{stats.totalConversations}</div>
                      <div className={combineThemeClasses('text-sm', themeClasses.text.secondary)}>
                        Total Conversations
                      </div>
                    </div>
                    <div
                      className={combineThemeClasses(
                        'rounded-xl p-6 hover:border-border-subtle transition-colors',
                        themeClasses.bg.surfaceElevated,
                        themeClasses.border.default,
                        'border',
                      )}
                    >
                      <div className="text-4xl font-bold text-purple-400 mb-2">
                        {stats.avgResponseTime}
                        <span className="text-2xl">min</span>
                      </div>
                      <div className={combineThemeClasses('text-sm', themeClasses.text.secondary)}>
                        Avg Response Time
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Interactions */}
                <div className="border-t border-border-default-light dark:border-border-default pt-6 mt-6">
                  <h3 className={combineThemeClasses('text-lg font-semibold mb-4', themeClasses.text.primary)}>
                    Recent Interactions
                  </h3>
                  {loadingStats ? (
                    <div className="space-y-3">
                      <Skeleton height={60} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                      <Skeleton height={60} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                      <Skeleton height={60} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                    </div>
                  ) : recentInteractions.length > 0 ? (
                    <div className="space-y-3">
                      {recentInteractions.map((interaction, index) => (
                        <div
                          key={index}
                          className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-surface-elevated-light dark:bg-surface-elevated border border-border-default-light dark:border-border-default rounded-lg hover:border-border-subtle transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                interaction.status === 'resolved'
                                  ? 'bg-green-400'
                                  : interaction.status === 'pending'
                                    ? 'bg-yellow-400'
                                    : 'bg-blue-400'
                              }`}
                            ></div>
                            <span className={combineThemeClasses('text-sm truncate', themeClasses.text.primary)}>
                              {interaction.message}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <GlassBadge
                              variant={
                                interaction.status === 'resolved'
                                  ? 'success'
                                  : interaction.status === 'pending'
                                    ? 'warning'
                                    : 'info'
                              }
                            >
                              {interaction.status}
                            </GlassBadge>
                            <span
                              className={combineThemeClasses('text-xs whitespace-nowrap', themeClasses.text.tertiary)}
                            >
                              {interaction.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={combineThemeClasses('text-center py-8', themeClasses.text.secondary)}>
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                      <p>No recent interactions yet</p>
                    </div>
                  )}

                  <div className="mt-6 text-center">
                    <GlassButton variant="secondary" onClick={() => router.push('/dashboard/patients')}>
                      View All Conversations →
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            </>
          ) : (
            /* Disabled State Message */
            <GlassCard variant="content" accentColor="gray" delay={0.2}>
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-500/10 border border-gray-500/20 flex items-center justify-center">
                  <Power className="w-10 h-10 text-gray-500" />
                </div>
                <h2 className={combineThemeClasses('text-xl font-semibold mb-3', themeClasses.text.secondary)}>
                  Chat Widget Module Disabled
                </h2>
                <p className={combineThemeClasses('max-w-md mx-auto mb-6', themeClasses.text.tertiary)}>
                  Enable customer support above to show the Carla chat widget on your website and start managing
                  customer interactions.
                </p>
                <div
                  className={combineThemeClasses(
                    'inline-flex items-center gap-2 px-4 py-2 bg-gray-500/10 border border-gray-500/20 rounded-lg text-sm',
                    themeClasses.text.tertiary,
                  )}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  The chat widget will not appear on your website
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

    </>
  );
}
