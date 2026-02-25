import { NextResponse } from 'next/server';
import axios from 'axios';
import { getToken } from '@/_common/utils/tokenManager';
import { getRateLimitHeaders, getClientIP } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = getClientIP(request);
    const rateLimitHeaders = getRateLimitHeaders(ip, 50, 60 * 1000); // 50 requests per minute for this endpoint

    const token = (await getToken()) || process.env.ACCESS_TOKEN;
    const { domain } = await request.json();
    if (!domain) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields', status: 400 },
        { status: 400, headers: rateLimitHeaders },
      );
    }

    const scraperUrl = process.env.SCRAPER_URL;
    const scraperResponse = await axios.post(
      `${scraperUrl}/api/run-agent-checker/`,
      { domain },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 50000,
      },
    );
    return NextResponse.json(
      {
        success: true,
        jobId: scraperResponse.data.jobId,
        message: 'Request processed successfully',
        status: scraperResponse.status,
      },
      { headers: rateLimitHeaders },
    );
  } catch (error) {
    if (error.response) {
      return NextResponse.json(
        {
          success: false,
          message: error.response.data?.message || 'Failed to process scraper request',
          status: error.response.status,
          data: error.response.data,
        },
        { status: error.response.status, headers: rateLimitHeaders },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Network error',
        status: 500,
      },
      { status: 500, headers: rateLimitHeaders },
    );
  }
}
