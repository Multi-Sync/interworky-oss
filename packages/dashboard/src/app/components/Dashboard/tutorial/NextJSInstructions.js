'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import NextjsLogo from '../../ProductIcons/NextjsLogo';
import ScriptDisplay from './ScriptDisplay';
import { useNotification } from '@/_common/utils/handleSlackNotification';

export default function NextJSInstructions({ apiKey, scriptSrc, isLoading }) {
  const { handleNotification } = useNotification();
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText('npx @interworky/carla-nextjs install');
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2000);
      toast.success('Command copied!');
    } catch (err) {
      console.error('Failed to copy command:', err);
      toast.error('Failed to copy command');
    }
  };

  const handleCopyEnv = async () => {
    try {
      const envLine = apiKey ? `NEXT_PUBLIC_CARLA_API_KEY=${apiKey}` : 'NEXT_PUBLIC_CARLA_API_KEY=your-api-key-here';
      await navigator.clipboard.writeText(envLine);
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
      toast.success('Environment variable copied!');
    } catch (err) {
      console.error('Failed to copy env:', err);
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-gray-500/20 to-gray-600/20 dark:from-gray-500/10 dark:to-gray-600/10 border border-gray-500/40 dark:border-gray-500/30 rounded-lg">
        <div className="w-12 h-12 rounded-lg bg-gray-500/30 dark:bg-gray-500/20 flex items-center justify-center flex-shrink-0">
          <NextjsLogo className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">Next.js / React Integration</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Use our CLI for automatic installation, or manually embed the script tag
          </p>
        </div>
      </div>

      {/* CLI Quick Install */}
      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10 border border-blue-500/40 dark:border-blue-500/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Install (Recommended)</h3>
        </div>

        <div className="space-y-4">
          {/* Step 1: Add API Key */}
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
              Add your API key to{' '}
              <code className="bg-gray-200 dark:bg-gray-800/50 px-2 py-0.5 rounded text-xs text-gray-800 dark:text-gray-300">
                .env
              </code>
            </p>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-100 dark:bg-gray-900/80 rounded-lg p-3 overflow-x-auto border border-gray-300 dark:border-gray-700/50">
                <code className="text-xs text-green-700 dark:text-green-400 font-mono">
                  {apiKey ? `NEXT_PUBLIC_CARLA_API_KEY=${apiKey}` : 'NEXT_PUBLIC_CARLA_API_KEY=your-api-key-here'}
                </code>
              </div>
              <button
                onClick={handleCopyEnv}
                disabled={isLoading || !apiKey}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0"
              >
                {copiedEnv ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Step 2: Run Installer */}
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">Run the installer:</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-100 dark:bg-gray-900/80 rounded-lg p-3 overflow-x-auto border border-gray-300 dark:border-gray-700/50">
                <code className="text-xs text-green-700 dark:text-green-400 font-mono">
                  npx @interworky/carla-nextjs install
                </code>
              </div>
              <button
                onClick={handleCopyCommand}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0"
              >
                {copiedCommand ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="mt-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700/30 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-2">This automatically:</p>
              <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-1 ml-4">
                <li>Creates the widget component</li>
                <li>Adds it to your layout</li>
                <li>Configures everything for you</li>
              </ul>
            </div>
          </div>

          {/* Step 3: Restart */}
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">Restart your dev server:</p>
            <div className="bg-gray-100 dark:bg-gray-900/80 rounded-lg p-3 overflow-x-auto border border-gray-300 dark:border-gray-700/50">
              <code className="text-xs text-green-700 dark:text-green-400 font-mono">npm run dev</code>
            </div>
          </div>

          {/* Prerequisites */}
          <div className="border-t border-blue-300 dark:border-blue-700/30 pt-4">
            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-2">Prerequisites:</p>
            <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-1 ml-4">
              <li>Run from your Next.js project root directory</li>
              <li>Requires Node.js 18+</li>
              <li>Supports App Router and Pages Router</li>
            </ul>
          </div>

          {/* Documentation Link */}
          <div className="flex items-center gap-2 pt-2">
            <svg
              className="w-4 h-4 text-blue-600 dark:text-blue-400"
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
            <a
              href="https://carla.interworky.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors"
            >
              View full Carla Next.js documentation
            </a>
          </div>
        </div>
      </div>

      {/* Manual Script Embed */}
      <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manual Script Embed</h3>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
          For manual setup, embed the script tag directly in your HTML:
        </p>

        <ScriptDisplay
          apiKey={apiKey}
          scriptSrc={scriptSrc}
          isLoading={isLoading}
          handleNotification={handleNotification}
        />
      </div>
    </div>
  );
}
