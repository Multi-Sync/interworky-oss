import { NextResponse } from 'next/server';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function POST(request) {
  try {
    const token = (await getToken()) || process.env.ACCESS_TOKEN;
    const { domain } = await request.json();
    if (!domain) {
      return NextResponse.json({ success: false, message: 'Missing required fields', status: 400 }, { status: 400 });
    }

    const scraperUrl = process.env.SCRAPER_URL;
    const scraperResponse = await axios.post(
      `${scraperUrl}/api/create-extensive-knowledge-realtime`,
      { domain },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 50000,
      },
    );
    return NextResponse.json({
      success: true,
      jobId: scraperResponse.data.jobId,
      message: 'Request processed successfully',
      status: scraperResponse.status,
    });
  } catch (error) {
    if (error.response) {
      return NextResponse.json(
        {
          success: false,
          message: error.response.data?.message || 'Failed to process scraper request',
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
