import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { organization_id } = await params; // Extract organization ID from the URL parameters
    const token = await getToken();

    const uri = `${apiUrl}/api/organization-methods/organization/${organization_id}`;

    // Make the GET request to fetch methods for the organization
    const response = await axios.get(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const methodsData = response.data;
    return NextResponse.json(methodsData);
  } catch (error) {
    console.error('Error fetching organization methods:', error.response?.data || error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
