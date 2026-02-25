import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Backend API base URL
const API_URL = process.env.NODE_PUBLIC_API_URL || 'http://localhost:3015';

/**
 * Update conversation title
 */
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = session.backendToken;

    if (!token) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 400 });
    }

    const { conversationId } = params;
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const response = await fetch(`${API_URL}/api/conversation/carla/conversations/${conversationId}/title`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error('Failed to update conversation title');
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update conversation title error:', error);
    return NextResponse.json({ error: 'Failed to update conversation title', details: error.message }, { status: 500 });
  }
}

/**
 * Archive conversation
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = session.backendToken;

    if (!token) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 400 });
    }

    const { conversationId } = params;

    const response = await fetch(`${API_URL}/api/conversation/carla/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to archive conversation');
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Archive conversation error:', error);
    return NextResponse.json({ error: 'Failed to archive conversation', details: error.message }, { status: 500 });
  }
}
