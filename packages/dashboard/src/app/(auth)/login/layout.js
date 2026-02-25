export const metadata = {
  title: 'Login | Interworky',
  description:
    'Log in to your Interworky account to access powerful AI solutions for your website, including chatbot customization, user support, and integrations.',
  keywords: 'login, sign in, account login, AI solutions, chatbot login, Interworky, secure login',
  openGraph: {
    title: 'Login | Interworky',
    description: 'Access your Interworky account to manage AI-driven chat solutions and integrations.',
    url: 'https://interworky.com/login',
    siteName: 'Interworky',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Login | Interworky',
    description: 'Login to your Interworky account and start using AI-powered solutions.',
  },
  alternates: {
    canonical: 'https://interworky.com/login',
  },
};
export default function AuthLayout({ children }) {
  return <div className="auth-layout">{children}</div>;
}
