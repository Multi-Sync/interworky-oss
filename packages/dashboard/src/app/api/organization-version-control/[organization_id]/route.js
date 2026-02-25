import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { organization_id } = await params;
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const uri = `${apiUrl}/api/organization-version-control/${organization_id}`;
    const response = await axios.get(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching organization version control:', error);
    if (axios.isAxiosError(error)) {
      // If it's a 404, it means GitHub is not connected - return success: false
      if (error.response?.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'GitHub App not installed for this organization',
        });
      }
      return NextResponse.json(
        { success: false, error: error.response?.data?.error || error.message },
        { status: error.response?.status || 500 },
      );
    }
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 });
  }
}
