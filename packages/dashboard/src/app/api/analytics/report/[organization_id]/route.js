import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { organization_id } = await params;
    const token = await getToken();

    // Get query parameters (start_date and end_date)
    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    if (!start_date || !end_date) {
      return NextResponse.json(
        {
          success: false,
          message: 'start_date and end_date query parameters are required',
        },
        { status: 400 },
      );
    }

    // Build backend URL with query parameters
    const url = `${apiUrl}/api/visitor-journey/analytics/report/${organization_id}?start_date=${start_date}&end_date=${end_date}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Analytics Report API] Backend error: ${response.status}`);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to generate report',
          error: errorData.error || `Backend responded with status: ${response.status}`,
        },
        { status: response.status },
      );
    }

    const reportData = await response.json();

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('[Analytics Report API] Error generating analytics report:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate analytics report',
        error: error.message,
      },
      { status: 500 },
    );
  }
}
