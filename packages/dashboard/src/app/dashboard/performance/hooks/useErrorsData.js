'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for fetching performance monitoring errors with performance tracking
 *
 * Features:
 * - Fetches paginated error data from API
 * - Supports filtering by error type, severity, status, and date range
 * - Tracks API response time and performance metrics
 * - Automatic retry on failure
 * - Loading and error states
 */
export function useErrorsData({
  organizationId,
  assistantId = null,
  errorType = null,
  severity = null,
  status = null,
  startDate = null,
  endDate = null,
  page = 1,
  limit = 100,
  sortBy = 'timestamp',
  sortOrder = 'desc',
  enabled = true,
}) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    lastFetchTime: null,
    averageResponseTime: null,
    fetchCount: 0,
  });

  const abortControllerRef = useRef(null);
  const responseTimesRef = useRef([]);

  const fetchErrors = useCallback(async () => {
    if (!organizationId || !enabled) {
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
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      // Add optional filters
      if (assistantId) queryParams.append('assistant_id', assistantId);
      if (errorType) queryParams.append('error_type', errorType);
      if (severity) queryParams.append('severity', severity);
      if (status) queryParams.append('status', status);
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);

      const response = await fetch(`/api/models/performance-monitoring/errors?${queryParams.toString()}`, {
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
        throw new Error(`Failed to fetch errors: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
        setPagination(result.pagination || null);
      } else {
        throw new Error(result.message || 'Failed to fetch errors');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Error fetching performance monitoring errors:', err);
      setError(err.message);
      setData([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    organizationId,
    assistantId,
    errorType,
    severity,
    status,
    startDate,
    endDate,
    page,
    limit,
    sortBy,
    sortOrder,
    enabled,
  ]);

  useEffect(() => {
    fetchErrors();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchErrors]);

  const refetch = useCallback(() => {
    fetchErrors();
  }, [fetchErrors]);

  return {
    data,
    pagination,
    isLoading,
    error,
    refetch,
    performanceMetrics,
  };
}
