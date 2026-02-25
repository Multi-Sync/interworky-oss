'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Map, Search, ChevronDown, ChevronRight, Clock, MousePointer, ArrowLeft } from 'lucide-react';
import { getOrganization } from '@/_common/utils/localStorage';
import useSWR from 'swr';
import { fetcher } from '@/_common/utils/swrFetcher';
import Link from 'next/link';

/**
 * Journey Explorer Page
 * Simplified page to view individual visitor journeys
 */
export default function JourneysPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedJourney, setExpandedJourney] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Get organization
  const organization = getOrganization()?.organization;
  const orgId = organization?.id;

  // Fetch visitor journeys
  const url = useMemo(() => {
    if (!orgId) return null;
    return `/api/models/visitor-journeys/${orgId}?limit=${limit}&page=${page}`;
  }, [orgId, page]);

  const { data, isLoading, error } = useSWR(url, fetcher);

  const journeys = data?.visitorJourneys || [];
  const total = data?.total || 0;

  // Filter journeys by search term
  const filteredJourneys = useMemo(() => {
    if (!searchTerm) return journeys;
    const term = searchTerm.toLowerCase();
    return journeys.filter(journey => {
      // Session ID match
      if (journey.session_id?.toLowerCase().includes(term)) return true;

      // Traffic source match
      if (journey.traffic_source?.source?.toLowerCase().includes(term)) return true;

      // Entry page match - handle both string and object types
      const entryPage = journey.journey?.entry_page;
      if (typeof entryPage === 'string' && entryPage.toLowerCase().includes(term)) return true;
      if (
        typeof entryPage === 'object' &&
        (entryPage?.title?.toLowerCase().includes(term) || entryPage?.url?.toLowerCase().includes(term))
      )
        return true;

      return false;
    });
  }, [journeys, searchTerm]);

  const toggleJourney = sessionId => {
    setExpandedJourney(expandedJourney === sessionId ? null : sessionId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-[#0a0e27] dark:via-[#0a0e27] dark:to-[#0f1629] transition-colors duration-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link
            href="/dashboard/analytics"
            className="inline-flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Analytics</span>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Map className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                Visitor Journeys
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Explore individual visitor sessions and navigation paths
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by session ID, source, or entry page..."
              className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-[#0a0e27]/60 backdrop-blur-xl border border-cyan-400/40 dark:border-cyan-500/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </motion.div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Sessions" value={total} />
          <StatCard label="Showing" value={filteredJourneys.length} />
          <StatCard label="Page" value={page} />
        </div>

        {/* Journey List */}
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} />
        ) : filteredJourneys.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {filteredJourneys.map((journey, index) => (
              <JourneyCard
                key={`${journey.session_id}-${index}`}
                journey={journey}
                isExpanded={expandedJourney === journey.session_id}
                onToggle={() => toggleJourney(journey.session_id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white/80 dark:bg-[#0a0e27]/60 border border-cyan-400/40 dark:border-cyan-500/20 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-cyan-500 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700 dark:text-gray-400">
              Page {page} of {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / limit)}
              className="px-4 py-2 rounded-lg bg-white/80 dark:bg-[#0a0e27]/60 border border-cyan-400/40 dark:border-cyan-500/20 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-cyan-500 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function JourneyCard({ journey, isExpanded, onToggle }) {
  const { session_id, traffic_source, journey: journeyData, session, engagement } = journey;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-cyan-400/40 dark:border-cyan-500/20 hover:border-cyan-500 dark:hover:border-cyan-500/40 transition-all"
    >
      {/* Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full p-4 text-left flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          )}
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-500 mb-1">Session ID</div>
            <div className="text-sm text-gray-900 dark:text-white font-mono truncate">
              {session_id?.substring(0, 12)}...
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-500 mb-1">Source</div>
            <div className="text-sm text-cyan-700 dark:text-cyan-400">
              {traffic_source?.source || traffic_source?.type || 'Direct'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-500 mb-1">Duration</div>
            <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(session?.duration || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-500 mb-1">Engagement</div>
            <div className="text-sm">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  (engagement?.engagement_score || 0) >= 70
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-gray-200 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400'
                }`}
              >
                {engagement?.engagement_score || 0}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-gray-300 dark:border-gray-700/50 p-4 bg-gray-50 dark:bg-black/20"
        >
          <div className="space-y-4">
            {/* Entry Page */}
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-500 mb-1">Entry Page</div>
              <div className="text-sm text-gray-900 dark:text-white">
                {typeof journeyData?.entry_page === 'object'
                  ? journeyData.entry_page?.title || journeyData.entry_page?.url || 'N/A'
                  : journeyData?.entry_page || 'N/A'}
              </div>
            </div>

            {/* Exit Page */}
            {journeyData?.exit_page && (
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mb-1">Exit Page</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {typeof journeyData.exit_page === 'object'
                    ? journeyData.exit_page?.title || journeyData.exit_page?.url || 'N/A'
                    : journeyData.exit_page}
                </div>
              </div>
            )}

            {/* Pages Visited */}
            {Array.isArray(journeyData?.pages) && journeyData.pages.length > 0 ? (
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mb-2 flex items-center gap-1">
                  <MousePointer className="w-3 h-3" />
                  Pages Visited ({journeyData.pages.length})
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {journeyData.pages.map((page, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-gray-600 dark:text-gray-400 pl-4 border-l-2 border-gray-300 dark:border-gray-700"
                    >
                      <div className="text-gray-900 dark:text-white">{page?.title || page?.url || 'Unknown page'}</div>
                      {page?.time_spent > 0 && (
                        <div className="text-gray-500 dark:text-gray-600">{Math.round(page.time_spent)}s</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mb-1">Pages Visited</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">No page data available</div>
              </div>
            )}

            {/* Session Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-300 dark:border-gray-700/50">
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mb-1">Device</div>
                <div className="text-sm text-gray-900 dark:text-white">{journey.device?.type || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mb-1">Browser</div>
                <div className="text-sm text-gray-900 dark:text-white">{journey.device?.browser || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mb-1">Country</div>
                <div className="text-sm text-gray-900 dark:text-white">{journey.location?.country || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mb-1">Converted</div>
                <div className="text-sm">
                  {engagement?.converted ? (
                    <span className="text-emerald-700 dark:text-emerald-400">✓ Yes</span>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400">✗ No</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-cyan-400/40 dark:border-cyan-500/20 p-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-cyan-400/40 dark:border-cyan-500/20 animate-pulse"
        ></div>
      ))}
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="text-center py-20 rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-red-400/40 dark:border-red-500/20">
      <p className="text-xl text-red-600 dark:text-red-400 mb-2">Failed to load journeys</p>
      <p className="text-sm text-gray-600 dark:text-gray-500">{error?.message || 'An error occurred'}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-cyan-400/40 dark:border-cyan-500/20">
      <Map className="w-16 h-16 text-gray-500 dark:text-gray-600 mx-auto mb-4" />
      <p className="text-xl text-gray-700 dark:text-gray-400 mb-2">No journeys found</p>
      <p className="text-sm text-gray-600 dark:text-gray-500">Start tracking visitors to see their journeys here</p>
    </div>
  );
}

function formatDuration(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}
