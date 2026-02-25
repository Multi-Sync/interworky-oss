import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';

export async function POST(request) {
  try {
    const token = process.env.ACCESS_TOKEN;
    const body = await request.json();

    const uri = `${apiUrl}/api/organization-methods`;

    // Make the POST request to the backend to create the method
    const response = await axios.post(uri, body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating method:', error.response?.data || error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
