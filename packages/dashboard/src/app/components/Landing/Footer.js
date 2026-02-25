'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FaLinkedin, FaFacebook, FaInstagram, FaTiktok, FaXTwitter, FaDiscord } from 'react-icons/fa6';
import { SiThreads } from 'react-icons/si';
import UserInfoModal from '../UserInfoModal';

const productLinks = [
  { name: 'Dashboard', link: '/dashboard/home' },
  { name: 'Login', link: '/login' },
  { name: 'Create Account', link: '/setup-account' },
  { name: 'Forgot Password', link: '/forget-password' },
];

const resourceLinks = [
  { name: 'Documentation', link: 'https://carla.interworky.com', external: true },
  { name: 'GitHub', link: 'https://github.com/Multi-Sync', external: true },
  { name: 'npm Package', link: 'https://www.npmjs.com/package/@interworky/carla-nextjs', external: true },
  { name: 'Blog', link: '/blog' },
];

const companyLinks = [
  { name: 'About Us', link: '/legal' },
  { name: 'Compliance', link: '/compliance' },
  { name: 'Contact', link: 'mailto:hello@interworky.com' },
];

const legalLinks = [
  { name: 'Privacy Policy', link: '/privacy' },
  { name: 'Terms of Service', link: '/terms' },
  { name: 'Legal', link: '/legal' },
  { name: 'SLA', link: '/legal#service-level-agreement' },
];

const socialLinks = [
  { name: 'LinkedIn', link: 'https://www.linkedin.com/company/inter-worky/', icon: FaLinkedin },
  { name: 'X', link: 'https://x.com/multisync_io', icon: FaXTwitter },
  { name: 'Discord', link: 'https://discord.com/invite/YHmsekzMV5', icon: FaDiscord },
  { name: 'Threads', link: 'https://www.threads.com/@interworkygpt', icon: SiThreads },
  { name: 'Facebook', link: 'https://www.facebook.com/Interworky/', icon: FaFacebook },
  { name: 'Instagram', link: 'https://www.instagram.com/interworkygpt/', icon: FaInstagram },
  { name: 'TikTok', link: 'https://www.tiktok.com/@interworky', icon: FaTiktok },
];

const FooterSection = ({ isLanding = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <footer className={`${isLanding ? 'bg-[#0a0a0a] text-white border-t border-white/10' : 'bg-white text-black'}`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 md:px-12 lg:px-16">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Image src="/dark-logo.png" alt="Interworky" width={180} height={40} className="h-8 w-auto" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
              The AI plugin for vibe-coded sites. Voice support, bug detection, and analytics in one.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.slice(0, 5).map((social, i) => {
                const Icon = social.icon;
                return (
                  <a
                    key={i}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                    aria-label={social.name}
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-3">
              {productLinks.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.link}
                    className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Resources</h4>
            <ul className="space-y-3">
              {resourceLinks.map((link, i) => (
                <li key={i}>
                  {link.external ? (
                    <a
                      href={link.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      href={link.link}
                      className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link, i) => (
                <li key={i}>
                  {link.link.startsWith('mailto:') ? (
                    <a
                      href={link.link}
                      className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      href={link.link}
                      className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.link}
                    className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} MultiSync Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-white transition-colors duration-200">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-white transition-colors duration-200">
                Terms
              </Link>
              <Link href="/compliance" className="text-gray-500 hover:text-white transition-colors duration-200">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>

      <UserInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionType="hire"
        source="footer_contact"
      />
    </footer>
  );
};

export default FooterSection;
