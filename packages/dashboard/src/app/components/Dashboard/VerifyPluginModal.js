'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/app/components/ui/Button';
import toast from 'react-hot-toast';
import { getOrganization } from '@/_common/utils/localStorage';
import { useRouter } from 'next/navigation';

export default function VerifyPluginModal({ isOpen, onClose, websiteUrl, onOpenWebsiteModal, onSuccess }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const org = getOrganization();
      if (!org?.organization?.id) {
        toast.error('Organization not found');
        return;
      }

      const response = await fetch(`/api/plugin-status/check-and-update/${org.organization.id}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.isConnected) {
          toast.success('Plugin verified successfully!');
          if (onSuccess) onSuccess();
          onClose();
        } else {
          toast.error('Plugin not detected. Please check your integration and try again.');
        }
      } else {
        toast.error(data.error || 'Error checking plugin status');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error('Error checking plugin status');
    } finally {
      setIsChecking(false);
    }
  };

  const handleOpenWebsite = () => {
    if (websiteUrl && websiteUrl !== 'example.com' && websiteUrl !== 'https://') {
      window.open(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`, '_blank');
    } else {
      toast.error('Please set a valid website URL first');
    }
  };

  const handleGoToTutorial = () => {
    router.push('/dashboard/tutorial');
    onClose();
  };

  const handleUpdateWebsite = () => {
    if (onOpenWebsiteModal) {
      onClose();
      onOpenWebsiteModal();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-surface-elevated border border-border-default rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-b border-border-default p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Verify Plugin Integration</h2>
              <p className="text-sm text-gray-400">Check if the Interworky plugin is working on your website</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current Website */}
          <div className="bg-surface border border-border-default rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">Current Website</p>
                <p className="text-sm text-white font-medium truncate">{websiteUrl || 'Not set'}</p>
              </div>
              <button onClick={handleUpdateWebsite} className="text-sm text-primary hover:text-primary-hover underline">
                Update
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-300 mb-3">Before verifying:</h3>
            <ol className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                <span>Make sure you&apos;ve completed the integration steps</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <span>Deploy your changes to the website URL above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-semibold">
                  3
                </span>
                <span>Open your website to check if the widget appears</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={handleCheckStatus} isLoading={isChecking} className="w-full">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Check Plugin Status</span>
              </div>
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleGoToTutorial} intent="secondary" className="w-full">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <span>Tutorial</span>
                </div>
              </Button>

              <Button onClick={handleOpenWebsite} intent="secondary" className="w-full">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  <span>Open Site</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Help */}
          <div className="border-t border-border-default pt-4">
            <p className="text-xs text-gray-400 text-center">
              Need help with integration?{' '}
              <button onClick={handleGoToTutorial} className="text-primary hover:text-primary-hover underline">
                View tutorial
              </button>{' '}
              or{' '}
              <button onClick={handleUpdateWebsite} className="text-primary hover:text-primary-hover underline">
                update your website URL
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
