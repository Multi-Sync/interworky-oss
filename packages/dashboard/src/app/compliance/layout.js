// app/compliance/layout.js
export const metadata = {
  title: 'Compliance & Security | Interworky',
  description:
    'Interworky security and compliance posture: infrastructure hardening, encryption, IAM controls, monitoring, and SDLC best practices. Contact us for full docs.',
  keywords: 'compliance, security, ISO 27001, SOC 2, GDPR, TLS, least privilege, interworky',
  openGraph: {
    title: 'Compliance & Security | Interworky',
    description:
      'Interworky security and compliance posture: infrastructure hardening, encryption, IAM controls, monitoring, and SDLC best practices. Contact us for full docs.',
    url: 'https://interworky.com/compliance',
    siteName: 'Interworky',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://interworky.com/images/compliance-og.png',
        width: 1200,
        height: 630,
        alt: 'Interworky Compliance & Security',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compliance & Security | Interworky',
    description:
      'Interworky security and compliance posture: infrastructure hardening, encryption, IAM controls, monitoring, and SDLC best practices.',
  },
  robots: {
    index: true,
    follow: true,
  },
  canonical: 'https://interworky.com/compliance',
};

export default function ComplianceLayout({ children }) {
  return children;
}
