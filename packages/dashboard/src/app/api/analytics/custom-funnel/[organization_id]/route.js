import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const { organization_id } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uri = `${apiUrl}/api/visitor-journey/analytics/custom-funnel/${organization_id}?period=${period}`;

    const response = await axios.get(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching custom funnel:', error.response?.data || error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: error.response?.status || 500 });
  }
}
