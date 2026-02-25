import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { organization_id } = await params;
    const token = await getToken();

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query string
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    const queryString = queryParams.toString();

    // Fetch analytics from the backend
    const url = `${apiUrl}/api/visitor-journey/analytics/organization/${organization_id}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If 404 or no data, return empty analytics
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          analytics: {
            total_sessions: 0,
            total_page_views: 0,
            avg_session_duration: 0,
            avg_engagement_score: 0,
            total_conversions: 0,
            sessions_with_conversions: 0,
            unique_visitors: 0,
            bounce_rate: 0,
            conversion_rate: 0,
          },
        });
      }

      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const analyticsData = await response.json();
    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch analytics',
        error: error.message,
      },
      { status: 500 },
    );
  }
}
