import { getToken } from '@/_common/utils/tokenManager';
import { NextResponse } from 'next/server';
import { getRateLimitHeaders, getClientIP } from '@/lib/rateLimit';

async function fetchWithTimeout(url, options, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request, { params }) {
  const ip = getClientIP(request);
  const rateLimitHeaders = getRateLimitHeaders(ip, 200, 60 * 1000); // 200 requests per minute for status checks

  const token = await getToken();
  const { job_id } = await params;

  if (!job_id) {
    return NextResponse.json({ error: 'Missing job ID' }, { status: 400, headers: rateLimitHeaders });
  }

  try {
    const scraperUrl = process.env.SCRAPER_URL;
    const response = await fetchWithTimeout(
      `${scraperUrl}/api/status/${job_id}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      15000,
    );

    if (!response.ok) {
      throw new Error(`Scraper status error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200, headers: rateLimitHeaders });
  } catch (error) {
    console.error('Error in scraper status API:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: rateLimitHeaders });
  }
}
