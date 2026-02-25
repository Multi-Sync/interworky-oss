import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// Backend API base URL
const API_URL = process.env.NODE_PUBLIC_API_URL || 'http://localhost:3015';

export async function POST(request) {
  try {
    const { message, organizationId, conversationId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Get user session for authentication (NextAuth v5)
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract token and user ID from session
    const token = session.backendToken;
    const userId = session.id;

    if (!token || !userId) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 400 });
    }

    // Get or create conversation if not provided
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const initResponse = await fetch(`${API_URL}/api/conversation/carla/init`, {
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

      if (!initResponse.ok) {
        throw new Error('Failed to initialize conversation');
      }

      const conversation = await initResponse.json();
      activeConversationId = conversation.id;
    }

    // Send message to backend
    const messageResponse = await fetch(`${API_URL}/api/conversation/carla/${activeConversationId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!messageResponse.ok) {
      const errorData = await messageResponse.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    const result = await messageResponse.json();

    return NextResponse.json({
      success: true,
      message: result.message,
      conversationId: activeConversationId,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process message',
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    // Get user session for authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = session.backendToken;
    const userId = session.id;

    if (!token || !userId) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 400 });
    }

    // Get params from query
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const conversationId = searchParams.get('conversationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const bodyPayload = {
      organizationId,
      userId,
      ...(conversationId && { conversationId }), // Only include if not null/undefined
    };

    // Get or create conversation (supports conversationId for loading specific conversation)
    const initResponse = await fetch(`${API_URL}/api/conversation/carla/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!initResponse.ok) {
      throw new Error('Failed to get conversation');
    }

    const conversation = await initResponse.json();

    return NextResponse.json({
      success: true,
      messages: conversation.messages || [],
      conversationId: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      lastActivity: conversation.updatedAt,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to get messages', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    // Conversation clearing is handled on the frontend
    // Backend conversation remains for history/analytics
    return NextResponse.json({
      success: true,
      message: 'Conversation cleared successfully',
    });
  } catch (error) {
    console.error('Clear conversation error:', error);
    return NextResponse.json({ error: 'Failed to clear conversation', details: error.message }, { status: 500 });
  }
}
