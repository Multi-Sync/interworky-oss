import { NextResponse } from 'next/server';
import { apiUrl } from '@/_common/constants';
import axios from 'axios';

export async function POST(request) {
  try {
    const { email } = await request.json();

    const emailResponse = await axios.post(`${apiUrl}/api/email/resend-setup-account-email`, {
      email,
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data: emailResponse.data,
      status: emailResponse.status,
    });
  } catch (error) {
    if (error.response) {
      return NextResponse.json(
        {
          success: false,
          message: error.response.data?.message || 'Failed to send email',
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
