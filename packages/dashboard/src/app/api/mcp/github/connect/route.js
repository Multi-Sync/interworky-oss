/**
 * GitHub App Connection Endpoint
 * Note: With GitHub App, connection happens via OAuth callback
 * This endpoint is primarily for disconnecting (DELETE)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function DELETE(request) {
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

    // Get organization_id from request body
    const { organization_id } = await request.json();

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    // Delete from backend API
    const backendUrl = process.env.NODE_PUBLIC_API_URL || 'http://localhost:8080';
    const backendResponse = await fetch(`${backendUrl}/api/organization-version-control/${organization_id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${backendToken}`,
      },
    });

    if (!backendResponse.ok && backendResponse.status !== 404) {
      const errorData = await backendResponse.json();
      console.error('Backend API error:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || 'Failed to delete GitHub App installation from backend',
        },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'GitHub App disconnected successfully. Please also uninstall the app from GitHub settings.',
    });
  } catch (error) {
    console.error('Error disconnecting GitHub:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
