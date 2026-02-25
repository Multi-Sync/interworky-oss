'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrganization } from '@/_common/utils/localStorage';
import { isPlaceholderWebsite } from '@/_common/utils/utils';
import WebsiteEntryModal from './WebsiteEntryModal';
import VerifyPluginModal from './VerifyPluginModal';
import SupportModal from './SupportModal';

const OnboardingCTA = ({ pluginStatus }) => {
  const router = useRouter();
  const organization = getOrganization()?.organization;
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Level 1 Check: Website
  const websiteUrl = organization?.organization_website;
  const hasWebsite = websiteUrl && !isPlaceholderWebsite(websiteUrl);

  // Level 2 Check: Plugin
  const hasPlugin = pluginStatus?.isInstalled && pluginStatus?.isResponding;

  // Determine current step and if onboarding is complete
  const currentStep = !hasWebsite ? 1 : !hasPlugin ? 2 : 3;
  const isComplete = hasWebsite && hasPlugin;

  // Don't show CTA if everything is complete
  if (isComplete) {
    return null;
  }

  const handleWebsiteSuccess = () => {
    setShowWebsiteModal(false);
    // Optionally navigate to tutorial if plugin not installed
    if (!hasPlugin) {
      setTimeout(() => {
        router.push('/dashboard/tutorial');
      }, 500);
    }
  };

  const handleVerifySuccess = () => {
    setShowVerifyModal(false);
    // Refresh the page or trigger a revalidation
    window.location.reload();
  };

  if (isCollapsed) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full flex items-center justify-between p-4 rounded-lg border border-blue-200 dark:border-primary/30 bg-blue-50 dark:bg-primary/10 hover:bg-blue-100 dark:hover:bg-primary/15 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-primary/20 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Complete Setup ({currentStep}/3)</span>
          </div>
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="relative overflow-hidden rounded-lg border border-blue-200 dark:border-primary/30 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-primary/10 dark:to-cyan-500/10 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Get Started with Interworky</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete these steps to start using Carla on your website
              </p>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label="Minimize"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round(((currentStep - 1) / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-surface-elevated rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {/* Step 1: Add Website */}
            <div
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                currentStep === 1
                  ? 'border-blue-300 dark:border-primary bg-blue-100 dark:bg-primary/10'
                  : hasWebsite
                    ? 'border-green-300 dark:border-green-500/30 bg-green-100 dark:bg-green-500/10'
                    : 'border-gray-200 dark:border-border-default bg-white dark:bg-surface'
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  hasWebsite
                    ? 'bg-green-200 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                    : 'bg-blue-200 dark:bg-primary/20 text-blue-700 dark:text-primary'
                }`}
              >
                {hasWebsite ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="font-semibold">1</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Add Your Website</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {hasWebsite ? websiteUrl : 'Set your website URL (ngrok supported for local dev)'}
                </p>
              </div>
              {currentStep === 1 ? (
                <button
                  onClick={() => setShowWebsiteModal(true)}
                  className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors text-sm"
                >
                  Add Website
                </button>
              ) : hasWebsite ? (
                <button
                  onClick={() => setShowWebsiteModal(true)}
                  className="text-sm text-primary hover:text-primary-hover underline"
                >
                  Update
                </button>
              ) : null}
            </div>

            {/* Step 2: Integrate Plugin */}
            <div
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                currentStep === 2
                  ? 'border-blue-300 dark:border-primary bg-blue-100 dark:bg-primary/10'
                  : hasPlugin
                    ? 'border-green-300 dark:border-green-500/30 bg-green-100 dark:bg-green-500/10'
                    : !hasWebsite
                      ? 'border-gray-200 dark:border-border-default bg-white dark:bg-surface opacity-50'
                      : 'border-gray-200 dark:border-border-default bg-white dark:bg-surface'
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  hasPlugin
                    ? 'bg-green-200 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                    : !hasWebsite
                      ? 'bg-gray-200 dark:bg-gray-500/20 text-gray-500 dark:text-gray-500'
                      : 'bg-blue-200 dark:bg-primary/20 text-blue-700 dark:text-primary'
                }`}
              >
                {hasPlugin ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : !hasWebsite ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                ) : (
                  <span className="font-semibold">2</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Integrate Plugin</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {hasPlugin
                    ? 'Plugin is connected and working'
                    : !hasWebsite
                      ? 'Add your website first'
                      : 'Follow the tutorial to install the Carla widget'}
                </p>
              </div>
              {currentStep === 2 ? (
                <button
                  onClick={() => router.push('/dashboard/tutorial')}
                  className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors text-sm"
                >
                  View Tutorial
                </button>
              ) : hasPlugin ? (
                <span className="text-xs text-green-700 dark:text-green-400 font-medium">✓ Connected</span>
              ) : null}
            </div>

            {/* Step 3: Verify Plugin */}
            <div
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                currentStep === 3
                  ? 'border-blue-300 dark:border-primary bg-blue-100 dark:bg-primary/10'
                  : !hasWebsite || !pluginStatus?.isInstalled
                    ? 'border-gray-200 dark:border-border-default bg-white dark:bg-surface opacity-50'
                    : 'border-gray-200 dark:border-border-default bg-white dark:bg-surface'
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  !hasWebsite || !pluginStatus?.isInstalled
                    ? 'bg-gray-200 dark:bg-gray-500/20 text-gray-500 dark:text-gray-500'
                    : 'bg-blue-200 dark:bg-primary/20 text-blue-700 dark:text-primary'
                }`}
              >
                {!hasWebsite || !pluginStatus?.isInstalled ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                ) : (
                  <span className="font-semibold">3</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Verify Plugin Integration</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {!hasWebsite || !pluginStatus?.isInstalled
                    ? 'Complete previous steps first'
                    : 'Check if the plugin is working on your website'}
                </p>
              </div>
              {currentStep === 3 ? (
                <button
                  onClick={() => setShowVerifyModal(true)}
                  className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors text-sm"
                >
                  Verify
                </button>
              ) : null}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-border-default">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Need help?{' '}
              <a href="/dashboard/tutorial" className="text-primary hover:text-primary-hover underline">
                View tutorial
              </a>{' '}
              or{' '}
              <button
                onClick={() => setIsSupportModalOpen(true)}
                className="text-primary hover:text-primary-hover underline"
              >
                contact support
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WebsiteEntryModal
        isOpen={showWebsiteModal}
        onClose={() => setShowWebsiteModal(false)}
        onSuccess={handleWebsiteSuccess}
        initialUrl={websiteUrl || ''}
      />

      <VerifyPluginModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        websiteUrl={websiteUrl}
        onOpenWebsiteModal={() => setShowWebsiteModal(true)}
        onSuccess={handleVerifySuccess}
      />

      <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />
    </>
  );
};

export default OnboardingCTA;
