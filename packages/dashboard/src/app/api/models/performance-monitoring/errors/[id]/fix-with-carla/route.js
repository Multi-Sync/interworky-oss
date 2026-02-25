import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function POST(request, { params }) {
  try {
    // Next.js 15: await params before accessing properties
    const { id } = await params;

    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Construct the URI to fix the error with Carla
    const uri = `${apiUrl}/api/performance-monitoring/errors/${id}/fix-with-carla`;

    // Make the API request to start the fix process
    const response = await axios.post(
      uri,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    // Return the response data
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error starting Carla fix:', error.response?.data || error.message);
    return NextResponse.json(
      { success: false, message: error.response?.data?.error || error.message },
      { status: error.response?.status || 500 },
    );
  }
}
