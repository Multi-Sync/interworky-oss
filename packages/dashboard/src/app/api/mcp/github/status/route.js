/**
 * GitHub App Status Endpoint
 * Checks if GitHub App is installed for the organization
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
    const backendResponse = await fetch(`${backendUrl}/api/organization-version-control/${organization_id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${backendToken}`,
      },
    });

    if (backendResponse.status === 404 || !backendResponse.ok) {
      return NextResponse.json({
        connected: false,
        message: 'GitHub App not installed',
        setupInstructions: {
          step1: 'Click "Connect GitHub" button in settings',
          step2: 'You will be redirected to GitHub',
          step3: 'Select the repository you want to connect',
          step4: 'Click "Install" and you will be redirected back',
        },
      });
    }

    const backendData = await backendResponse.json();
    const installation = backendData.data;

    if (!installation || !installation.github_app_installation_id) {
      return NextResponse.json({
        connected: false,
        message: 'GitHub App not installed',
      });
    }

    return NextResponse.json({
      connected: true,
      provider: 'github_app',
      installation_id: installation.github_app_installation_id,
      repo: installation.github_repo_full_name,
      repo_owner: installation.github_repo_owner,
      repo_name: installation.github_repo_name,
      hasWriteAccess: installation.has_write_access,
      connectedAt: installation.connected_at,
      capabilities: [
        'create_pr',
        'create_issue',
        'read_file',
        'search_code',
        installation.has_write_access && 'push',
      ].filter(Boolean),
    });
  } catch (error) {
    console.error('Error checking GitHub status:', error);
    return NextResponse.json(
      {
        connected: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
