import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { organization_id } = await params;
    const token = await getToken();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const interval = searchParams.get('interval') || 'day';

    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    queryParams.append('interval', interval);
    const queryString = queryParams.toString();

    const url = `${apiUrl}/api/visitor-journey/analytics/trends/${organization_id}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ success: true, trends: [], interval });
      }
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching analytics trends:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch analytics trends',
        error: error.message,
      },
      { status: 500 },
    );
  }
}
