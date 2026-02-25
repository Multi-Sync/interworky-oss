'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import UserInfoModal from '../UserInfoModal';
import { useNotification } from '@/_common/utils/handleSlackNotification';
import { useRouter } from 'next/navigation';

// Client component wrapper for the Navbar to handle interactive elements
export default function ClientNavbar({ navLinks, logoSrc, logoAlt, isDarkMode }) {
  const [openNavbar, setOpenNavbar] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { handleNotification } = useNotification();

  const toggleNavbar = () => {
    setOpenNavbar(prev => !prev);
  };

  const handleButtonClick = (action, source = 'navbar') => {
    handleNotification(`User clicked ${action} from ${source} section`);
    router.push('/setup-account');
  };

  const headerClasses = isDarkMode
    ? 'relative inset-x-0 top-0 z-50 flex items-center h-24 bg-black text-white'
    : 'relative inset-x-0 top-0 z-50 flex items-center h-24';

  const mobileMenuClasses = isDarkMode
    ? 'flex flex-col space-y-10 inset-0 fixed top-0 h-[100dvh] bg-black lg:!bg-transparent py-20 px-5'
    : 'flex flex-col space-y-10 inset-0 fixed top-0 h-[100dvh] bg-white lg:!bg-transparent py-20 px-5';

  const linkClasses = isDarkMode ? 'text-white hover:text-gray-300' : 'text-secondary hover:text-primary';

  return (
    <header className={headerClasses}>
      <div className="lg:max-w-7xl sm:px-10 md:px-12 lg:px-5 items-center w-full h-full px-5 mx-auto">
        <nav className="flex items-center justify-between h-full">
          <div className="min-w-max flex items-center">
            <Link href="/" className="gap-x-4 text-primary dark:text-primary flex items-center text-2xl font-semiBold">
              <div className="flex items-center -space-x-3 font-semiBold">
                <Image
                  src={logoSrc}
                  width={100}
                  height={100}
                  alt={logoAlt}
                  priority
                  fetchPriority="high"
                  sizes="100px"
                />
              </div>
            </Link>
          </div>

          <div
            className={`
            ${mobileMenuClasses} 
            sm:px-10 md:px-14 transition-all ease-linear duration-300 lg:flex-row lg:flex-1 lg:py-0 lg:px-0 lg:space-y-0 
            lg:gap-x-10 lg:relative lg:top-0 lg:h-full lg:items-center lg:justify-between lg:w-max
            ${openNavbar ? 'visible opacity-100 translate-y-0 z-40' : '-translate-y-9 opacity-0 invisible lg:translate-y-0 lg:visible lg:opacity-100'}
          `}
          >
            <ul className="gap-y-5 lg:items-center lg:flex-row lg:gap-x-5 lg:h-full lg:justify-center lg:flex-1 flex flex-col">
              {navLinks.map(({ href, label, external }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`${linkClasses} transition ease-linear`}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="sm:w-max lg:min-w-max lg:items-center flex w-full">
              <button
                onClick={() => handleButtonClick('get_started')}
                className={`gap-x-3 ${
                  isDarkMode
                    ? 'text-white hover:text-gray-300 border-b-white'
                    : 'text-secondary hover:text-primary border-b-gray-900'
                } flex items-center justify-center bg-transparent border-b`}
              >
                Get Started
                <span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path
                      fillRule="evenodd"
                      d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <button
            onClick={toggleNavbar}
            className={`${isDarkMode ? 'bg-black' : 'bg-primary dark:bg-primary'} aspect-square lg:hidden relative flex flex-col items-center justify-center w-12 p-3 rounded-full outline-none z-50`}
            aria-label="Toggle navigation menu"
          >
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${openNavbar ? 'rotate-45 translate-y-0.5' : ''}`}
            />
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 mt-1.5 ${openNavbar ? '-rotate-45 -translate-y-1.5' : ''}`}
            />
          </button>
        </nav>
      </div>

      <UserInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionType="demo"
        source="navbar_demo"
      />
    </header>
  );
}
