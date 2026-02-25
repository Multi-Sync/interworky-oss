'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Skeleton from 'react-loading-skeleton';
import toast from 'react-hot-toast';
import { fetcher } from '@/_common/utils/swrFetcher';

export function GitHubVersionControlCard({ organizationId, onConnect, onEdit, onDisconnect }) {
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    data: githubStatus,
    error,
    mutate,
  } = useSWR(organizationId ? `/api/mcp/github/status?organization_id=${organizationId}` : null, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const isLoading = !githubStatus && !error;
  const isConnected = githubStatus?.connected === true;

  // Determine write access from hasWriteAccess field or from capabilities
  const hasWriteAccess = githubStatus?.hasWriteAccess || githubStatus?.capabilities?.includes('push') || false;

  const handleVerify = async () => {
    if (!organizationId || !isConnected) return;

    setIsVerifying(true);
    try {
      const response = await fetch(`/api/mcp/github/status?organization_id=${organizationId}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (data.connected) {
        toast.success('GitHub connection verified successfully!');
        await mutate(); // Refresh the data
      } else {
        toast.error(data.error || 'GitHub connection verification failed');
      }
    } catch (err) {
      console.error('Verify error:', err);
      toast.error('Failed to verify GitHub connection');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between bg-surface-elevated border border-border-default p-2 rounded-lg">
        <div className="flex items-center gap-2 text-primary">
          {/* GitHub Icon */}
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
          <h3 className="text-body ml-2 font-medium text-primary">GitHub Integration</h3>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <>
              <button
                className="text-primary hover:text-primary-hover transition-colors p-1 disabled:opacity-50"
                onClick={handleVerify}
                disabled={isVerifying || isLoading}
                title="Verify connection"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isVerifying ? 'animate-spin' : ''}
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
              </button>
              <button
                className="text-primary hover:text-primary-hover mr-2 transition-colors disabled:opacity-50"
                onClick={onEdit}
                disabled={isLoading}
                title="Edit GitHub settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                  <path d="m15 5 3 3" />
                </svg>
              </button>
            </>
          )}
          {!isConnected && !isLoading && (
            <button
              className="text-primary hover:text-primary-hover px-3 py-1 text-sm rounded transition-colors mr-2"
              onClick={onConnect}
            >
              Connect
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        {/* Connection Status */}
        <div className="mb-4">
          <label className="text-body text-gray-400">Status</label>
          <div className="text-body mt-2 text-gray-300">
            {isLoading ? (
              <Skeleton width={150} baseColor="#1a1f3a" highlightColor="#2a2f4a" />
            ) : error ? (
              <span className="text-red-400">Error loading status</span>
            ) : isConnected ? (
              <span className="flex items-center gap-2 text-green-400">
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Connected
              </span>
            ) : (
              <span className="text-gray-400">Not connected</span>
            )}
          </div>
        </div>

        {/* Repository Info */}
        {isConnected && (
          <>
            <div className="mb-4">
              <label className="text-body text-gray-400">Repository</label>
              <div className="text-body mt-2 text-gray-300">
                {isLoading ? (
                  <Skeleton width={250} baseColor="#1a1f3a" highlightColor="#2a2f4a" />
                ) : (
                  <a
                    href={`https://github.com/${githubStatus.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-hover underline transition-colors"
                  >
                    {githubStatus.repo}
                  </a>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-body text-gray-400">Access Level</label>
              <div className="text-body mt-2 text-gray-300">
                {isLoading ? (
                  <Skeleton width={100} baseColor="#1a1f3a" highlightColor="#2a2f4a" />
                ) : (
                  <span className={hasWriteAccess ? 'text-green-400' : 'text-yellow-400'}>
                    {hasWriteAccess ? 'Read & Write' : 'Read Only'}
                  </span>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-body text-gray-400">Connected At</label>
              <div className="text-body mt-2 text-gray-300">
                {isLoading ? (
                  <Skeleton width={150} baseColor="#1a1f3a" highlightColor="#2a2f4a" />
                ) : (
                  formatDate(githubStatus.connectedAt)
                )}
              </div>
            </div>

            {/* Disconnect Button */}
            <button
              className="mt-2 text-red-400 hover:text-red-300 text-sm transition-colors"
              onClick={onDisconnect}
              disabled={isLoading}
            >
              Disconnect GitHub
            </button>
          </>
        )}
      </div>
    </div>
  );
}
