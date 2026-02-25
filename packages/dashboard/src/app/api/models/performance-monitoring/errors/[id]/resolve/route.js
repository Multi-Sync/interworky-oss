import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

/**
 * Performance Monitoring Error Resolution API Route
 *
 * Handles error resolution requests to interworky-core
 * Allows users to mark errors as resolved with notes
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const token = await getToken();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error ID is required',
        },
        { status: 400 },
      );
    }

    // Get request body
    const body = await request.json();
    const { status, resolved_by, resolution_notes } = body;

    // Validate required fields
    if (!status || !resolved_by) {
      return NextResponse.json(
        {
          success: false,
          message: 'status and resolved_by are required',
        },
        { status: 400 },
      );
    }

    // Send resolution request to backend
    const url = `${apiUrl}/api/performance-monitoring/errors/${id}/resolve`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        resolved_by,
        resolution_notes: resolution_notes || '',
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          {
            success: false,
            message: 'Error record not found',
          },
          { status: 404 },
        );
      }

      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const resolutionData = await response.json();
    return NextResponse.json(resolutionData);
  } catch (error) {
    console.error('Error resolving performance monitoring error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to resolve error',
        error: error.message,
      },
      { status: 500 },
    );
  }
}
