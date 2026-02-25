'use client';

import dynamic from 'next/dynamic';

// Dynamically import the errors component with no SSR
const ErrorsContent = dynamic(() => import('./ErrorsContent'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-performance-light dark:bg-performance-dark transition-colors duration-200 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-red-400 text-sm">Loading Error Dashboard...</p>
      </div>
    </div>
  ),
});

export default function ErrorsPage() {
  return <ErrorsContent />;
}
