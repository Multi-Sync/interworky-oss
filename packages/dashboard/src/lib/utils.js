import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names using clsx and then optimizes them using tailwind-merge
 * @param  {...any} inputs - Class names to be combined
 * @returns {string} - Optimized class name string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getEnvironment() {
  const url = process.env.NEXT_PUBLIC_API_URL;
  return url?.includes('staging') ? 'staging' : url.includes('localhost') ? 'development' : 'production';
}
