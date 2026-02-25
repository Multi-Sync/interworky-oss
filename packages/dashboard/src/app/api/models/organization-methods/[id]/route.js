import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function DELETE(request, { params }) {
  try {
    const { id } = params; // Extract the method ID from the URL parameters
    const token = await getToken();

    const uri = `${apiUrl}/api/organization-methods/${id}`;

    // Make the DELETE request to the backend
    await axios.delete(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json({ success: true, message: 'Method deleted successfully.' });
  } catch (error) {
    console.error('Error deleting method:', error.response?.data || error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params; // Extract the method ID from the URL parameters
    const token = await getToken();
    const body = await request.json();

    const uri = `${apiUrl}/api/organization-methods/${id}`;

    // Make the PUT request to the backend to update the method
    const response = await axios.put(uri, body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating method:', error.response?.data || error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
