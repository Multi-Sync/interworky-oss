import { NextResponse } from 'next/server';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';

export async function POST(request, { params }) {
  // Try to get domain from URL params first (for backward compatibility)
  const awaitedParams = await params;
  let domain = awaitedParams?.domain;

  // If not in params, try to get from request body
  if (!domain) {
    try {
      const body = await request.json();
      domain = body.domain;
    } catch (error) {
      console.error('Error parsing request body:', error);
    }
  }

  if (!domain) {
    return NextResponse.json({ error: 'Missing domain' }, { status: 400 });
  }
  try {
    const token = (await getToken()) || process.env.ACCESS_TOKEN;
    const scraperUrl = process.env.SCRAPER_URL;
    const scraperResponse = await axios.post(
      `${scraperUrl}/api/analyze-website`,
      { domain },
      {
        headers: {
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
