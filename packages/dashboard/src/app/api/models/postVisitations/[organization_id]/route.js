import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || 10;
    const skip = url.searchParams.get('skip') || 0;
    const search = url.searchParams.get('search') || null;
    const { organization_id } = await params;
    const token = await getToken();

    let uri = `${apiUrl}/api/post-visitations/organization/${organization_id}?limit=${limit}&skip=${skip}`;

    if (search) {
      uri += `&search=${search}`;
    }
    const response = await axios.get(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Return the fetched appointments as JSON
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
