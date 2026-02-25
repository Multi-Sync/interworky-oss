import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';
import { signIn } from '@/auth';

export async function POST(request) {
  try {
    const { id, password } = await request.json();

    const authResponse = await axios.post(`${apiUrl}/api/reset-password/${id}`, {
      password,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password reset successful',
      data: authResponse.data,
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

    const result = await signIn('credentials', {
      email: authResponse.data.user.email,
      password: password,
      redirect: false,
    });

    if (result?.error) {
      return NextResponse.json({
        success: false,
        message: 'Authentication failed after password reset',
      });
    }
    return NextResponse.json({
      success: true,
      message: 'Password reset successful',
      data: authResponse.data,
      token: authResponse.data.token,
      user: authResponse.data.user,
      status: authResponse.status,
    });
  } catch (error) {
    if (error.response) {
      return NextResponse.json(
        {
          success: false,
          message: error.response.data?.message || 'Password reset failed',
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
