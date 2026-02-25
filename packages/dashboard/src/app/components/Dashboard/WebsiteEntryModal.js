'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import toast from 'react-hot-toast';
import { getOrganization } from '@/_common/utils/localStorage';
import { isPlaceholderWebsite } from '@/_common/utils/utils';

export default function WebsiteEntryModal({ isOpen, onClose, onSuccess, initialUrl = '' }) {
  const [websiteUrl, setWebsiteUrl] = useState(isPlaceholderWebsite(initialUrl) ? '' : initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [showNgrokGuide, setShowNgrokGuide] = useState(false);
  const [urlType, setUrlType] = useState('live'); // 'ngrok' | 'live'
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSave = async () => {
    // Trim whitespace from URL
    const trimmedUrl = websiteUrl?.trim() || '';

    // If URL is empty or just the protocol, set it to placeholder
    const websiteToSubmit =
      !trimmedUrl || trimmedUrl === 'https://' || trimmedUrl === 'http://' ? 'https://example.com' : trimmedUrl;

    setIsLoading(true);
    try {
      const org = getOrganization();
      if (!org?.organization?.id) {
        toast.error('Organization not found');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/models/organizations/${org.organization.id}/website`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organization_website: websiteToSubmit }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Website updated successfully!');
        // Update localStorage with trimmed URL
        const updatedOrg = { ...org };
        updatedOrg.organization.organization_website = trimmedUrl;
        localStorage.setItem('organization', JSON.stringify(updatedOrg));

        if (onSuccess) onSuccess(trimmedUrl);
        onClose();
      } else {
        // Handle validation errors (array format from express-validator)
        if (Array.isArray(data.error) && data.error.length > 0) {
          const errorMsg = data.error[0].msg || 'Validation failed';
          toast.error(errorMsg);
        } else if (typeof data.error === 'string') {
          toast.error(data.error);
        } else {
          toast.error('Failed to update website');
        }
      }
    } catch (error) {
      console.error('Error updating website:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlTypeChange = type => {
    setUrlType(type);
    if (type === 'ngrok') {
      setShowNgrokGuide(true);
      setWebsiteUrl('https://');
    } else {
      setShowNgrokGuide(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-surface-elevated border border-border-default rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-elevated border-b border-border-default p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Add Your Website</h2>
              <p className="text-sm text-gray-400">
                Where would you like to install Interworky? You can use ngrok for local development.
              </p>
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
        <div className="p-6 space-y-6">
          {/* URL Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Where is your website hosted?</label>

            {/* Local Development with ngrok */}
            <button
              onClick={() => handleUrlTypeChange('ngrok')}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                urlType === 'ngrok'
                  ? 'border-primary bg-primary/10'
                  : 'border-border-default bg-surface hover:border-border-subtle'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    urlType === 'ngrok' ? 'border-primary' : 'border-gray-500'
                  }`}
                >
                  {urlType === 'ngrok' && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Local Development (ngrok)</h3>
                  <p className="text-sm text-gray-400">
                    Use ngrok to expose your local server (e.g., https://abc123.ngrok.io)
                  </p>
                </div>
              </div>
            </button>

            {/* Live Website */}
            <button
              onClick={() => handleUrlTypeChange('live')}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                urlType === 'live'
                  ? 'border-primary bg-primary/10'
                  : 'border-border-default bg-surface hover:border-border-subtle'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    urlType === 'live' ? 'border-primary' : 'border-gray-500'
                  }`}
                >
                  {urlType === 'live' && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Live Website</h3>
                  <p className="text-sm text-gray-400">Your live website (e.g., https://yourcompany.com)</p>
                </div>
              </div>
            </button>
          </div>

          {/* ngrok Guide (Expandable) */}
          {showNgrokGuide && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <button
                onClick={() => setShowNgrokGuide(!showNgrokGuide)}
                className="w-full flex items-center justify-between text-left mb-3"
              >
                <h4 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  How to set up ngrok
                </h4>
                <svg
                  className={`w-5 h-5 text-blue-300 transition-transform ${showNgrokGuide ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-semibold">
                    1
                  </span>
                  <div className="flex-1">
                    <p className="font-medium mb-1">Install ngrok</p>
                    <div className="bg-gray-900 rounded p-2 font-mono text-xs text-green-400">npm install -g ngrok</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-semibold">
                    2
                  </span>
                  <div className="flex-1">
                    <p className="font-medium mb-1">Start your development server</p>
                    <div className="bg-gray-900 rounded p-2 font-mono text-xs text-green-400">npm run dev</div>
                    <p className="text-xs text-gray-400 mt-1">(Usually runs on port 3000)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-semibold">
                    3
                  </span>
                  <div className="flex-1">
                    <p className="font-medium mb-1">Start ngrok tunnel</p>
                    <div className="bg-gray-900 rounded p-2 font-mono text-xs text-green-400">ngrok http 3000</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-semibold">
                    4
                  </span>
                  <div className="flex-1">
                    <p className="font-medium mb-1">Copy the HTTPS URL</p>
                    <p className="text-xs text-gray-400">
                      Look for the &quot;Forwarding&quot; URL (e.g., https://abc123.ngrok.io) and paste it below
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mt-3">
                  <p className="text-xs text-yellow-300">
                    ⚠️ <strong>Note:</strong> ngrok URLs change when you restart ngrok. You&apos;ll need to update the
                    URL here each time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Website URL</label>
            <Input
              type="text"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              placeholder={urlType === 'ngrok' ? 'https://abc123.ngrok.io' : 'https://www.example.com'}
              className="w-full text-black"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface-elevated border-t border-border-default p-6">
          <div className="flex gap-3">
            <Button onClick={handleSave} isLoading={isLoading} className="flex-1">
              Save Website
            </Button>
            <Button onClick={onClose} intent="secondary" disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
