'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-3xl font-bold text-secondary">Something went wrong</h2>
        <p className="mb-6 text-gray-600">
          We couldn&apos;t load this blog post. This might be due to a network issue or the post may not exist.
        </p>
        <div className="flex flex-col gap-4 justify-center sm:flex-row">
          <button
            onClick={() => reset()}
            className="px-6 py-2 font-medium text-white rounded-md transition-colors bg-primary hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            href="/blog"
            className="px-6 py-2 font-medium text-gray-700 rounded-md border border-gray-300 transition-colors hover:bg-gray-50"
          >
            Return to blog
          </Link>
        </div>
      </div>
    </div>
  );
}
