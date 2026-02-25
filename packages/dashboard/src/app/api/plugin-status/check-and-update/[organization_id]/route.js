import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

export async function POST(request, { params }) {
  try {
    const { organization_id } = await params;
    const token = await getToken();

    // Check plugin status and update onboarding step
    const response = await fetch(`${apiUrl}/api/plugin-status/check-and-update/${organization_id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || `Backend responded with status: ${response.status}`,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking plugin status and updating onboarding:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to check plugin status',
      },
      { status: 500 },
    );
  }
}
