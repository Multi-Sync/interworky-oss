import crypto from 'crypto';

// Generate a CSRF token
export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Validate a CSRF token

// Get CSRF token from meta tag
export function getCSRFTokenFromMeta() {
  if (typeof document !== 'undefined') {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : null;
  }
  return null;
}
