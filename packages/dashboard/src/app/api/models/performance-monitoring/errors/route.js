import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

/**
 * Performance Monitoring Errors API Route
 *
 * Fetches paginated error reports from interworky-core
 * Supports filtering by organization, error type, severity, status, and date range
 */
export async function GET(request) {
  try {
    const token = await getToken();

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const assistantId = searchParams.get('assistant_id');
    const errorType = searchParams.get('error_type');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const sortBy = searchParams.get('sort_by') || 'timestamp';
    const sortOrder = searchParams.get('sort_order') || 'desc';

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
      page,
      limit,
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

    // Fetch errors from the backend
    const url = `${apiUrl}/api/performance-monitoring/errors?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If 404 or no data, return empty errors
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        });
      }

      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const errorsData = await response.json();
    return NextResponse.json(errorsData);
  } catch (error) {
    console.error('Error fetching performance monitoring errors:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch performance monitoring errors',
        error: error.message,
      },
      { status: 500 },
    );
  }
}
