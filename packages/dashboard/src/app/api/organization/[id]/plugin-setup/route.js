import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { plugin_setup_method } = body;

    if (!plugin_setup_method || !['github', 'manual'].includes(plugin_setup_method)) {
      return NextResponse.json({ success: false, message: 'Invalid setup method' }, { status: 400 });
    }

    const token = await getToken();

    // Update organization in backend
    const response = await axios.patch(
      `${apiUrl}/api/organizations/${id}/plugin-setup`,
      { plugin_setup_method },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return NextResponse.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error updating plugin setup:', error.response?.data || error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: error.response?.status || 500 });
  }
}
