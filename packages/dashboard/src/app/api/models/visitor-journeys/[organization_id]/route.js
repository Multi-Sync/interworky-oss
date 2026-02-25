import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { organization_id } = await params;
    const token = await getToken();

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const page = searchParams.get('page') || '1';
    const isActive = searchParams.get('is_active');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('organization_id', organization_id);
    queryParams.append('limit', limit);
    queryParams.append('page', page);
    if (isActive !== null) queryParams.append('is_active', isActive);
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);

    const queryString = queryParams.toString();

    // Fetch visitor journeys from the backend
    const url = `${apiUrl}/api/visitor-journey?${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If 404, 400, or no data, return empty journeys
      if (response.status === 404 || response.status === 400) {
        console.warn(`Backend returned ${response.status} for visitor journeys, returning empty data`);
        return NextResponse.json({
          success: true,
          visitorJourneys: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
        });
      }

      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const journeysData = await response.json();

    return NextResponse.json(journeysData);
  } catch (error) {
    console.error('[Visitor Journeys API] Error fetching visitor journeys:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch visitor journeys',
        error: error.message,
      },
      { status: 500 },
    );
  }
}
