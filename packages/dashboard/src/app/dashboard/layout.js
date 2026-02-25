'use client';

import Image from 'next/image';
import LoadingIndicator from '../components/LoadingIndicator';
import SideBar from '../components/Dashboard/SideBar';
import PageTransition from '../components/Dashboard/PageTransition';
import { Suspense, useEffect, useState } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';

import { OrganizationAssistantsProvider } from '@/context/OrganizationAssistantsContext';
import { useSessionManager } from '@/_common/hooks/useSession';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useThemeLogo } from '@/_common/utils/themeUtils';

function DashboardContent({ children, isCollapsed }) {
  const logo = useThemeLogo();

  return (
    <div className="relative min-h-screen bg-app-bg-light dark:bg-app-bg transition-colors duration-200">
      {/* Mobile Header - Fixed to Top */}
      <div className="fixed top-0 left-0 right-0 flex lg:hidden items-center justify-between px-6 py-4 bg-surface-light dark:bg-surface border-b border-border-default-light dark:border-border-default z-30 transition-colors duration-200">
        <Link href="/">
          <Image src={logo} alt="interworky-logo" width={173} height={24} />
        </Link>
      </div>

      {/* Fixed Sidebar */}
      <SideBar />

      {/* Main Content with proper margin for sidebar */}
      <main
        className={`relative min-h-screen pt-20 px-4 pb-4 lg:p-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'}`}
      >
        <Suspense fallback={<LoadingIndicator />}>
          <PageTransition>{children}</PageTransition>
        </Suspense>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { status } = useSessionManager();
  const router = useRouter();

  // Authentication guard - redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    // Read initial state from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }

    // Listen for storage changes
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved) {
        setIsCollapsed(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event for same-tab updates
    const handleCustomEvent = e => {
      setIsCollapsed(e.detail);
    };
    window.addEventListener('sidebarToggle', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarToggle', handleCustomEvent);
    };
  }, []);

  // Show loading while checking authentication
  if (status === 'loading') {
    return <LoadingIndicator />;
  }

  // Don't render dashboard if unauthenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <ThemeProvider>
        <OrganizationAssistantsProvider>
          <DashboardContent isCollapsed={isCollapsed}>{children}</DashboardContent>
        </OrganizationAssistantsProvider>
    </ThemeProvider>
  );
}
