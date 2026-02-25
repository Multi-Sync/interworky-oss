/**
 * GitHub MCP Server - Update Credentials Endpoint
 * Updates existing GitHub credentials via backend API
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function PUT(request) {
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

    const { github_token, repo_owner, repo_name, organization_id } = await request.json();

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    // Update via backend API
    const backendUrl = process.env.NODE_PUBLIC_API_URL || 'http://localhost:8080';
    const backendResponse = await fetch(`${backendUrl}/api/organization-version-control/${organization_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${backendToken}`,
      },
      body: JSON.stringify({
        github_token,
        github_repo_owner: repo_owner,
        github_repo_name: repo_name,
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('Backend API error:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || 'Failed to update GitHub credentials',
        },
        { status: backendResponse.status },
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json({
      success: true,
      message: 'GitHub credentials updated successfully',
      data,
    });
  } catch (error) {
    console.error('Error updating GitHub credentials:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
