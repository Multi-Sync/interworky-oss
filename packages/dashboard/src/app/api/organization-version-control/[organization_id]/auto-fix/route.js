import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

/**
 * PATCH auto-fix enabled status for organization version control
 * Updates whether auto-fix should create PRs/issues for new errors
 */
export async function PATCH(request, { params }) {
  try {
    const { organization_id } = await params;
    const body = await request.json();
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uri = `${apiUrl}/api/organization-version-control/${organization_id}/auto-fix`;

    const response = await axios.patch(uri, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating auto-fix status:', error.response?.data || error.message);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { success: false, message: error.response?.data?.message || error.message },
        { status: error.response?.status || 500 },
      );
    }

    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
