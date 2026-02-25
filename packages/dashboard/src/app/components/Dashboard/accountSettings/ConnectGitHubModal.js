'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Dialog from '../../Dialog';
import { Button } from '../../ui/Button';

const GITHUB_APP_NAME = 'carla-nextjs';

export function ConnectGitHubModal({ isOpen, onClose, organizationId, existingData, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnectGitHub = async () => {
    setIsLoading(true);

    try {
      // Get the installation URL from frontend API proxy
      const response = await fetch(`/api/mcp/github/install-url?organization_id=${organizationId}`);

      if (!response.ok) {
        throw new Error('Failed to get installation URL');
      }

      const data = await response.json();

      if (data.success && data.data.installation_url) {
        // Redirect to GitHub App installation page
        window.location.href = data.data.installation_url;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error initiating GitHub App installation:', error);
      toast.error('Failed to initiate GitHub installation. Please try again.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Connect GitHub"
      className="w-1/3 min-w-[390px] !bg-[#0a0e27]/95 !backdrop-blur-xl !border !border-primary/30 !shadow-2xl !shadow-primary/20"
    >
      <div className="bg-gradient-to-r from-primary/20 to-primary/20 backdrop-blur-sm border border-primary/30 py-3 px-5 rounded-lg mb-6">
        <div className="flex items-center gap-2 text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          <span className="text-base ml-2 font-medium">GitHub App Integration</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Explanation */}
        <div className="text-gray-300 space-y-3">
          <p>Connect Carla to your GitHub repository for powerful code analysis and automated fixes.</p>

          <div className="mt-4 p-4 bg-[#0a0e27]/40 border border-primary/20 rounded-lg space-y-3 text-sm">
            <h4 className="font-medium text-white flex items-center gap-2">
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
                className="text-primary"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              What Carla Can Do:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
              <li>Analyze your code for performance issues and bugs</li>
              <li>Create pull requests with automated fixes</li>
              <li>Search and read files in your repository</li>
              <li>Create issues to track improvements</li>
              <li>Answer questions about your codebase</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-2 text-sm">
            <h4 className="font-medium text-blue-300 flex items-center gap-2">
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
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              How It Works:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-blue-200/80 ml-2">
              <li>Click &quot;Install GitHub App&quot; below</li>
              <li>You&apos;ll be redirected to GitHub</li>
              <li>Select the repository you want to connect</li>
              <li>Click &quot;Install&quot; on GitHub</li>
              <li>You&apos;ll be redirected back here automatically</li>
            </ol>
          </div>

          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
            <div className="flex items-start gap-2 text-green-300">
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
                className="mt-0.5 flex-shrink-0"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <div>
                <div className="font-medium">Secure & Private</div>
                <div className="text-green-200/70 text-xs mt-1">
                  Permissions are scoped to only what Carla needs. You can revoke access anytime from GitHub settings.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Install Button */}
        <div className="py-6 flex justify-center">
          <Button
            type="button"
            onClick={handleConnectGitHub}
            isLoading={isLoading}
            disabled={isLoading}
            className={'w-full'}
          >
            {isLoading ? 'Redirecting to GitHub...' : 'Install GitHub App'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
