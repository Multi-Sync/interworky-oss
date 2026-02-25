'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * InterworkyAnalytics Component
 *
 * Loads the Interworky assistant script for analytics and visitor journey tracking
 * on all pages EXCEPT excluded routes.
 *
 * Features:
 * - Excludes /dashboard/* routes (testing happens in AssistantInfoView)
 * - Excludes /new and /reset-password routes (onboarding flow)
 * - Tracks visitor journeys across non-excluded pages
 * - Collects performance metrics
 * - Persists session data across page navigations
 * - Uses manual script loading for better control and cleanup
 */
export default function InterworkyAnalytics() {
  const pathname = usePathname();

  // Determine environment based on hostname
  const getEnvironment = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
      } else if (hostname === 'staging.interworky.com') {
        return 'staging';
      }
    }
    return 'production';
  };

  // Paths where the assistant should not appear
  const EXCLUDED_PATHS = ['/dashboard', '/new', '/reset-password'];

  useEffect(() => {
    // Don't load on excluded routes
    const isExcludedRoute = EXCLUDED_PATHS.some(path => pathname === path || pathname?.startsWith(path + '/'));

    if (isExcludedRoute) {
      return;
    }

    // Determine script source and API key based on environment
    const env = getEnvironment();
    let scriptSrc;
    let apiKey;

    if (env === 'development') {
      // Use local development bundle
      scriptSrc = process.env.NEXT_PUBLIC_INTERWORKY_SCRIPT_SRC || 'http://localhost:8080/bundle.js';
      apiKey = process.env.NEXT_PUBLIC_INTERWORKY_SCRIPT_API_KEY;
    } else if (env === 'staging') {
      // Use staging bundle from GCS
      scriptSrc = 'https://storage.googleapis.com/multisync/interworky/staging/interworky.js';
      apiKey = 'ZDMzNmE5NDktMDk4Yy00MTRhLWEzZDMtMmUzODBmZjNiZDMyJCRhc3N0X093MG1jWFdyaGNPTnpDSFF6TjZ5aHVTUg==';
    } else {
      // Use production bundle from GCS
      scriptSrc = 'https://storage.googleapis.com/multisync/interworky/production/interworky.js';
      apiKey = 'MTA0YjJiYzYtZWEwZi00MjAyLTg5MjktZWVmY2Q2ZTIzMGQ4OmFzc3RfWkxZU0pCOXVkVnE4eVluendxZDU2YU10';
    }

    if (!scriptSrc || !apiKey) {
      console.warn('Interworky analytics: Missing script source or API key');
      return;
    }

    // Delay script loading to not block critical rendering
    const timeoutId = setTimeout(() => {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.dataset.apiKey = apiKey;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        // Initialize after a small delay to not interfere with main thread
        setTimeout(() => {
          window.Interworky?.init?.();
        }, 100);
      };

      script.onerror = e => {
        console.error('Keepalive fetch failed:', e);
        // Retry logic
        const maxRetries = 3;
        let attempt = 0;
        const retryFetch = (url, options) => {
          return fetch(url, options).catch(err => {
            if (attempt < maxRetries) {
              attempt++;
              console.warn(`Retrying fetch... Attempt ${attempt}`);
              return retryFetch(url, options);
            }
            console.error('Failed to fetch after retries:', err);
            sendErrorReport(err);
          });
        };
        retryFetch(scriptSrc);
      };

      const sendErrorReport = error => {
        // Logic to send error report, e.g., email to hello@interworky.com
      };

      // Append to body for better performance
      document.body.appendChild(script);
    }, 1000); // Small delay to prioritize core content rendering

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);

      // Remove Interworky instance
      if (window.Interworky) {
        window.Interworky.remove?.();
      }

      // Remove script tags
      document.querySelectorAll('script[data-api-key]').forEach(scriptElement => {
        // Only remove analytics scripts, not the testing script in AssistantInfoView
        if (scriptElement.dataset.landing !== 'true' && scriptElement.dataset.voiceOnly !== 'true') {
          scriptElement.remove();
        }
      });
    };
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
