import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { organization_id } = await params;
    const token = await getToken();

    // Fetch traffic sources from the backend
    const url = `${apiUrl}/api/visitor-journey/analytics/traffic-sources/${organization_id}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If 404 or no data, return empty traffic sources
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          traffic_sources: [],
        });
      }

      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const trafficSourcesData = await response.json();
    return NextResponse.json(trafficSourcesData);
  } catch (error) {
    console.error('Error fetching traffic sources:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch traffic sources',
        error: error.message,
      },
      { status: 500 },
    );
  }
}
