import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    // Next.js 15: await params before accessing properties
    const { id } = await params;

    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Construct the URI to get fix progress
    const uri = `${apiUrl}/api/performance-monitoring/errors/${id}/fix-progress`;

    // Make the API request to get the fix progress
    const response = await axios.get(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Return the progress data
    return NextResponse.json(response.data);
  } catch (error) {
    // Handle 404 specially - no active progress
    if (error.response?.status === 404) {
      return NextResponse.json({ success: false, error: 'No active fix process found' }, { status: 404 });
    }

    console.error('Error fetching fix progress:', error.response?.data || error.message);
    return NextResponse.json(
      { success: false, message: error.response?.data?.error || error.message },
      { status: error.response?.status || 500 },
    );
  }
}
