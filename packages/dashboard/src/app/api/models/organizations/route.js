import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';

import { getToken } from '@/_common/utils/tokenManager';
export async function POST(request) {
  try {
    const token = await getToken();

    // Parse the request body
    const body = await request.json();

    // Make the request to your backend API
    const response = await fetch(`${apiUrl}/api/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return NextResponse.json(
        { error: errorData.message || 'Failed to create organization' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in organization creation:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
