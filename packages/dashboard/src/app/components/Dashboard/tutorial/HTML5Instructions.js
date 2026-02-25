'use client';

import { HTML5Logo } from '../../ProductIcons/IntegrationLogos';
import ScriptDisplay from './ScriptDisplay';
import { useNotification } from '@/_common/utils/handleSlackNotification';

export default function HTML5Instructions({ apiKey, scriptSrc, isLoading }) {
  const { handleNotification } = useNotification();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-orange-500/20 to-red-500/20 dark:from-orange-500/10 dark:to-red-500/10 border border-orange-500/40 dark:border-orange-500/30 rounded-lg">
        <div className="w-12 h-12 rounded-lg bg-orange-500/30 dark:bg-orange-500/20 flex items-center justify-center flex-shrink-0">
          <HTML5Logo className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">HTML / Static Site Integration</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Add the script tag to your HTML file to embed the AI assistant
          </p>
        </div>
      </div>

      {/* Single Step */}
      <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add the script tag to your HTML</h3>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
          Copy this script tag and paste it right before the closing{' '}
          <code className="bg-gray-200 dark:bg-gray-800/50 px-2 py-0.5 rounded text-xs text-gray-800 dark:text-gray-300">
            &lt;/body&gt;
          </code>{' '}
          tag in your HTML file:
        </p>

        <ScriptDisplay
          apiKey={apiKey}
          scriptSrc={scriptSrc}
          isLoading={isLoading}
          handleNotification={handleNotification}
        />

        <div className="mt-4 flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded-lg">
          <svg
            className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
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
          <p className="text-sm text-orange-800 dark:text-orange-300">
            <strong>That&apos;s it!</strong> The chat widget will appear on your page as soon as you save and reload.
          </p>
        </div>
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
            The chat widget appears on your page
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
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Add the script to every page where you want the widget
          </li>
        </ul>
      </div>
    </div>
  );
}
