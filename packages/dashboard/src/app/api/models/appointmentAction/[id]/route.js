import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function PUT(request, { params }) {
  try {
    // Extract appointment id from the URL parameters
    const { id } = params;
    const { date, status } = await request.json();

    const token = await getToken();

    // update the appointment status using the appointment_id

    const body = {};

    // Only add status to the body if it's provided
    if (status !== undefined) {
      body.status = status;
    }

    // Only add date to the body if it's provided
    if (date !== undefined) {
      body.date = date;
    }
    const response = await axios.put(`${apiUrl}/api/appointments/${id}`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating appointment status:', error.response.data);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
