'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import useSWR from 'swr';
import { BeatLoader } from 'react-spinners';

import useScriptSrc from '@/_common/hooks/useScriptSrc';
import { fetcher } from '@/_common/utils/swrFetcher';
import { decodeApiKey } from '@/_common/utils/utils';
import { Button } from '@/app/components/ui/Button';
import { useNotification } from '@/_common/utils/handleSlackNotification';

export default function OrganizationDemoPage() {
  const searchParams = useSearchParams();
  const scriptSrc = useScriptSrc();
  const { handleNotification } = useNotification();
  const hasTrackedDemoView = useRef(false);

  const apiKey = searchParams.get('apikey') || '';
  const token = searchParams.get('token') || '';
  const preview = searchParams.get('preview') === '1' || searchParams.get('preview') === 'true';

  const [orgId, setOrgId] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [shouldRemoveScript, setShouldRemoveScript] = useState(false);

  // Decode API key -> orgId
  useEffect(() => {
    let alive = true;
    if (!apiKey) {
      setOrgId('');
      setIsDecoding(false);
      return;
    }
    setIsDecoding(true);
    decodeApiKey(apiKey)
      .then(decoded => {
        if (alive && decoded?.orgId) setOrgId(decoded.orgId);
        if (alive) setIsDecoding(false);
      })
      .catch(() => {
        if (alive) {
          setOrgId('');
          setIsDecoding(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [apiKey]);

  // Fetch organization (only when we have orgId)
  const { data, error } = useSWR(orgId ? `/api/models/organizations/${orgId}` : null, fetcher, {
    revalidateOnFocus: false,
  });

  const orgWebsite = useMemo(() => {
    const website = data?.organization?.organization_website || '';
    if (!website) return '';

    // If the website doesn't start with http:// or https://, prepend https://
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
      return `https://${website}`;
    }

    return website;
  }, [data?.organization?.organization_website]);

  const cta = useMemo(() => {
    if (preview) {
      return {
        href: '/dashboard/assistantInfo',
        label: 'Go to your account',
      };
    }
    return {
      href: token ? `/reset-password?token=${encodeURIComponent(token)}` : '/login',
      label: token ? 'Finish setting up your account' : 'Sign in',
    };
  }, [preview, token]);

  // Track demo page view (only for users coming from /new flow)
  useEffect(() => {
    if (hasTrackedDemoView.current || preview) return;

    // Get pendingSync data from sessionStorage (set during /new flow)
    const pendingSyncData = sessionStorage.getItem('pendingSync');
    if (pendingSyncData && orgWebsite) {
      try {
        const { domain } = JSON.parse(pendingSyncData);
        handleNotification(`[/new → Demo] User viewing demo: ${domain}`);
        hasTrackedDemoView.current = true;
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [orgWebsite, preview, handleNotification]);

  const handleCtaClick = () => {
    // Track CTA click for users from /new flow
    const pendingSyncData = sessionStorage.getItem('pendingSync');
    if (pendingSyncData) {
      try {
        const { domain } = JSON.parse(pendingSyncData);
        const ctaLabel = preview ? 'Go to account' : 'Finish setting up';
        handleNotification(`[/new → Setup] User clicked "${ctaLabel}": ${domain}`);
      } catch (e) {
        // Ignore parse errors
      }
    }
    setShouldRemoveScript(true);
  };

  return (
    <>
      {/* Interworky widget loader (single source of truth) */}
      {apiKey && scriptSrc && !shouldRemoveScript && (
        <Script
          src={scriptSrc}
          data-api-key={apiKey}
          data-position="bottom-0 right-0"
          data-landing="true"
          strategy="lazyOnload"
          onReady={() => {
            // Initialize once the script is ready
            try {
              window?.Interworky?.init?.();
            } catch (_) {}
          }}
          onError={err => {
            // Swallow script errors to avoid breaking the demo page
            console.error('Error loading Interworky script:', err);
          }}
        />
      )}

      <div className="relative h-screen">
        {/* Preview / CTA banner */}
        <div
          className="fixed z-[90] top-10 inset-x-0 px-3 pb-[calc(env(safe-area-inset-bottom,0)+12px)] pointer-events-none"
          aria-live="polite"
        >
          <div className="pointer-events-auto mx-auto flex w-fit max-w-md items-center gap-2 rounded-xl border border-white/10 bg-black/85 p-3 text-white shadow-xl backdrop-blur-md sm:max-w-2xl sm:rounded-2xl sm:p-4 sm:flex-row sm:gap-3">
            <span className="font-bold tracking-wider">{preview ? 'Preview Mode' : 'Demo Mode'}</span>
            <Button aschild="true" onClick={handleCtaClick}>
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          </div>
        </div>

        {/* Main preview area */}
        {isDecoding ? (
          <div className="flex h-full items-center justify-center bg-gray-100">
            <div className="text-center">
              <BeatLoader color="#058A7C" size={20} />
              <p className="mt-4 text-gray-600">Initializing demo…</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center bg-gray-100">
            <div className="text-center">
              <p className="text-gray-600">Could not load organization. Please try again.</p>
            </div>
          </div>
        ) : orgWebsite ? (
          <iframe
            title="Organization website"
            src={orgWebsite}
            width="100%"
            height="100%"
            className="absolute inset-0 z-[1] h-full w-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-100">
            <div className="text-center">
              <BeatLoader color="#058A7C" size={20} />
              <p className="mt-4 text-gray-600">Loading website…</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
