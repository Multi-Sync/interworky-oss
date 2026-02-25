import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';
import { NextResponse } from 'next/server';

/**
 * GET handler to fetch message usage information for an organization
 * @param {Object} req - The request object
 * @param {Object} params - URL parameters including organizationId
 * @returns {Promise<NextResponse>}
 */
export async function GET(req, { params }) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }
    const token = await getToken();

    const uri = `${apiUrl}/api/organizations/usage/${organizationId}`;

    const response = await fetch(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: 30,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch message usage' },
        { status: response.status },
      );
    }

    const usageData = await response.json();
    return NextResponse.json(usageData, { status: 200 });
  } catch (error) {
    console.error('Error fetching message usage:', error);
    return NextResponse.json({ error: 'Failed to fetch message usage information' }, { status: 500 });
  }
}
