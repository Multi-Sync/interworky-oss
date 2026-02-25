import { Inter, Nunito_Sans } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';
import InterworkyAnalytics from './components/InterworkyAnalytics';
import { SessionProvider } from './components/SessionProvider';
import { generateCSRFToken } from '@/lib/csrf';
import './globals.css';

// Font optimization - using next/font instead of @import for better performance
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Helvetica Neue', 'Arial', 'sans-serif'],
  adjustFontFallback: true,
  variable: '--font-inter',
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  fallback: ['Inter', 'system-ui', 'sans-serif'],
  variable: '--font-nunito-sans',
});

export async function generateMetadata() {
  return {
    title: 'Interworky - The AI Plugin for Vibe Coding | Voice AI, Bug Hunter & Analytics',
    description: `Add AI voice chat, automatic bug fixing, and smart analytics to your Lovable, Bolt, or Next.js site. Setup in 5 minutes. Works with 200+ tools via n8n.`,
    keywords: [
      'vibe coding',
      'Lovable',
      'Bolt',
      'Next.js',
      'n8n',
      'AI voice chat',
      'AI customer support',
      'automatic bug fixing',
      'website analytics',
      'AI plugin',
    ],
    openGraph: {
      fb: '851610936988745',
      type: 'website',
      locale: 'en_US',
      url: 'https://interworky.com/',
      title: 'Interworky - AI Plugin for Vibe Coding in Production',
      description: `Voice AI that talks to your visitors. Bug hunter that fixes errors while you sleep. Smart analytics that show what's working. For Lovable, Bolt, Next.js & more.`,
      images: [
        {
          url: 'https://interworky.com/interworky-og.png',
          width: 1200,
          height: 630,
          alt: 'Interworky - AI Plugin for Vibe Coding',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@interworkygpt',
      title: 'Interworky - AI Voice, Bug Hunter & Analytics for Vibe-Coded Sites',
      description: `You built it with AI. Now run it with AI. Voice chat, auto-fix bugs, smart analytics. Works with Lovable, Bolt, Next.js. Setup in 5 minutes.`,
      images: ['https://interworky.com/interworky-og.png'],
    },
  };
}

export default function RootLayout({ children }) {
  const csrfToken = generateCSRFToken();

  return (
    <html lang="en" className={'bg-white'}>
      <head>
        {/* DNS Prefetch and Preconnect for external resources */}
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />

        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Critical resource preloads */}
        <link rel="preload" href="/interworky-character.webp" as="image" fetchPriority="high" />
        <link rel="preload" href="/dark-logo.png" as="image" fetchPriority="high" />
        <link rel="preload" href="/finallogo.png" as="image" fetchPriority="high" />

        {/* Viewport and performance meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#058A7C" />
        <meta name="color-scheme" content="dark light" />

        {/* Performance hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <meta name="format-detection" content="telephone=no" />

        {/* CSRF Token */}
        <meta name="csrf-token" content={csrfToken} />

        {/* OAuth 2 Discovery Links */}
        <link rel="oauth-authorization" href="/api/auth/signin" />

        {/* AI Plugin Manifest */}
        <link rel="ai-plugin" href="/.well-known/ai-plugin.json" />

        {/* Schema.org JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Interworky',
              url: 'https://interworky.com',
              logo: 'https://interworky.com/finallogo.png',
              description:
                'Interworky is the AI plugin for vibe coding in production. Add AI voice chat, automatic bug fixing, and smart analytics to your Lovable, Bolt, or Next.js site. Works with 200+ tools via n8n integration.',
              foundingDate: '2024',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'US',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                email: 'hello@interworky.com',
              },
              sameAs: [
                'https://www.instagram.com/interworkygpt',
                'https://www.tiktok.com/@interworky',
                'https://www.facebook.com/Interworky',
                'https://www.linkedin.com/company/inter-worky',
                'https://github.com/Multi-Sync',
              ],
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Interworky Services',
                itemListElement: [
                  {
                    '@type': 'Offer',
                    name: 'AI Customer Support',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Voice & Text AI',
                      description:
                        'AI-powered voice and text chat that collects leads, books appointments, and answers questions 24/7. The most human-sounding AI voice available.',
                    },
                  },
                  {
                    '@type': 'Offer',
                    name: 'AI Bug Hunter',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Automatic Bug Fixing',
                      description:
                        'Detects errors instantly and creates fixes with GitHub PR integration. Monitors 10,000+ device types. No more 3am debugging sessions.',
                    },
                  },
                  {
                    '@type': 'Offer',
                    name: 'Smart Analytics',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Website Analytics',
                      description:
                        'Simple analytics showing what visitors want, where they drop off, and how to convert more. Free with every plan.',
                    },
                  },
                ],
              },
            }),
          }}
        />

        {/* WebSite Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Interworky',
              url: 'https://interworky.com',
              description:
                'The AI plugin for vibe coding in production. Add voice AI, bug hunting, and analytics to your Lovable, Bolt, or Next.js site in 5 minutes.',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://interworky.com/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />

        {/* SoftwareApplication Schema for the main product */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Interworky - AI Plugin for Vibe Coding',
              applicationCategory: 'WebApplication',
              operatingSystem: 'Web',
              offers: [
                {
                  '@type': 'Offer',
                  name: 'AI Customer Support',
                  description: 'Voice and text AI that collects leads, books appointments, and answers questions 24/7',
                },
                {
                  '@type': 'Offer',
                  name: 'AI Bug Hunter',
                  description: 'Automatic error detection and bug fixing with GitHub PR integration',
                },
                {
                  '@type': 'Offer',
                  name: 'Smart Analytics',
                  description: 'Simple analytics to understand visitor behavior and improve conversions',
                },
              ],
              publisher: {
                '@type': 'Organization',
                name: 'Interworky',
              },
              description:
                'The AI plugin for vibe coding in production. Works with Lovable, Bolt, Next.js, and any modern framework. Integrates with 200+ tools via n8n.',
              featureList: [
                'AI Voice Chat',
                'AI Text Chat',
                'Automatic Bug Detection',
                'GitHub PR Auto-Fix',
                'Smart Analytics',
                'n8n Integration',
                '200+ Tool Integrations',
                'Works with Lovable',
                'Works with Bolt',
                'Works with Next.js',
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${nunitoSans.variable} font-sans min-h-dvh antialiased`}>
        <InterworkyAnalytics />
        {/* Google Analytics - Load after critical resources */}
        <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-BKYN0M1YRE" defer />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-BKYN0M1YRE', {
                page_title: document.title,
                page_location: window.location.href,
                cookie_flags: 'SameSite=None;Secure'
              });
            `}
        </Script>
        {/* <CookieConsent /> */}
        <SessionProvider>
          {children}
          <Toaster
            position="top-right"
            containerStyle={{
              zIndex: 99999999,
            }}
            toastOptions={{
              className: 'dark:!text-white !text-gray-900',
              style: {
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(168, 85, 247, 0.15)',
                color: '#111827',
                padding: '16px',
              },
              success: {
                duration: 4000,
                className: 'dark:!text-white !text-gray-900',
                style: {
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.15))',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  boxShadow: '0 8px 32px rgba(34, 197, 94, 0.2)',
                  backdropFilter: 'blur(16px)',
                  color: '#065f46',
                },
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                className: 'dark:!text-white !text-gray-900',
                style: {
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15))',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
                  backdropFilter: 'blur(16px)',
                  color: '#991b1b',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
              loading: {
                className: 'dark:!text-white !text-gray-900',
                style: {
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.15))',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  boxShadow: '0 8px 32px rgba(168, 85, 247, 0.2)',
                  backdropFilter: 'blur(16px)',
                  color: '#6b21a8',
                },
                iconTheme: {
                  primary: '#a855f7',
                  secondary: '#fff',
                },
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
