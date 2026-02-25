import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to fetch performance metrics with performance tracking and real-time updates
 */
export function usePerformanceMetrics({
  organizationId,
  assistantId,
  enabled = true,
  refreshInterval = 10000, // Default: 10 seconds for real-time feel
}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fetchCount: 0,
    lastFetchTime: 0,
    averageResponseTime: 0,
    totalResponseTime: 0,
  });

  // Track if we've completed the initial fetch to prevent multiple resets
  const hasInitialFetchCompleted = useRef(false);
  const prevOrgId = useRef(organizationId);

  // Reset state when organizationId changes (different context)
  useEffect(() => {
    if (prevOrgId.current !== organizationId) {
      hasInitialFetchCompleted.current = false;
      prevOrgId.current = organizationId;
      setData(null);
      setIsLoading(true);
    }
  }, [organizationId]);

  const fetchMetrics = useCallback(
    async (isInitialFetch = false) => {
      if (!organizationId || !enabled) {
        setIsLoading(false);
        return;
      }

      const fetchStartTime = performance.now();
      // Only show loading on initial fetch, show refreshing indicator on background fetches
      if (isInitialFetch) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams({
          organization_id: organizationId,
          limit: '1',
          offset: '0',
        });

        if (assistantId) {
          queryParams.append('assistant_id', assistantId);
        }

        const response = await fetch(`/api/models/performance-monitoring/metrics?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Get the most recent metrics (first one)
        const metrics = result?.data?.metrics?.[0] || null;

        // Update timestamp on every successful fetch
        setLastUpdated(new Date());

        // Only update data if we got new metrics
        // This prevents null from overwriting existing data during background refetches
        if (metrics) {
          setData(metrics);
          hasInitialFetchCompleted.current = true;
        } else if (isInitialFetch && !hasInitialFetchCompleted.current) {
          // Only set to null on the VERY FIRST initial fetch if truly no data
          // Don't reset to null if we've already completed an initial fetch
          setData(null);
          hasInitialFetchCompleted.current = true;
        }
        // If background refetch returns null but we have existing data, keep the existing data

        // Track performance
        const fetchEndTime = performance.now();
        const fetchTime = fetchEndTime - fetchStartTime;

        setPerformanceMetrics(prev => {
          const newFetchCount = prev.fetchCount + 1;
          const newTotalResponseTime = prev.totalResponseTime + fetchTime;
          return {
            fetchCount: newFetchCount,
            lastFetchTime: fetchTime,
            averageResponseTime: newTotalResponseTime / newFetchCount,
            totalResponseTime: newTotalResponseTime,
          };
        });
      } catch (err) {
        console.error('Error fetching performance metrics:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [organizationId, assistantId, enabled],
  );

  // Initial fetch
  useEffect(() => {
    fetchMetrics(true); // Mark as initial fetch
  }, [fetchMetrics]);

  // Real-time refetch based on refreshInterval
  useEffect(() => {
    if (!enabled || !refreshInterval) return;

    const interval = setInterval(() => {
      fetchMetrics(false); // Background refetch - don't show loading state
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchMetrics, enabled, refreshInterval]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    isRefreshing,
    refetch: () => fetchMetrics(true), // Manual refetch should show loading
    performanceMetrics,
  };
}
