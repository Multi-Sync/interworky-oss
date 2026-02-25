import { NextResponse } from 'next/server';
import axios from 'axios';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

// Validate that each method has all required fields based on capability_type.
function validateMethod(method) {
  const capabilityType = method.capability_type || 'http';

  const baseRequiredFields = ['method_name', 'method_instruction', 'method_description', 'dynamic_params', 'return'];

  // Check base required fields
  for (const field of baseRequiredFields) {
    if (!method[field]) {
      return `Missing required field: ${field}`;
    }
  }

  // Type-specific validation
  if (capabilityType === 'http') {
    if (!method.method_verb) {
      return 'Missing required field for HTTP capability: method_verb';
    }
    if (!method.method_endpoint) {
      return 'Missing required field for HTTP capability: method_endpoint';
    }
  } else if (capabilityType === 'email') {
    if (!method.email_config) {
      return 'Missing required field for email capability: email_config';
    }
    if (!method.email_config.to) {
      return 'Missing required field in email_config: to';
    }
    if (!method.email_config.subject) {
      return 'Missing required field in email_config: subject';
    }
  }

  // Ensure dynamic_params is an object.
  if (typeof method.dynamic_params !== 'object' || method.dynamic_params === null) {
    return 'dynamic_params must be an object';
  }

  return null;
}

export async function POST(request) {
  try {
    const payload = await request.json();

    // Validate payload structure.
    if (!payload.assistant_id || !payload.methods || !Array.isArray(payload.methods)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload structure. Expected "assistant_id" and "methods" array.' },
        { status: 400 },
      );
    }

    // Validate each organization method.
    for (let i = 0; i < payload.methods.length; i++) {
      const errorMsg = validateMethod(payload.methods[i]);
      if (errorMsg) {
        return NextResponse.json(
          { success: false, message: `Validation error in method index ${i}: ${errorMsg}` },
          { status: 400 },
        );
      }
    }

    // Retrieve token (if applicable)
    const token = await getToken();

    // Forward the payload to the backend endpoint.
    const response = await axios.post(`${apiUrl}/api/organization-methods/bulk`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error processing bulk organization methods:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process bulk organization methods.' },
      { status: 500 },
    );
  }
}
