// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map();

export function getRateLimitHeaders(ip, maxRequests = 100, windowMs = 60 * 1000) {
  const now = Date.now();
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

export function getClientIP(request) {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-client-ip') ||
    'unknown'
  );
}
