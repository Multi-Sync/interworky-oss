'use client';

import { WordPressLogo } from '../../ProductIcons/IntegrationLogos';
import APIKeyDisplay from './APIKeyDisplay';

export default function WordPressInstructions({ apiKey, isLoading }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-500/10 dark:to-cyan-500/10 border border-blue-500/40 dark:border-blue-500/30 rounded-lg">
        <div className="w-12 h-12 rounded-lg bg-blue-500/30 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <WordPressLogo className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">WordPress Integration</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Install our WordPress plugin and paste your API key to get started
          </p>
        </div>
      </div>

      {/* Step 1 - Install Plugin */}
      <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Install the Plugin</h3>
        </div>

        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Install the Interworky Assistant plugin from the WordPress Plugin Store:
          </p>

          <a
            href="https://wordpress.org/plugins/interworky-assistant/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Open WordPress Plugin Store
          </a>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>Tip:</strong> You can also search for &quot;Interworky Assistant&quot; directly in your WordPress
              admin under Plugins → Add New
            </p>
          </div>
        </div>
      </div>

      {/* Step 2 - Copy API Key */}
      <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Copy Your API Key</h3>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
          Copy your API key and paste it in the plugin settings in your WordPress admin:
        </p>

        <APIKeyDisplay apiKey={apiKey} isLoading={isLoading} />
      </div>

      {/* Step 3 - Configure */}
      <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activate the Plugin</h3>
        </div>

        <p className="text-gray-700 dark:text-gray-300 text-sm">
          Go to <strong>Settings → Interworky Assistant</strong> in your WordPress admin, paste your API key, and save.
          The chat widget will appear on your site immediately.
        </p>
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
            The plugin adds the chat widget to all your pages
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Visitors can now chat with your AI assistant
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            You can customize the widget appearance in the plugin settings
          </li>
        </ul>
      </div>
    </div>
  );
}
