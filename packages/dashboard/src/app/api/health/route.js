import { NextResponse } from 'next/server';

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map();

function getRateLimitHeaders(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 100; // 100 requests per minute

  const key = `rate_limit:${ip}`;
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

  // Reset if window has passed
  if (now > current.resetTime) {
    current.count = 0;
    current.resetTime = now + windowMs;
  }

  // Increment count
  current.count++;
  rateLimitStore.set(key, current);

  // Calculate remaining requests
  const remaining = Math.max(0, maxRequests - current.count);
  const reset = Math.ceil(current.resetTime / 1000); // Unix timestamp in seconds

  return {
    'RateLimit-Limit': maxRequests.toString(),
    'RateLimit-Remaining': remaining.toString(),
    'RateLimit-Reset': reset.toString(),
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };
}

export async function GET(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  const rateLimitHeaders = getRateLimitHeaders(ip);

  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...rateLimitHeaders,
      },
    },
  );
}

export async function HEAD(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  const rateLimitHeaders = getRateLimitHeaders(ip);

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...rateLimitHeaders,
    },
  });
}
