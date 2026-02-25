import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { organization_id } = await params;
    if (!organization_id) {
      return NextResponse.json({ success: false, message: 'Organization ID is required' }, { status: 400 });
    }
    const token = await getToken();

    // Fetch subscription from your Node.js backend using the organization_id
    let uri = `${apiUrl}/api/subscriptions/${organization_id}`;

    const response = await axios.get(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Return the fetched subscription as JSON
    return NextResponse.json(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn('Subscription not found for the given organization ID.');
      return NextResponse.json({ success: false, message: 'Subscription not found' }, { status: 404 });
    }
    console.error('Error fetching subscription:', error.response.data);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
