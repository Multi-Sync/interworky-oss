'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import BoltLogo from '../../ProductIcons/BoltLogo';

export default function BoltInstructions({ apiKey, scriptSrc, isLoading }) {
  const [copied, setCopied] = useState(false);

  const prompt = `Add the Interworky AI chat widget to my project. Place this script tag right before </body> in the main index.html file:

<script
  src="${scriptSrc}"
  data-api-key="${apiKey || 'YOUR_API_KEY'}"
></script>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Prompt copied! Paste it in Bolt chat.');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 dark:from-yellow-500/10 dark:to-orange-500/10 border border-yellow-500/40 dark:border-yellow-500/30 rounded-lg">
        <div className="w-12 h-12 rounded-lg bg-yellow-500/30 dark:bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
          <BoltLogo className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">Bolt Integration</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Just copy the prompt below and paste it into Bolt chat. Bolt will add the integration for you!
          </p>
        </div>
      </div>

      {/* Single Step */}
      <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Copy and paste this prompt into Bolt
          </h3>
        </div>

        <div className="relative">
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono overflow-x-auto">
              {isLoading ? 'Loading your API key...' : prompt}
            </pre>
          </div>

          <button
            onClick={handleCopy}
            disabled={isLoading || !apiKey}
            className="absolute top-3 right-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy Prompt'}
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
          <svg
            className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
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
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>That&apos;s it!</strong> Bolt will automatically add the script to your project. After it&apos;s
            done, you&apos;ll see the Interworky chat widget on your site.
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
            Bolt adds the script to your index.html
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            The chat widget appears on your site
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
        </ul>
      </div>
    </div>
  );
}
