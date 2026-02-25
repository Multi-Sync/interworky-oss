import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';

export async function GET() {
  try {
    const uri = `${apiUrl}/api/organization-methods/public`;

    // Make the GET request to fetch public methods
    const response = await axios.get(uri);

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching public methods:', error.response?.data || error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
