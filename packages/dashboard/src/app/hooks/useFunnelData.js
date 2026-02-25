'use client';
import { useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/_common/utils/swrFetcher';

/**
 * Custom hook to fetch conversion funnel data
 * Returns funnel metrics: Awareness → Consideration → Conversion
 *
 * @param {string} orgId - Organization ID
 * @param {string} period - Time period ('7d', '30d', '90d')
 * @param {boolean} enabled - Whether to fetch data
 * @returns {object} - { funnel, isLoading, error }
 */
export function useFunnelData(orgId, period = '7d', enabled = true) {
  // Build API URL
  const url = useMemo(() => {
    if (!orgId || !enabled) return null;
    return `/api/analytics/custom-funnel/${orgId}?period=${period}`;
  }, [orgId, period, enabled]);

  // Fetch funnel data using SWR
  const { data, error, isLoading } = useSWR(url, fetcher, {
    // Refresh every 5 minutes
    refreshInterval: 5 * 60 * 1000,
    // Revalidate on focus
    revalidateOnFocus: true,
    // Keep previous data while fetching new data
    keepPreviousData: true,
  });

  // Extract funnel from response
  const funnel = useMemo(() => {
    return data?.funnel || null;
  }, [data]);

  return {
    funnel,
    isLoading,
    error,
  };
}
