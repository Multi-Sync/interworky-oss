'use client';

import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Warning banner shown when the plugin is not connected
 * Indicates that no data source is available for the feature
 */
export default function PluginNotConnectedWarning({ websiteUrl }) {
  const router = useRouter();

  return (
    <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Plugin Not Connected</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-200/90 mb-3">
            {websiteUrl ? (
              <>
                The Carla plugin is not connected to <span className="font-semibold">{websiteUrl}</span>. No data is
                being collected at this time.
              </>
            ) : (
              <>The Carla plugin is not connected to your website. No data is being collected at this time.</>
            )}
          </p>
          <button
            onClick={() => router.push('/dashboard/tutorial')}
            className="text-sm text-yellow-700 dark:text-yellow-300 hover:text-yellow-600 dark:hover:text-yellow-200 underline font-medium transition-colors"
          >
            Connect Plugin →
          </button>
        </div>
      </div>
    </div>
  );
}
