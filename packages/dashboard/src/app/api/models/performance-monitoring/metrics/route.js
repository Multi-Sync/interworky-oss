import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

/**
 * Performance Metrics API Route
 *
 * Fetches performance metrics (Core Web Vitals, resource analysis) from interworky-core
 * Supports real-time updates for dashboard
 */
export async function GET(request) {
  try {
    const token = await getToken();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const assistantId = searchParams.get('assistant_id');
    const limit = searchParams.get('limit') || '1';
    const offset = searchParams.get('offset') || '0';

    // Validate required parameters
    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          message: 'organization_id is required',
        },
        { status: 400 },
      );
    }

    // Build query string
    const queryParams = new URLSearchParams({
      organization_id: organizationId,
      limit: limit,
      offset: offset,
    });

    // Add optional assistant_id filter
    if (assistantId) {
      queryParams.append('assistant_id', assistantId);
    }

    // Fetch performance metrics from the backend
    const url = `${apiUrl}/api/performance-monitoring/metrics?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If 404 or no data, return empty metrics
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          data: {
            metrics: [],
            total: 0,
            limit: parseInt(limit),
            offset: parseInt(offset),
          },
        });
      }

      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const metricsData = await response.json();
    return NextResponse.json(metricsData);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch performance metrics',
        error: error.message,
      },
      { status: 500 },
    );
  }
}
