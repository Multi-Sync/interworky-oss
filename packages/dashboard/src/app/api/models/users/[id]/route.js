import { NextResponse } from 'next/server';
import axios from 'axios';
import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uri = `${apiUrl}/api/users/${id}`;
    const response = await axios.get(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching user:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data || error.message },
        { status: error.response?.status || 500 },
      );
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const response = await axios.put(`${apiUrl}/users/${params.id}`, body, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // Adjust token handling as necessary
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await axios.delete(`${apiUrl}/users/${params.id}`, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // Adjust token handling as necessary
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
