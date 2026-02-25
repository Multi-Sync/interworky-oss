import { apiUrl } from '@/_common/constants';
import { getToken } from '@/_common/utils/tokenManager';

// --- small helper: safe fetch with timeout and nice errors ---
async function safeFetch(url, { method = 'GET', headers = {}, timeoutMs = 6500 } = {}) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method, headers, signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} on ${url}${text ? ` , ${text.slice(0, 180)}` : ''}`);
    }
    return await res.json();
  } finally {
    clearTimeout(to);
  }
}

async function getOrganizationAndAssistantInfo(orgName) {
  if (!orgName || typeof orgName !== 'string') {
    throw new Error('Invalid organization name.');
  }

  // Token may be absent; only set header when present.
  let headers = { 'Content-Type': 'application/json' };
  try {
    const token = await getToken();
    if (token) headers = { ...headers, Authorization: `Bearer ${token}` };
  } catch {
    // Non-fatal: continue without auth header
  }

  // 1) Organization lookup
  const orgUrl = `${apiUrl}/api/organizations/organization_name/${orgName}`;
  const orgData = await safeFetch(orgUrl, { headers });

  const organizationId = orgData?.organization?.id;
  if (!organizationId) {
    throw new Error('Organization not found or missing ID.');
  }

  // 2) Assistant info
  const assistantUrl = `${apiUrl}/api/assistant-info/${encodeURIComponent(organizationId)}`;
  const assistantData = await safeFetch(assistantUrl, { headers });

  return { assistantData };
}

// Next.js App Router
export async function generateMetadata({ params }) {
  const { orgName } = await params;
  const baseTitle = `Try ${orgName} AI agent on Interworky`;
  const baseDescription = `Experience the power of ${orgName} AI agent on Interworky`;

  try {
    const { assistantData } = await getOrganizationAndAssistantInfo(orgName);
    const imageUrl = assistantData?.assistant_image_url;

    const metadata = {
      title: baseTitle,
      description: baseDescription,
      openGraph: {
        title: baseTitle,
        description: baseDescription,
        siteName: 'Interworky',
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: baseTitle,
        description: baseDescription,
      },
    };

    // Only attach images if we have a valid URL
    if (imageUrl && typeof imageUrl === 'string') {
      metadata.openGraph.images = [
        {
          url: imageUrl,
          width: 600,
          height: 400,
          alt: `${orgName} Carla`,
        },
      ];
      metadata.twitter.images = [imageUrl];
    }

    return metadata;
  } catch (err) {
    // Keep logs compact but useful in server console
    console.error('[generateMetadata] Failed:', err?.message || err);
    // Return minimal, valid metadata without images
    return {
      title: baseTitle,
      description: baseDescription,
      openGraph: {
        title: baseTitle,
        description: baseDescription,
        siteName: 'Interworky',
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: baseTitle,
        description: baseDescription,
      },
    };
  }
}

export default function OrganizationLayout({ children }) {
  return <>{children}</>;
}
