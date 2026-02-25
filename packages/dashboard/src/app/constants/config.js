// Plan configuration
export const PLAN_CONFIG = {
  PREMIUM_PLAN_ID: process.env.NEXT_PUBLIC_PREMIUM_PLAN_ID || 'e049bbbc-1f9f-4ceb-ad46-9feaba4ed299',
  DEFAULT_BILLING: 'monthly',
};

// Helper to generate checkout URL with environment-aware plan ID
export const getCheckoutUrl = (billing = 'monthly') => {
  return `/checkout?plan=${PLAN_CONFIG.PREMIUM_PLAN_ID}&billing=${billing}`;
};
