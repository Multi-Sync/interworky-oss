import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

/**
 * GET organization version control (GitHub integration) by organization ID
 * Fetches GitHub App installation details and auto-fix settings
 */
export async function GET(request, { params }) {
  try {
    const { organization_id } = await params;
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uri = `${apiUrl}/api/organization-version-control/${organization_id}`;

    const response = await axios.get(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching organization version control:', error.response?.data || error.message);

    if (axios.isAxiosError(error)) {
      // Return the exact status code from backend (e.g., 404 if not found)
      return NextResponse.json(
        { success: false, message: error.response?.data?.message || error.message },
        { status: error.response?.status || 500 },
      );
    }

    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
