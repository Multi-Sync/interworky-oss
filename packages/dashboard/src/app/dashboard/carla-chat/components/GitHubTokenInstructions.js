'use client';

import { useState } from 'react';
import { ChevronDown, ExternalLink, CheckCircle, Circle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * GitHub Token Instructions Component
 * Provides step-by-step instructions for creating GitHub tokens
 */
const TOKEN_NAME = 'Interworky Carla Assistant';
const TOKEN_DESCRIPTION = 'AI assistant for code analysis and PR creation';

export const GitHubTokenInstructions = ({ tokenType }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const classicInstructions = (
    <div className="space-y-5 text-base leading-relaxed">
      {/* Step 1 */}
      <div className="border-l-2 border-blue-500 pl-4">
        <h4 className="font-semibold text-gray-200 mb-2 text-lg">Step 1: Go to GitHub Settings</h4>
        <p className="text-gray-400 mb-2">Navigate to GitHub token creation page:</p>
        <a
          href="https://github.com/settings/tokens/new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
        >
          github.com/settings/tokens/new
          <ExternalLink className="w-3 h-3" />
        </a>
        <p className="text-xs text-gray-500 mt-2">
          Or: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
        </p>
      </div>

      {/* Step 2 */}
      <div className="border-l-2 border-blue-500 pl-4">
        <h4 className="font-semibold text-gray-200 mb-2 text-lg">Step 2: Configure Token</h4>
        <ul className="space-y-2 text-gray-400">
          <li className="flex items-start gap-2">
            <strong className="text-gray-300 whitespace-nowrap">Token name:</strong>
            <div className="flex items-center gap-2 flex-1">
              <code className="text-blue-400 bg-surface px-2 py-1 rounded">{TOKEN_NAME}</code>
              <button
                type="button"
                onClick={() => copyToClipboard(TOKEN_NAME, 'Token name')}
                className="p-1.5 hover:bg-primary/20 rounded transition-colors flex-shrink-0"
                title="Copy token name"
              >
                <Copy className="w-3.5 h-3.5 text-primary" />
              </button>
            </div>
          </li>
          <li>
            <strong className="text-gray-300">Expiration:</strong> 90 days (recommended) or No expiration
          </li>
        </ul>
      </div>

      {/* Step 3 */}
      <div className="border-l-2 border-blue-500 pl-4">
        <h4 className="font-semibold text-gray-200 mb-3 text-lg">Step 3: Select Scopes (Permissions)</h4>
        <div className="bg-surface-elevated rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-300 mb-2">Required Permissions:</p>
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <code className="text-green-400 font-mono text-xs">repo</code>
                <span className="text-gray-400 text-xs ml-2">(Full control of private repositories)</span>
                <div className="ml-6 mt-1 space-y-0.5 text-xs text-gray-500">
                  <div>✓ repo:status</div>
                  <div>✓ repo_deployment</div>
                  <div>✓ public_repo</div>
                  <div>✓ repo:invite</div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <code className="text-green-400 font-mono text-xs">workflow</code>
                <span className="text-gray-400 text-xs ml-2">(Update GitHub Action workflows)</span>
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-300 mt-3 mb-2">Optional (for enhanced features):</p>
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <code className="text-gray-400 font-mono text-xs">read:org</code>
                <span className="text-gray-500 text-xs ml-2">(Read org and team membership)</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <code className="text-gray-400 font-mono text-xs">gist</code>
                <span className="text-gray-500 text-xs ml-2">(Create gists)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4 */}
      <div className="border-l-2 border-blue-500 pl-4">
        <h4 className="font-semibold text-gray-200 mb-2 text-lg">Step 4: Generate Token</h4>
        <ul className="space-y-1 text-gray-400">
          <li>
            → Scroll down and click <strong className="text-gray-300">&quot;Generate token&quot;</strong>
          </li>
          <li className="text-yellow-400 font-semibold">
            ⚠️ IMPORTANT: Copy the token immediately (you won&apos;t see it again!)
          </li>
          <li>
            → Token format:{' '}
            <code className="text-blue-400 bg-surface px-1 rounded">ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</code>
          </li>
        </ul>
      </div>

      {/* Step 5 */}
      <div className="border-l-2 border-green-500 pl-4">
        <h4 className="font-semibold text-gray-200 mb-2 text-lg">Step 5: Connect to Interworky</h4>
        <ul className="space-y-1 text-gray-400">
          <li>→ Paste the token in the field below</li>
          <li>→ Enter your repository owner (username or organization)</li>
          <li>→ Enter your repository name</li>
          <li>
            → Click <strong className="text-gray-300">&quot;Connect&quot;</strong>
          </li>
        </ul>
      </div>

      {/* Security Tips */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <p className="text-sm font-semibold text-yellow-400 mb-2">🔒 Security Tips</p>
        <ul className="space-y-1 text-sm text-yellow-300">
          <li>⚠️ Never share your token with anyone</li>
          <li>⚠️ Don&apos;t commit tokens to your code repository</li>
          <li>⚠️ Rotate tokens regularly (every 90 days recommended)</li>
          <li>⚠️ Use fine-grained tokens when possible (more secure)</li>
        </ul>
      </div>
    </div>
  );

  const fineGrainedInstructions = (
    <div className="space-y-5 text-base leading-relaxed">
      {/* Why Fine-Grained */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <p className="text-sm font-semibold text-green-400 mb-2">✨ Why Fine-Grained Tokens?</p>
        <ul className="space-y-1 text-sm text-green-300">
          <li>✅ More secure (repository-specific access)</li>
          <li>✅ Granular permissions control</li>
          <li>✅ Better audit trail</li>
          <li>✅ Automatic expiration enforcement</li>
        </ul>
      </div>

      {/* Step 1 */}
      <div className="border-l-2 border-blue-500 pl-4">
        <h4 className="font-semibold text-gray-200 mb-2 text-lg">Step 1: Go to GitHub Settings</h4>
        <p className="text-gray-400 mb-2">Navigate to fine-grained token creation:</p>
        <a
          href="https://github.com/settings/personal-access-tokens/new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
        >
          github.com/settings/personal-access-tokens/new
          <ExternalLink className="w-3 h-3" />
        </a>
        <p className="text-xs text-gray-500 mt-2">
          Or: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
        </p>
      </div>

      {/* Step 2 */}
      <div className="border-l-2 border-blue-500 pl-4">
        <h4 className="font-semibold text-gray-200 mb-2 text-lg">Step 2: Configure Token</h4>
        <ul className="space-y-2 text-gray-400">
          <li className="flex items-start gap-2">
            <strong className="text-gray-300 whitespace-nowrap">Token name:</strong>
            <div className="flex items-center gap-2 flex-1">
              <code className="text-blue-400 bg-surface px-2 py-1 rounded">{TOKEN_NAME}</code>
              <button
                type="button"
                onClick={() => copyToClipboard(TOKEN_NAME, 'Token name')}
                className="p-1.5 hover:bg-primary/20 rounded transition-colors flex-shrink-0"
                title="Copy token name"
              >
                <Copy className="w-3.5 h-3.5 text-primary" />
              </button>
            </div>
          </li>
          <li>
            <strong className="text-gray-300">Expiration:</strong> 90 days (recommended)
          </li>
          <li className="flex items-start gap-2">
            <strong className="text-gray-300 whitespace-nowrap">Description:</strong>
            <div className="flex items-center gap-2 flex-1">
              <code className="text-blue-400 bg-surface px-2 py-1 rounded text-sm">{TOKEN_DESCRIPTION}</code>
              <button
                type="button"
                onClick={() => copyToClipboard(TOKEN_DESCRIPTION, 'Description')}
                className="p-1.5 hover:bg-primary/20 rounded transition-colors flex-shrink-0"
                title="Copy description"
              >
                <Copy className="w-3.5 h-3.5 text-primary" />
              </button>
            </div>
          </li>
          <li>
            <strong className="text-gray-300">Resource owner:</strong> Select your username or organization
          </li>
        </ul>
      </div>

      {/* Step 3 */}
      <div className="border-l-2 border-blue-500 pl-4">
        <h4 className="font-semibold text-gray-200 mb-2 text-lg">Step 3: Repository Access</h4>
        <div className="bg-surface-elevated rounded-lg p-3 space-y-2">
          <p className="text-gray-400 text-xs mb-2">Choose one:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-300 font-semibold text-xs">Only select repositories (Recommended)</p>
                <p className="text-gray-500 text-xs mt-1">→ Click &quot;Select repositories&quot;</p>
                <p className="text-gray-500 text-xs">→ Choose the repository you want to connect</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">All repositories</p>
                <p className="text-gray-500 text-xs mt-1">(Only if you need access to multiple repos)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4 */}
      <div className="border-l-2 border-blue-500 pl-4">
        <h4 className="font-semibold text-gray-200 mb-3 text-lg">Step 4: Repository Permissions</h4>
        <div className="bg-surface-elevated rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-300 mb-2">Set to &quot;Read and write&quot;:</p>
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <code className="text-green-400 font-mono text-xs">Contents</code>
                <span className="text-gray-400 text-xs ml-2">Read and write</span>
                <p className="text-gray-500 text-xs mt-0.5">→ Allows reading files and creating commits</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <code className="text-green-400 font-mono text-xs">Pull requests</code>
                <span className="text-gray-400 text-xs ml-2">Read and write</span>
                <p className="text-gray-500 text-xs mt-0.5">→ Allows creating and managing PRs</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <code className="text-green-400 font-mono text-xs">Issues</code>
                <span className="text-gray-400 text-xs ml-2">Read and write</span>
                <p className="text-gray-500 text-xs mt-0.5">→ Allows creating issues for bugs</p>
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-300 mt-3 mb-2">Optional:</p>
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <code className="text-gray-400 font-mono text-xs">Workflows</code>
                <span className="text-gray-500 text-xs ml-2">Read and write (for updating GitHub Actions)</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <code className="text-blue-400 font-mono text-xs">Metadata</code>
                <span className="text-gray-500 text-xs ml-2">Read-only (automatically selected)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 5 */}
      <div className="border-l-2 border-blue-500 pl-4">
        <h4 className="font-semibold text-gray-200 mb-2 text-lg">Step 5: Generate Token</h4>
        <ul className="space-y-1 text-gray-400">
          <li>
            → Scroll down and click <strong className="text-gray-300">&quot;Generate token&quot;</strong>
          </li>
          <li className="text-yellow-400 font-semibold">⚠️ IMPORTANT: Copy the token immediately!</li>
          <li>
            → Token format:{' '}
            <code className="text-blue-400 bg-surface px-1 rounded">
              github_pat_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
            </code>
          </li>
        </ul>
      </div>

      {/* Step 6 */}
      <div className="border-l-2 border-green-500 pl-4">
        <h4 className="font-semibold text-gray-200 mb-2 text-lg">Step 6: Connect to Interworky</h4>
        <ul className="space-y-1 text-gray-400">
          <li>→ Paste the token in the field below</li>
          <li>→ Enter repository owner (username or org)</li>
          <li>→ Enter repository name</li>
          <li>
            → Click <strong className="text-gray-300">&quot;Connect&quot;</strong>
          </li>
        </ul>
      </div>

      {/* Examples */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-400 mb-2">📝 Repository Format Examples</p>
        <ul className="space-y-1 text-sm text-blue-300 font-mono">
          <li>
            Owner: <span className="text-white">octocat</span> | Repo: <span className="text-white">hello-world</span>
          </li>
          <li>
            Owner: <span className="text-white">your-username</span> | Repo:{' '}
            <span className="text-white">my-project</span>
          </li>
          <li>
            Owner: <span className="text-white">company-name</span> | Repo:{' '}
            <span className="text-white">product-repo</span>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-surface-elevated border border-border-default rounded-lg p-4 hover:bg-neutral-700 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <span className="text-base font-medium text-gray-300">
              How to get a {tokenType === 'classic' ? 'Classic' : 'Fine-Grained'} Token
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 bg-surface-elevated border border-border-default rounded-lg p-6 max-h-[32rem] overflow-y-auto">
          {tokenType === 'classic' ? classicInstructions : fineGrainedInstructions}
        </div>
      )}
    </div>
  );
};
