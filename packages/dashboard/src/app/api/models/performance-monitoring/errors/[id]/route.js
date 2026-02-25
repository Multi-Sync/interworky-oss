import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

/**
 * Performance Monitoring Error Management API Route
 *
 * Handles DELETE requests for individual errors to interworky-core
 * Deletes error and all its occurrences from the database
 */
export async function DELETE(request, { params }) {
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

    // Send delete request to backend
    const url = `${apiUrl}/api/performance-monitoring/errors/${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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

    const deleteData = await response.json();
    return NextResponse.json(deleteData);
  } catch (error) {
    console.error('Error deleting performance monitoring error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete error',
        error: error.message,
      },
      { status: 500 },
    );
  }
}
