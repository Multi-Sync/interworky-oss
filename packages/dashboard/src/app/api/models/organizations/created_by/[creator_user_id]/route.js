// File path: app/organization/[creator_user_id]/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { creator_user_id } = await params;
    const token = await getToken();
    // Construct the URI to fetch the organization details by ID
    const uri = `${apiUrl}/api/organizations/creator-id/${creator_user_id}`;

    // Make the API request to your backend to get the organization details
    const response = await axios.get(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const token = await getToken();

    await axios.delete(`${apiUrl}/api/organizations/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
