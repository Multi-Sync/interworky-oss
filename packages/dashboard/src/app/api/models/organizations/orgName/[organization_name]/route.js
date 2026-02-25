import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';

export async function GET(request, { params }) {
  try {
    const { organization_name } = params; // Extract organization_name from the URL parameters
    const token = process.env.ACCESS_TOKEN;

    // Construct the URI to fetch the organization details by ID
    const uri = `${apiUrl}/api/organizations/organization_name/${organization_name}`;

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
