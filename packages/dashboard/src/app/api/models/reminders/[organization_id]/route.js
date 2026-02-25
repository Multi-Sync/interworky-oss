import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || 10;
    const page = url.searchParams.get('page') || 1;
    const { organization_id } = await params;
    const token = await getToken();

    // Fetch appointments from your Node.js backend using the organization_id
    const response = await axios.get(
      `${apiUrl}/api/reminders/organization/${organization_id}?limit=${limit}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    // Return the fetched appointments as JSON
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
