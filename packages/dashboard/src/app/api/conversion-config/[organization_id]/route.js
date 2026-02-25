import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

// GET active conversion config
export async function GET(request, { params }) {
  try {
    const { organization_id } = await params;
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uri = `${apiUrl}/api/conversion-config/${organization_id}`;

    const response = await axios.get(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching conversion config:', error.response?.data || error.message);

    // If no config found, return empty instead of error
    if (error.response?.status === 404) {
      return NextResponse.json({ config: null }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: error.message }, { status: error.response?.status || 500 });
  }
}

// POST new conversion config
export async function POST(request, { params }) {
  try {
    const { organization_id } = await params;
    const body = await request.json();
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uri = `${apiUrl}/api/conversion-config/${organization_id}`;

    const response = await axios.post(uri, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating conversion config:', error);
    if (axios.isAxiosError(error)) {
      // Extract error message from backend response
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to create conversion config';
      return NextResponse.json({ error: errorMessage }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PUT update conversion config
export async function PUT(request, { params }) {
  try {
    const { organization_id } = await params;
    const body = await request.json();
    const { id, ...updateData } = body;
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 });
    }

    const uri = `${apiUrl}/api/conversion-config/${organization_id}/${id}`;

    const response = await axios.put(uri, updateData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating conversion config:', error);
    if (axios.isAxiosError(error)) {
      // Extract error message from backend response
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to update conversion config';
      return NextResponse.json({ error: errorMessage }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE conversion config
export async function DELETE(request, { params }) {
  try {
    const { organization_id } = await params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 });
    }

    const uri = `${apiUrl}/api/conversion-config/${organization_id}/${id}`;

    const response = await axios.delete(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error deleting conversion config:', error);
    if (axios.isAxiosError(error)) {
      // Extract error message from backend response
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to delete conversion config';
      return NextResponse.json({ error: errorMessage }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
