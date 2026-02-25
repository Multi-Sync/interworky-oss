'use client';
import { useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/_common/utils/swrFetcher';

/**
 * Custom hook to fetch unified analytics summary
 * Returns pre-computed metrics from backend (no client-side aggregation)
 *
 * @param {string} orgId - Organization ID
 * @param {string} period - Time period ('7d', '30d', '90d')
 * @param {boolean} enabled - Whether to fetch data
 * @returns {object} - { summary, isLoading, error }
 */
export function useAnalyticsSummary(orgId, period = '7d', enabled = true) {
  // Build API URL
  const url = useMemo(() => {
    if (!orgId || !enabled) return null;
    return `/api/models/visitor-journeys/analytics/summary/${orgId}?period=${period}`;
  }, [orgId, period, enabled]);

  // Fetch summary data using SWR
  const { data, error, isLoading } = useSWR(url, fetcher, {
    // Refresh every 5 minutes
    refreshInterval: 5 * 60 * 1000,
    // Revalidate on focus
    revalidateOnFocus: true,
    // Keep previous data while fetching new data
    keepPreviousData: true,
  });

  // Extract summary from response
  const summary = useMemo(() => {
    return data?.summary || null;
  }, [data]);

  return {
    summary,
    isLoading,
    error,
  };
}
