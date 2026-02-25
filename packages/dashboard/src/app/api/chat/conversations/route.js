import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Backend API base URL
const API_URL = process.env.NODE_PUBLIC_API_URL || 'http://localhost:3015';

/**
 * Get all Carla conversations
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = session.backendToken;
    const userId = session.id;

    if (!token || !userId) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status') || 'active';
    const limit = searchParams.get('limit') || '50';

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const response = await fetch(
      `${API_URL}/api/conversation/carla/conversations?organizationId=${organizationId}&userId=${userId}&status=${status}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations', details: error.message }, { status: 500 });
  }
}

/**
 * Create new Carla conversation
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = session.backendToken;
    const userId = session.id;

    if (!token || !userId) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 400 });
    }

    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const response = await fetch(`${API_URL}/api/conversation/carla/conversations/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        organizationId,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Failed to create conversation', details: error.message }, { status: 500 });
  }
}
