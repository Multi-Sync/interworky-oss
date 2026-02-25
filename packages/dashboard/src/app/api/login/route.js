import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const authResponse = await axios.post(`${apiUrl}/api/login`, {
      email,
      password,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      token: authResponse.data.token,
      user: authResponse.data.user,
      status: authResponse.status,
    });

    response.cookies.set('access_token', authResponse.data.token, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 10,
      path: '/',
    });

    return response;
  } catch (error) {
    if (error.response) {
      return NextResponse.json(
        {
          success: false,
          message: error.response.data?.message || 'Authentication failed',
          status: error.response.status,
          data: error.response.data,
        },
        { status: error.response.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Network error',
        status: 500,
      },
      { status: 500 },
    );
  }
}
