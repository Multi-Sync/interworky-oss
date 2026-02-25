import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function PUT(request, { params }) {
  try {
    const { organization_id } = await params;
    const { organization_website } = await request.json();
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!organization_website) {
      return NextResponse.json({ success: false, error: 'organization_website is required' }, { status: 400 });
    }

    const uri = `${apiUrl}/api/organizations/${organization_id}/website`;

    const response = await axios.put(
      uri,
      { organization_website },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating organization website:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { success: false, error: error.response?.data?.error || error.message },
        { status: error.response?.status || 500 },
      );
    }
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 });
  }
}
