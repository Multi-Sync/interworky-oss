import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function GET(request, { params }) {
  try {
    const token = await getToken();
    const { organization_id } = await params;

    const response = await axios.get(`${apiUrl}/api/organization-assistants/organization/${organization_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const assistantsData = response.data;
    return NextResponse.json(assistantsData);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const org_id = await params.org_id;
    const token = await getToken();
    await axios.delete(`${apiUrl}/organization-assistants/${org_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
