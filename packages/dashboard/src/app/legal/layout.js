// app/legal/layout.js
export const metadata = {
  title: 'Legal & Corporate Information | Interworky',
  description:
    'Corporate registry, SLA, terms of service, and privacy policy for Interworky - operated by MultiSync Inc., a Delaware C-Corp.',
  keywords: 'legal, corporate information, SLA, terms of service, privacy policy, Delaware, C-Corp, interworky',
  openGraph: {
    title: 'Legal & Corporate Information | Interworky',
    description:
      'Corporate registry, SLA, terms of service, and privacy policy for Interworky - operated by MultiSync Inc., a Delaware C-Corp.',
    url: 'https://interworky.com/legal',
    siteName: 'Interworky',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://interworky.com/images/legal-og.png',
        width: 1200,
        height: 630,
        alt: 'Interworky Legal & Corporate Information',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legal & Corporate Information | Interworky',
    description:
      'Corporate registry, SLA, terms of service, and privacy policy for Interworky - operated by MultiSync Inc.',
  },
  robots: {
    index: true,
    follow: true,
  },
  canonical: 'https://interworky.com/legal',
};

export default function LegalLayout({ children }) {
  return children;
}
