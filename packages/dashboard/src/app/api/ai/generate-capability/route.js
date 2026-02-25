import { NextResponse } from 'next/server';
import axios from 'axios';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

/**
 * POST /api/ai/generate-capability
 * Generates a capability definition from natural language description using AI
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { description, organization_email } = body;

    if (!description) {
      return NextResponse.json({ success: false, message: 'Description is required' }, { status: 400 });
    }

    // Get auth token
    const token = await getToken();

    // Call backend AI generation endpoint
    const response = await axios.post(
      `${apiUrl}/api/organization-methods/generate`,
      {
        description,
        organization_email,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error generating capability:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to generate capability';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
