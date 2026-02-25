import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { organization_id } = await params;
    const token = await getToken();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    // Fetch analytics summary from the backend
    const url = `${apiUrl}/api/visitor-journey/analytics/summary/${organization_id}?period=${period}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If 404 or 400, return empty summary
      if (response.status === 404 || response.status === 400) {
        console.warn(`Backend returned ${response.status} for analytics summary, returning empty data`);
        return NextResponse.json({
          success: true,
          summary: {
            hero_metrics: {
              total_visitors: { value: 0, change: 0 },
              new_visitors: { count: 0, percentage: 0, change: 0 },
              avg_session_duration: { value: 0, change: 0 },
              critical_errors: { count: 0 },
            },
            summary_stats: {
              unique_visitors: 0,
              returning_visitors: 0,
              total_page_views: 0,
              avg_engagement_score: 0,
            },
            traffic_sources: [],
            trends: [],
            critical_errors: [],
            period: {
              days: parseInt(period.replace('d', '')),
              start_date: new Date().toISOString(),
              end_date: new Date().toISOString(),
            },
          },
        });
      }

      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const summaryData = await response.json();

    return NextResponse.json(summaryData);
  } catch (error) {
    console.error('[Analytics Summary API] Error fetching analytics summary:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch analytics summary',
        error: error.message,
      },
      { status: 500 },
    );
  }
}
