'use client';

import { WixLogo } from '../../ProductIcons/IntegrationLogos';
import ScriptDisplay from './ScriptDisplay';
import { useNotification } from '@/_common/utils/handleSlackNotification';

export default function WixInstructions({ apiKey, scriptSrc, isLoading }) {
  const { handleNotification } = useNotification();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-500/40 dark:border-indigo-500/30 rounded-lg">
        <div className="w-12 h-12 rounded-lg bg-indigo-500/30 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <WixLogo className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">Wix Integration</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">Add the script to your Wix site using Custom Code</p>
        </div>
      </div>

      {/* Step 1 - Copy Script */}
      <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Copy the Script Tag</h3>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">Copy this script tag to add to your Wix site:</p>

        <ScriptDisplay
          apiKey={apiKey}
          scriptSrc={scriptSrc}
          isLoading={isLoading}
          handleNotification={handleNotification}
        />
      </div>

      {/* Step 2 - Add to Wix */}
      <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Custom Code in Wix</h3>
        </div>

        <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">1.</span>
            In your Wix dashboard, go to <strong>Settings → Custom Code</strong>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">2.</span>
            Click <strong>+ Add Code</strong> in the Body section
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">3.</span>
            Paste the script and set it to load on <strong>All pages</strong>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">4.</span>
            Place code at <strong>Body - end</strong>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">5.</span>
            Click <strong>Apply</strong> and publish your site
          </li>
        </ol>

        <div className="mt-4 flex items-start gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 rounded-lg">
          <svg
            className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5"
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
          <p className="text-sm text-indigo-800 dark:text-indigo-300">
            <strong>Note:</strong> Custom Code requires a Wix Premium plan.
          </p>
        </div>
      </div>

      {/* Documentation Link */}
      <div className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Need more help?</h4>
        <a
          href="https://interworky.gitbook.io/interworky/integration/integration-to-wix-websites"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          View detailed Wix integration guide
        </a>
      </div>

      {/* What happens next */}
      <div className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">What happens next?</h4>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            The chat widget appears on all pages of your site
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Visitors can chat with your AI assistant
          </li>
        </ul>
      </div>
    </div>
  );
}
