'use client';

import dynamic from 'next/dynamic';

// Dynamically import the performance component with no SSR
const PerformanceContent = dynamic(() => import('./PerformanceContent'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-performance-light dark:bg-performance-dark transition-colors duration-200 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-primary text-sm">Loading Performance...</p>
      </div>
    </div>
  ),
});

export default function PerformancePage() {
  return <PerformanceContent />;
}
