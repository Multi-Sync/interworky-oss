'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Dialog from '../../Dialog';
import { Button } from '../../ui/Button';

export function DeleteGitHubModal({ isOpen, onClose, organizationId, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!organizationId) {
      toast.error('Organization ID is missing');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/mcp/github/connect', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: organizationId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to disconnect GitHub');
      }

      toast.success('GitHub disconnected successfully!');
      await onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error disconnecting GitHub:', error);
      toast.error(error.message || 'Failed to disconnect GitHub. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Disconnect GitHub"
      className="w-1/3 min-w-[390px] !bg-[#0a0e27]/95 !backdrop-blur-xl !border !border-primary/30 !shadow-2xl !shadow-primary/20"
    >
      <div className="bg-gradient-to-r from-red-500/20 to-red-500/20 backdrop-blur-sm border border-red-500/30 py-3 px-5 rounded-lg mb-6">
        <div className="flex items-center gap-2 text-red-400">
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
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="text-base ml-2 font-medium">Warning</span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <p className="text-gray-300 text-body">Are you sure you want to disconnect GitHub integration?</p>
        <p className="text-gray-400 text-sm">
          This will remove your GitHub credentials and disable features that depend on GitHub integration, such as:
        </p>
        <ul className="list-disc list-inside text-gray-400 text-sm space-y-1 ml-2">
          <li>Automated pull request creation</li>
          <li>Code synchronization</li>
          <li>Repository insights</li>
        </ul>
        <p className="text-yellow-400 text-sm">
          You can reconnect GitHub at any time by clicking the &quot;Connect&quot; button.
        </p>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" onClick={onClose} disabled={isLoading} intent="secondary" className="px-6">
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleDelete}
          isLoading={isLoading}
          disabled={isLoading}
          className="px-6 !bg-red-500 hover:!bg-red-600 !border-red-500"
        >
          Disconnect
        </Button>
      </div>
    </Dialog>
  );
}
