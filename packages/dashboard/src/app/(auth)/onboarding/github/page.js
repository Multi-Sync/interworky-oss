'use client';

import { Suspense, useState } from 'react';
import { BeatLoader } from 'react-spinners';
import { Button } from '@/app/components/ui/Button';
import { getOrganization } from '@/_common/utils/localStorage';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ConnectGitHub() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleConnectGitHub = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get organization ID from localStorage
      const organization = getOrganization()?.organization;

      if (!organization?.id) {
        const errorMsg = 'Organization not found. Please try logging in again.';
        setError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
        return;
      }

      // Fetch GitHub App installation URL from backend
      const response = await fetch(`/api/mcp/github/install-url?organization_id=${organization.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get installation URL');
      }

      if (data.success && data.data.installation_url) {
        // Redirect to GitHub App installation page
        window.location.href = data.data.installation_url;
      } else {
        throw new Error('Installation URL not found in response');
      }
    } catch (error) {
      console.error('Error connecting GitHub:', error);
      const errorMsg = error.message || 'Failed to connect GitHub';
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Skip to verification page (user can connect GitHub later)
    router.push('/dashboard/home');
  };

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">
          <BeatLoader color="#4A90E2" size={150} />
        </div>
      }
    >
      <div className="mb-8">
        <h1 className="font-semiBold lg:text-3xl text-secondary text-lg mb-2">Connect GitHub (Optional)</h1>
        <p className="text-sm text-gray-500">
          Enable Auto-Fix to automatically create pull requests when errors are detected in your application
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-secondary mb-2">What is Auto-Fix?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Automatically detects errors in your application via Performance Monitoring</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Generates pull requests with AI-suggested fixes for detected errors</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Analyzes your codebase to provide context-aware solutions</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex gap-2">
            <svg
              className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-800 mb-1">GitHub is optional</p>
              <p className="text-sm text-purple-700">
                You can skip this step and connect GitHub later from Performance Monitoring when you&apos;re ready to
                use Auto-Fix.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-800 mb-1">Connection Error</h4>
              <p className="text-sm text-red-700 mb-3">{error}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleConnectGitHub}
                  disabled={isLoading}
                  className="text-sm text-red-700 hover:text-red-800 underline font-medium disabled:opacity-50"
                >
                  Try Again
                </button>
                <span className="text-red-400">•</span>
                <button
                  onClick={() => router.push('/dashboard/home')}
                  className="text-sm text-red-700 hover:text-red-800 underline font-medium"
                >
                  Continue with Manual Installation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <Button onClick={handleConnectGitHub} isLoading={isLoading} size={'medium'}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Connect GitHub
          </div>
        </Button>

        <Button onClick={handleSkip} intent={'outline'} size={'medium'}>
          Skip for now
        </Button>
      </div>
    </Suspense>
  );
}
