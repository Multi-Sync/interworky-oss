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
    const { phoneNumber, code } = await request.json();
    const fullPhoneNumber = `${phoneNumber}`;

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

    const verificationCheck = await twilioClient.verify.v2.services(twilioVerifySID).verificationChecks.create({
      to: fullPhoneNumber,
      code: code,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification successful',
      data: verificationCheck,
      status: 200,
    });
  } catch (error) {
    if (error.response) {
      return NextResponse.json(
        {
          success: false,
          message: error.response?.message || 'Invalid verification code',
          status: error.response?.status || 401,
          data: error.response,
        },
        { status: error.response?.status || 401 },
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
