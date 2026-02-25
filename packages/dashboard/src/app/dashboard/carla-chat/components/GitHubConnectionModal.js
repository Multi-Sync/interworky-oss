'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { TokenTypeSelector } from './TokenTypeSelector';
import { GitHubTokenInstructions } from './GitHubTokenInstructions';
import {
  isValidTokenFormat,
  detectTokenType,
  validateRepositoryFormat,
  getGitHubErrorMessage,
} from './helpers/githubValidation';
import { getOrganization } from '@/_common/utils/localStorage';

/**
 * GitHub Connection Modal Component
 * Enhanced modal for connecting GitHub with detailed instructions
 */
export const GitHubConnectionModal = ({ isOpen, onClose, onSuccess }) => {
  const [tokenType, setTokenType] = useState('fine-grained');
  const [githubConfig, setGithubConfig] = useState({
    token: '',
    owner: '',
    repo: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationWarning, setValidationWarning] = useState(null);

  // Auto-detect token type when user pastes a token
  useEffect(() => {
    if (githubConfig.token) {
      const detected = detectTokenType(githubConfig.token);
      if (detected && detected !== tokenType) {
        setTokenType(detected);
        setValidationWarning(null); // Clear warning if type is auto-corrected
      } else if (!detected) {
        setValidationWarning('⚠️ Unknown token format. Make sure you copied the entire token.');
      } else {
        // Check if format is valid for the selected type
        if (!isValidTokenFormat(githubConfig.token, tokenType)) {
          setValidationWarning(
            `⚠️ Token format doesn't match ${tokenType} type. ${
              tokenType === 'classic'
                ? 'Classic tokens start with "ghp_"'
                : 'Fine-grained tokens start with "github_pat_"'
            }`,
          );
        } else {
          setValidationWarning(null);
        }
      }
    } else {
      setValidationWarning(null);
    }
  }, [githubConfig.token, tokenType]);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate token format
      const detectedType = detectTokenType(githubConfig.token);
      if (!detectedType) {
        setError('Invalid token format. Token should start with "ghp_" (classic) or "github_pat_" (fine-grained)');
        setIsLoading(false);
        return;
      }

      // Validate repository format
      const repoValidation = validateRepositoryFormat(githubConfig.owner, githubConfig.repo);
      if (!repoValidation.valid) {
        setError(repoValidation.error);
        setIsLoading(false);
        return;
      }

      // Get organization ID
      const organization = getOrganization();
      const organizationId = organization?.organization?.id;

      if (!organizationId) {
        setError('Organization not found. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      // Attempt connection
      const response = await fetch('/api/mcp/github/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_token: githubConfig.token,
          repo_owner: githubConfig.owner,
          repo_name: githubConfig.repo,
          organization_id: organizationId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Success!
        setGithubConfig({ token: '', owner: '', repo: '' });
        setError(null);
        setValidationWarning(null);
        onSuccess?.(`${githubConfig.owner}/${githubConfig.repo}`);
        onClose();
      } else {
        // Handle error with user-friendly message
        const errorMessage = getGitHubErrorMessage(
          data.error || 'Connection failed',
          tokenType,
          githubConfig.owner,
          githubConfig.repo,
        );
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Connect GitHub error:', error);
      setError('❌ Connection failed. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setGithubConfig({ token: '', owner: '', repo: '' });
    setError(null);
    setValidationWarning(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-surface border border-border-default rounded-lg shadow-lg max-w-4xl w-full p-8 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center">
              <Github className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-50">Connect GitHub</h2>
              <p className="text-sm text-gray-400">Enable code analysis and automated PR creation</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-base text-gray-400 mb-6 leading-relaxed">
          Connect your GitHub repository to enable Carla to analyze code, search files, and create pull requests for
          performance fixes.
        </p>

        {/* Token Type Selector */}
        <TokenTypeSelector tokenType={tokenType} setTokenType={setTokenType} />

        {/* Instructions */}
        <GitHubTokenInstructions tokenType={tokenType} />

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Validation Warning */}
        {validationWarning && !error && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-400">{validationWarning}</p>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-6 mb-8">
          {/* Token Input */}
          <div>
            <label className="block text-base font-medium text-gray-300 mb-2">
              GitHub {tokenType === 'classic' ? 'Personal Access' : 'Fine-Grained'} Token
            </label>
            <input
              type="password"
              value={githubConfig.token}
              onChange={e => setGithubConfig({ ...githubConfig, token: e.target.value })}
              placeholder={tokenType === 'classic' ? 'ghp_xxxxxxxxxxxx' : 'github_pat_xxxxxxxxxxxx'}
              className="w-full p-4 bg-surface-elevated border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-500 transition-all font-mono text-base"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-500">
                Paste your GitHub token from{' '}
                <a
                  href={
                    tokenType === 'classic'
                      ? 'https://github.com/settings/tokens/new'
                      : 'https://github.com/settings/personal-access-tokens/new'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline"
                >
                  GitHub settings
                </a>
              </p>
              {githubConfig.token && isValidTokenFormat(githubConfig.token, tokenType) && (
                <div className="flex items-center gap-1 text-sm text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valid format</span>
                </div>
              )}
            </div>
          </div>

          {/* Repository Owner */}
          <div>
            <label className="block text-base font-medium text-gray-300 mb-2">Repository Owner</label>
            <input
              type="text"
              value={githubConfig.owner}
              onChange={e => setGithubConfig({ ...githubConfig, owner: e.target.value })}
              placeholder="your-username or organization-name"
              className="w-full p-4 bg-surface-elevated border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-500 transition-all text-base"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-2">Your GitHub username or organization name</p>
          </div>

          {/* Repository Name */}
          <div>
            <label className="block text-base font-medium text-gray-300 mb-2">Repository Name</label>
            <input
              type="text"
              value={githubConfig.repo}
              onChange={e => setGithubConfig({ ...githubConfig, repo: e.target.value })}
              placeholder="my-project"
              className="w-full p-4 bg-surface-elevated border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-500 transition-all text-base"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-2">The name of your repository</p>
          </div>

          {/* Preview */}
          {githubConfig.owner && githubConfig.repo && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-400 mb-2">Repository to connect:</p>
              <p className="text-base text-white font-mono">
                {githubConfig.owner}/{githubConfig.repo}
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button intent="secondary" size="medium" onClick={handleClose} className="flex-1" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            intent="primary"
            size="medium"
            onClick={handleConnect}
            disabled={!githubConfig.token || !githubConfig.owner || !githubConfig.repo || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
