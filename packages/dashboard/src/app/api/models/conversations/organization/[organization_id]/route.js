import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { organization_id } = await params;

    let token = await getToken();
    const uri = `${apiUrl}/api/conversation/organization/${organization_id}`;

    // Make the API request to your backend to get the conversation details
    const response = await axios.get(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Return the fetched conversation details as JSON
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching conversations:', error.response?.data || error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
