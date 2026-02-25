'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/_common/utils/swrFetcher';
import { getOrganization } from '@/_common/utils/localStorage';
import { themeClasses, combineThemeClasses } from '@/_common/utils/themeUtils';

const GitHubOptionalCard = () => {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);
  const organization = getOrganization()?.organization;
  const orgId = organization?.id;
  const hasAutoFixAccess = true; // OSS: All features available

  // Fetch GitHub connection status
  const { data: githubData } = useSWR(orgId ? `/api/organization-version-control/${orgId}` : null, fetcher);

  const hasGitHub = githubData?.success && githubData?.data?.github_app_installation_id;

  // Don't show if already connected or dismissed
  if (hasGitHub || isDismissed) {
    return null;
  }

  const handleConnectGitHub = () => {
    router.push('/onboarding/github');
  };

  return (
    <div className="mt-6 relative overflow-hidden rounded-lg border border-purple-500/30 dark:border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/5 dark:to-blue-500/5 p-6 transition-colors duration-200">
      {/* Dismiss button */}
      <button
        onClick={() => setIsDismissed(true)}
        className={combineThemeClasses(
          'absolute top-3 right-3 transition-colors',
          themeClasses.text.tertiary,
          themeClasses.hover.text,
        )}
        aria-label="Dismiss"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-4 pr-8">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 dark:bg-surface-elevated border border-purple-500/40 dark:border-purple-500/30 flex items-center justify-center transition-colors duration-200">
          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={combineThemeClasses('font-semibold', themeClasses.text.primary)}>
              Unlock Auto-Fix with GitHub
            </h3>
            {!hasAutoFixAccess ? (
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded">7-DAY TRIAL</span>
            ) : (
              <span className="px-2 py-0.5 bg-purple-500/30 dark:bg-purple-500/20 border border-purple-500/40 dark:border-purple-500/30 rounded text-xs text-purple-700 dark:text-purple-300 font-medium">
                Optional
              </span>
            )}
          </div>
          <p className={combineThemeClasses('text-sm mb-4', themeClasses.text.secondary)}>
            Connect your GitHub repository to enable AI-powered automatic error fixing and seamless integration updates
            via pull requests.
            {!hasAutoFixAccess && (
              <span className="block mt-2 text-xs text-blue-600 dark:text-blue-300">
                Requires 7-day free trial (uses AI for automated fixes)
              </span>
            )}
          </p>

          {/* Benefits list */}
          <div className="space-y-2 mb-4">
            <div className={combineThemeClasses('flex items-center gap-2 text-xs', themeClasses.text.secondary)}>
              <svg
                className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Automatic error detection & PR creation</span>
            </div>
            <div className={combineThemeClasses('flex items-center gap-2 text-xs', themeClasses.text.secondary)}>
              <svg
                className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Integration updates via pull requests</span>
            </div>
            <div className={combineThemeClasses('flex items-center gap-2 text-xs', themeClasses.text.secondary)}>
              <svg
                className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Review code changes before merging</span>
            </div>
          </div>

          {/* Trial info message */}
          {!hasAutoFixAccess && (
            <div className="mb-3 p-2.5 bg-blue-500/20 dark:bg-blue-500/10 border border-blue-500/30 dark:border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                🎉 7-day free trial • Then $19.99/month • Cancel anytime
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleConnectGitHub}
              className={`px-4 py-2 ${
                hasAutoFixAccess ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
              } text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2`}
            >
              <span>{hasAutoFixAccess ? 'Connect GitHub' : 'Start 7-Day Trial'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className={combineThemeClasses(
                'text-sm font-medium transition-colors',
                themeClasses.text.tertiary,
                themeClasses.hover.text,
              )}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitHubOptionalCard;
