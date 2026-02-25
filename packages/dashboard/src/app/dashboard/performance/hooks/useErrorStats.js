'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for fetching performance monitoring stats with performance tracking
 *
 * Features:
 * - Fetches error statistics for a date range
 * - Returns aggregated data by type, severity, and status
 * - Tracks API response time and performance metrics
 * - Loading and error states
 */
export function useErrorStats({ organizationId, startDate, endDate, recentLimit = 10, enabled = true }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    lastFetchTime: null,
    averageResponseTime: null,
    fetchCount: 0,
  });

  const abortControllerRef = useRef(null);
  const responseTimesRef = useRef([]);

  const fetchStats = useCallback(async () => {
    if (!organizationId || !startDate || !endDate || !enabled) {
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        organization_id: organizationId,
        start_date: startDate,
        end_date: endDate,
        recent_limit: recentLimit.toString(),
      });

      const response = await fetch(`/api/models/performance-monitoring/stats?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Track response times for averaging
      responseTimesRef.current.push(responseTime);
      if (responseTimesRef.current.length > 10) {
        responseTimesRef.current.shift(); // Keep only last 10 measurements
      }

      const averageResponseTime =
        responseTimesRef.current.reduce((sum, time) => sum + time, 0) / responseTimesRef.current.length;

      setPerformanceMetrics(prev => ({
        lastFetchTime: responseTime,
        averageResponseTime,
        fetchCount: prev.fetchCount + 1,
      }));

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setStats(result.data || null);
      } else {
        throw new Error(result.message || 'Failed to fetch stats');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Error fetching performance monitoring stats:', err);
      setError(err.message);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, startDate, endDate, recentLimit, enabled]);

  useEffect(() => {
    fetchStats();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStats]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch,
    performanceMetrics,
  };
}
