import { NextResponse } from 'next/server';
import axios from 'axios';
import { apiUrl } from '@/_common/constants';

export async function GET() {
  try {
    const response = await axios.get(`${apiUrl}/api/users`, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // Adjust token handling as necessary
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { firstName, lastName, email, phone, role } = await request.json();
    const response = await axios.post(`${apiUrl}/users`, {
      firstName,
      lastName,
      email,
      phone,
      role,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
