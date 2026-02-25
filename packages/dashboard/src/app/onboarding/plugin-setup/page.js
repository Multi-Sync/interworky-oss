'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrganization } from '@/_common/utils/localStorage';

const PluginSetupPage = () => {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const organization = getOrganization()?.organization;

  const handleMethodSelection = async method => {
    setIsUpdating(true);

    try {
      // Route to appropriate page
      if (method === 'github') {
        router.push('/onboarding/github');
      } else {
        router.push('/dashboard/tutorial');
      }
    } catch (error) {
      console.error('Error:', error);
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-app-bg">
      <div className="max-w-5xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Integrate Carla Plugin</h1>
          <p className="text-lg text-gray-400">Choose how you&apos;d like to add Carla to your website</p>
        </div>

        {/* Two Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GitHub Auto Integration */}
          <div className="relative rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-8 hover:border-purple-500/50 transition-all group">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">RECOMMENDED</span>
            </div>

            <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">GitHub Auto-Integration</h2>
            <p className="text-gray-300 mb-6">
              We&apos;ll create a pull request with the integration code. Just review and merge!
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-300">Automatic integration PR creation</span>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="flex-1">
                  <span className="text-sm text-gray-300">Unlock auto-fix feature for errors</span>
                  <span className="ml-2 text-xs text-purple-400">(Premium)</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-300">Future updates via pull requests</span>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-300">Code review before merging</span>
              </div>
            </div>

            <button
              onClick={() => handleMethodSelection('github')}
              disabled={isUpdating}
              className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 group-hover:shadow-lg group-hover:shadow-purple-500/25 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              Connect GitHub
            </button>
          </div>

          {/* Manual Integration */}
          <div className="relative rounded-xl border border-border-default bg-surface-elevated p-8 hover:border-border-subtle transition-all">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Manual Integration</h2>
            <p className="text-gray-300 mb-6">
              Follow step-by-step instructions to add the code snippet to your website.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-300">Simple copy & paste</span>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-300">Full control over placement</span>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-300">Works with any platform</span>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-300">No GitHub required</span>
              </div>
            </div>

            <button
              onClick={() => handleMethodSelection('manual')}
              disabled={isUpdating}
              className="w-full px-6 py-4 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-semibold rounded-lg transition-colors"
            >
              Get Instructions
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 space-y-4">
          {/* Quick tip */}
          <div className="text-center text-sm text-gray-400">
            💡 You can always connect GitHub later for additional features
          </div>

          {/* Skip button */}
          <div className="text-center">
            <button
              onClick={() => router.push('/dashboard/home')}
              className="text-sm text-gray-500 hover:text-gray-300 underline transition-colors"
            >
              Skip for Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PluginSetupPage;
