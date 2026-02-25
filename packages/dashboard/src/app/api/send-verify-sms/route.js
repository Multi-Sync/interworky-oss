import { twilioAccountSID, twilioAuthToken, twilioVerifySID } from '@/_common/constants';

import { NextResponse } from 'next/server';
import twilio from 'twilio';

export const dynamic = 'force-dynamic';

// Initialize client lazily to avoid build-time errors
let client;
const getClient = () => {
  if (!client && twilioAccountSID && twilioAuthToken) {
    client = twilio(twilioAccountSID, twilioAuthToken);
  }
  return client;
};

export async function POST(request) {
  try {
    const { phoneNumber } = await request.json();

    const twilioClient = getClient();
    if (!twilioClient) {
      return NextResponse.json(
        {
          success: false,
          message: 'Twilio configuration is missing',
          status: 500,
        },
        { status: 500 },
      );
    }

    const verification = await twilioClient.verify.v2.services(twilioVerifySID).verifications.create({
      to: phoneNumber,
      channel: 'sms',
    });

    return NextResponse.json({
      success: true,
      message: 'Verification SMS sent successfully',
      data: verification,
      status: 200,
    });
  } catch (error) {
    if (error.response) {
      return NextResponse.json(
        {
          success: false,
          message: error.response?.message || 'Failed to send verification SMS',
          status: error.response?.status || 400,
          data: error.response,
        },
        { status: error.response?.status || 400 },
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
