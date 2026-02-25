/**
 * GitHub App Installation URL Endpoint
 * Proxies request to backend to get GitHub App installation URL
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendToken = session.backendToken;

    if (!backendToken) {
      return NextResponse.json({ error: 'Missing backend token in session' }, { status: 401 });
    }

    // Get organization_id from query params
    const { searchParams } = new URL(request.url);
    const organization_id = searchParams.get('organization_id');

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id query parameter is required' }, { status: 400 });
    }

    // Fetch from backend API
    const backendUrl = process.env.NODE_PUBLIC_API_URL || 'http://localhost:8080';
    const backendResponse = await fetch(
      `${backendUrl}/api/organization-version-control/install-url?organization_id=${organization_id}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${backendToken}`,
        },
      },
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('Backend API error:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || 'Failed to get installation URL from backend',
        },
        { status: backendResponse.status },
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting installation URL:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
