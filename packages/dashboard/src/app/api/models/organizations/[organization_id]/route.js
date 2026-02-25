import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { organization_id } = await params; // Extract organization_id from the URL parameters
    const token = await getToken();

    // Construct the URI to fetch the organization details by ID
    const uri = `${apiUrl}/api/organizations/${organization_id}`;

    // Make the API request to your backend to get the organization details
    const response = await axios.get(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Return the fetched organization details as JSON
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching organization:', error.response?.data || error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
export async function PUT(request, { params }) {
  try {
    const { organization_id } = await params;
    const { organization_name, organization_website } = await request.json();
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uri = `${apiUrl}/api/organizations/${organization_id}`;
    const response = await axios.put(
      uri,
      { organization_name, organization_website },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating organization:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data || error.message },
        { status: error.response?.status || 500 },
      );
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
