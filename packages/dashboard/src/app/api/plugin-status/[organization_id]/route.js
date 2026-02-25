import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { organization_id } = await params;
    const token = await getToken();

    // Fetch plugin status from the backend
    const response = await fetch(`${apiUrl}/api/plugin-status/status/${organization_id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // If 404, plugin not installed
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          isInstalled: false,
          isResponding: false,
          message: 'Plugin not installed for this organization',
        });
      }

      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const pluginStatus = await response.json();
    return NextResponse.json(pluginStatus);
  } catch (error) {
    console.error('Error fetching plugin status:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch plugin status',
        error: error.message,
      },
      { status: 500 },
    );
  }
}
