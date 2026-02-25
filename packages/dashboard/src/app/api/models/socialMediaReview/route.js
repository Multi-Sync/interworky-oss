import { apiUrl } from '@/_common/constants';
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request, { params }) {
  try {
    const response = await axios.get(`${apiUrl}/api/review-reminders/organization/${params.org_id}`, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // Adjust token handling as necessary
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
