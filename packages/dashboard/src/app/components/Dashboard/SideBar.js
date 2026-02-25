'use client';

import { useEffect, useState } from 'react';
import { getOrganization, getUser } from '@/_common/utils/localStorage';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useNotification } from '@/_common/utils/handleSlackNotification';
import Cookies from 'js-cookie';
import { useSessionManager } from '@/_common/hooks/useSession';
import SupportModal from './SupportModal';
import { useThemeLogo } from '@/_common/utils/themeUtils';
import { useTheme } from '@/context/ThemeContext';

const getImage = (path, pathname, isDark) => {
  const isActive = path === pathname;
  // Theme-aware stroke colors
  const strokeColor = isActive
    ? isDark
      ? '#fafafa'
      : '#111827' // Active: white (dark) / gray-900 (light)
    : isDark
      ? '#737373'
      : '#9ca3af'; // Inactive: gray-500 (dark) / gray-400 (light)

  const images = {
    '/dashboard/home': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-home transition-colors"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
    '/dashboard/customer-support': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-headset transition-colors"
      >
        <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
        <path d="M21 16v2a4 4 0 0 1-4 4h-5" />
      </svg>
    ),
    '/dashboard/tutorial': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-code transition-colors"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    '/dashboard/appointments': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-calendar transition-colors"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    ),
    '/dashboard/patients': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-users transition-colors"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="m22 21-2-2a4 4 0 0 0-3-3" />
        <circle cx="16" cy="7" r="1" />
      </svg>
    ),

    '/dashboard/settings': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-settings transition-colors"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    '/dashboard/carla-chat': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-message-circle transition-colors"
      >
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
    ),
    '/dashboard/analytics': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-bar-chart transition-colors"
      >
        <line x1="12" x2="12" y1="20" y2="10" />
        <line x1="18" x2="18" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="16" />
      </svg>
    ),
    '/dashboard/performance': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-activity transition-colors"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    '/dashboard/performance': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-alert-triangle transition-colors"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    '/dashboard/analytics': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-bar-chart transition-colors"
      >
        <line x1="12" x2="12" y1="20" y2="10" />
        <line x1="18" x2="18" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="16" />
      </svg>
    ),
    '/dashboard/analytics/flow?view=logs': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-activity transition-colors"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    'https://carla.interworky.com': (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-book-open transition-colors"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  };
  return images[path];
};

const sidebarTabs = [
  {
    alt: 'home-icon',
    text: 'Home',
    path: '/dashboard/home',
  },
  {
    alt: 'assistant-icon',
    text: 'Chat Widget',
    path: '/dashboard/customer-support',
  },
  {
    alt: 'performance-monitoring-icon',
    text: 'Performance',
    path: '/dashboard/performance',
    isBeta: true,
  },
  {
    alt: 'analytics-icon',
    text: 'Analytics',
    path: '/dashboard/analytics',
    isBeta: true,
  },
  {
    alt: 'settings-icon',
    text: 'Settings',
    path: '/dashboard/settings',
  },
];

const SidebarItem = ({ alt, text, path, onClick, isCollapsed, isBeta, external }) => {
  const pathname = usePathname();
  const { isDark } = useTheme();
  const isActive = pathname === path;

  const content = (
    <>
      <div className={`${isCollapsed ? 'mx-auto' : ''} flex-shrink-0`}>{getImage(path, pathname, isDark)}</div>
      {!isCollapsed && (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={`transition-all duration-300 truncate ${
              isActive ? 'text-gray-900 dark:text-gray-50 font-medium' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {text}
          </span>
        </div>
      )}
      {isActive && !isCollapsed && (
        <div className="ml-auto flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 1024 1024">
            <path
              fill="currentColor"
              className="text-gray-900 dark:text-gray-50"
              d="M340.864 149.312a30.59 30.59 0 0 0 0 42.752L652.736 512L340.864 831.872a30.59 30.59 0 0 0 0 42.752a29.12 29.12 0 0 0 41.728 0L714.24 534.336a32 32 0 0 0 0-44.672L382.592 149.376a29.12 29.12 0 0 0-41.728 0z"
            />
          </svg>
        </div>
      )}
    </>
  );

  return (
    <li
      className={`mx-2 lg:mx-3 rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-surface-elevated-light dark:bg-surface-elevated border border-gray-300 dark:border-border-subtle'
          : 'hover:bg-gray-100 dark:hover:bg-surface-elevated/50 border border-transparent'
      }`}
    >
      {external ? (
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-3 items-center w-full px-4 py-3.5 lg:py-3"
          onClick={onClick}
        >
          {content}
        </a>
      ) : (
        <Link href={path} className="flex gap-3 items-center w-full px-4 py-3.5 lg:py-3" onClick={onClick}>
          {content}
        </Link>
      )}
    </li>
  );
};

const SideBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [organization, setOrganization] = useState(null);
  const [version, setVersion] = useState('');
  const { handleNotification } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved ? JSON.parse(saved) : true; // Default to collapsed
    }
    return true; // Default to collapsed
  });
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const { session } = useSessionManager();
  const userEmail = getUser()?.email || session?.email;
  const logo = useThemeLogo(); // Theme-aware logo
  const { isDark } = useTheme(); // Theme state

  const handleLogout = async () => {
    const response = await fetch('/api/logout');
    Cookies.remove('access_token');
    if (response.ok) {
      router.replace('/login'); // Redirect to the login page after logging out
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
    } else {
      console.error('Logout failed');
    }
  };

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: newState }));
  };

  const handleNavigation = () => {
    // Collapse sidebar after navigation
    if (!isCollapsed) {
      setIsCollapsed(true);
      localStorage.setItem('sidebarCollapsed', JSON.stringify(true));
      window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: true }));
    }
  };

  const handleIntegrationClick = async event => {
    event.preventDefault();
    handleNotification(`${userEmail} just clicked on the integration tab - step 4`);
    window.location.href = '/dashboard/tutorial';
  };

  const handleDocumentationClick = async event => {
    handleNotification(`${userEmail} just clicked on the Documentation link`);
  };

  const handleSupportClick = () => {
    setIsSupportModalOpen(true);
  };

  useEffect(() => {
    fetch('/api/version')
      .then(response => response.json())
      .then(data => setVersion(data.version))
      .catch(error => console.error('Error fetching version:', error));
  }, []);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        let organizationString = localStorage.getItem('organization');
        let organizationObject = JSON.parse(organizationString);
        setOrganization(organizationObject.organization);
      } catch (error) {
        console.error('Error fetching organization:', error);
      }
    };

    fetchOrganization();

    // Add event listener for storage changes
    window.addEventListener('storage', fetchOrganization);

    // Cleanup function
    return () => {
      window.removeEventListener('storage', fetchOrganization);
    };
  }, []);

  return (
    <>
      {/* Hamburger Menu for Mobile - Fixed Position */}
      <div className="fixed top-5 right-5 z-50 lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Sidebar"
          className="p-3 bg-surface-elevated-light dark:bg-surface-elevated border border-gray-300 dark:border-border-subtle rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all shadow-md active:scale-95"
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="text-gray-900 dark:text-white"
            >
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="text-gray-900 dark:text-white"
            >
              <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
          )}
        </button>
      </div>

      {/* Backdrop Overlay - Tap to Close */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Fixed Docked Sidebar */}
      <aside
        className={`fixed flex flex-col z-50
          transition-all duration-300 ease-out
          ${isCollapsed ? 'lg:w-[80px]' : 'lg:w-[280px]'} h-full justify-between
          bg-surface-light dark:bg-surface border-r border-border-default-light dark:border-border-default transition-colors duration-200
          left-0 top-0
          ${isOpen ? 'translate-x-0 w-[85vw] max-w-[320px] h-full' : '-translate-x-full w-[85vw] max-w-[320px] h-full'}
          pb-6
          lg:translate-x-0 overflow-hidden`}
      >
        <div
          className={`flex items-center ${isCollapsed && !isOpen ? 'justify-center w-full' : 'justify-between mr-5'}`}
        >
          {!isCollapsed || isOpen ? (
            <Link href="/">
              <Image
                src={logo}
                alt="Interworky Logo"
                width={150}
                height={40}
                className="m-6 w-[120px] h-auto lg:w-[150px]"
                priority
              />
            </Link>
          ) : (
            <Link href="/" className="flex items-center justify-center pt-1">
              <Image src="/logo.jpg" alt="Interworky Logo" width={40} height={40} className="rounded-lg" />
            </Link>
          )}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex absolute right-[-12px] top-8 p-2 bg-surface-elevated-light dark:bg-surface-elevated rounded-full cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-gray-50 transition-all duration-200 border border-border-default-light dark:border-border-default z-[60] shadow-md"
            aria-label="Toggle Sidebar"
          >
            {!isCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 6 15 12 9 18"></polyline>
              </svg>
            )}
          </button>
        </div>
        <nav className="overflow-y-auto flex-1 text-base scrollbar">
          <ul className="space-y-2 pt-10">
            {sidebarTabs.map((tab, index) => (
              <SidebarItem
                key={index}
                text={tab.text}
                alt={tab.alt}
                path={tab.path}
                onClick={() => {
                  setIsOpen(false);
                  handleNavigation();
                }}
                pathname={pathname}
                isCollapsed={isCollapsed && !isOpen}
                isBeta={tab.isBeta}
              />
            ))}

            <li
              className={`mx-2 lg:mx-3 rounded-lg transition-all duration-200 hover:bg-surface-elevated/50 border border-transparent`}
            >
              <a
                href="https://carla.interworky.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 items-center w-full px-4 py-3.5 lg:py-3"
                onClick={handleDocumentationClick}
              >
                <div className={`${isCollapsed && !isOpen ? 'mx-auto' : ''} flex-shrink-0`}>
                  {getImage('https://carla.interworky.com', pathname, isDark)}
                </div>
                {(!isCollapsed || isOpen) && (
                  <span className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                    Documentation
                  </span>
                )}
              </a>
            </li>
          </ul>
        </nav>

        {(!isCollapsed || isOpen) && (
          <div className="bottom-0 w-full border-t border-border-default mt-4">
            <div className="flex justify-start items-center">
              <ul className="mx-3 space-y-2 w-full mt-4">
                <li
                  className={`rounded-lg transition-all duration-200 hover:bg-surface-elevated/50 border border-transparent`}
                >
                  <button
                    onClick={handleSupportClick}
                    className="flex gap-3 items-center w-full px-4 py-3.5 lg:py-3 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 14 14"
                      className={`${isCollapsed && !isOpen ? 'mx-auto' : ''} flex-shrink-0`}
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1"
                        d="M7.506 13.065a2.7 2.7 0 0 0 3.37-.36l.38-.38a.91.91 0 0 0 0-1.28l-1.6-1.59a.9.9 0 0 0-1.27 0v0a.91.91 0 0 1-1.28 0l-2.55-2.55a.91.91 0 0 1 0-1.28v0a.9.9 0 0 0 0-1.27l-1.54-1.6a.91.91 0 0 0-1.28 0l-.38.38a2.7 2.7 0 0 0-.41 3.37a24.2 24.2 0 0 0 6.56 6.56m5.959-9.893h-2.748a.215.215 0 0 1-.215-.216v0a.22.22 0 0 1 .053-.142l1.96-2.24a.2.2 0 0 1 .154-.07v0c.112 0 .203.092.203.204v3.353M8.85 4.06H6.48v-.505a.89.89 0 0 1 .533-.814l1.32-.577a.866.866 0 0 0-.348-1.66h-.616a.89.89 0 0 0-.838.593"
                      />
                    </svg>
                    {(!isCollapsed || isOpen) && <span>Support</span>}
                  </button>
                </li>

                <li className={`rounded-lg transition-all duration-200 hover:bg-red-500/10 border border-transparent`}>
                  <button
                    className="flex gap-3 items-center w-full px-4 py-3.5 lg:py-3 transition-colors text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    onClick={handleLogout}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      className={`${isCollapsed && !isOpen ? 'mx-auto' : ''} flex-shrink-0`}
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 12h-9.5m7.5 3l3-3l-3-3m-5-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-1"
                      />
                    </svg>
                    {(!isCollapsed || isOpen) && <span>Logout</span>}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* Support Modal */}
      <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} version={version} />
    </>
  );
};

export default SideBar;
