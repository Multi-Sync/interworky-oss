import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

/**
 * Performance Monitoring Stats API Route
 *
 * Fetches performance monitoring statistics from interworky-core
 * Similar to analytics API but for error tracking and performance metrics
 */
export async function GET(request) {
  try {
    const token = await getToken();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const recentLimit = searchParams.get('recent_limit') || '10';

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

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          message: 'start_date and end_date are required',
        },
        { status: 400 },
      );
    }

    // Build query string
    const queryParams = new URLSearchParams({
      organization_id: organizationId,
      start_date: startDate,
      end_date: endDate,
      recent_limit: recentLimit,
    });

    // Fetch performance monitoring stats from the backend
    const url = `${apiUrl}/api/performance-monitoring/stats?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If 404 or no data, return empty stats
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          data: {
            total_errors: 0,
            errors_by_type: [],
            errors_by_severity: [],
            errors_by_status: [],
            recent_errors: [],
            date_range: {
              start: startDate,
              end: endDate,
            },
            generated_at: new Date(),
          },
        });
      }

      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const statsData = await response.json();
    return NextResponse.json(statsData);
  } catch (error) {
    console.error('Error fetching performance monitoring stats:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch performance monitoring stats',
        error: error.message,
      },
      { status: 500 },
    );
  }
}
