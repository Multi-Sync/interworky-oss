'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, Code, FileText, Image as ImageIcon, Film, AlertCircle, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OptimizationIssuesModal({ isOpen, onClose, issues, category, metricsData }) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted (client-side only)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleCopyCode = code => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code example copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAllIssues = () => {
    const allIssues = issues
      .map(issue => `${issue.title}\n${issue.description}\n${issue.recommendation}\n\n`)
      .join('\n');
    navigator.clipboard.writeText(allIssues);
    toast.success('All issues copied to clipboard!');
  };

  // Don't render on server or if not open
  if (!mounted || !isOpen || !issues || issues.length === 0) return null;

  const getCategoryIcon = () => {
    switch (category) {
      case 'Scripts':
        return <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
      case 'Stylesheets':
        return <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />;
      case 'Images':
        return <ImageIcon className="w-6 h-6 text-green-600 dark:text-green-400" />;
      default:
        return <Film className="w-6 h-6 text-orange-600 dark:text-orange-400" />;
    }
  };

  const getCategoryColor = () => {
    switch (category) {
      case 'Scripts':
        return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
      case 'Stylesheets':
        return 'from-purple-500/20 to-purple-600/20 border-purple-500/30';
      case 'Images':
        return 'from-green-500/20 to-green-600/20 border-green-500/30';
      default:
        return 'from-orange-500/20 to-orange-600/20 border-orange-500/30';
    }
  };

  const getSeverityColor = severity => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
      case 'medium':
        return 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400';
      case 'low':
        return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getImpactColor = impact => {
    switch (impact) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-orange-600 dark:text-orange-400';
      case 'low':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="optimization-issues-title"
    >
      <div
        className="relative bg-white dark:bg-surface backdrop-blur-xl    rounded-xl w-full max-w-6xl max-h-[90vh] m-2 sm:m-4 shadow-2xl  flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 bg-black rounded-xl blur-xl -z-10`} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6  ">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {getCategoryIcon()}
              <h3
                id="optimization-issues-title"
                className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
              >
                {category} Optimization Issues
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 rounded text-xs font-medium">
                {issues.length} {issues.length === 1 ? 'issue' : 'issues'} found
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center self-start sm:self-center text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-orange-500/10 rounded-lg touch-manipulation"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopyAllIssues}
              className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-500/30 transition-all text-sm font-medium touch-manipulation"
            >
              <Copy className="w-4 h-4" />
              Copy All Issues
            </button>
          </div>

          {/* Issues List */}
          {issues.map((issue, index) => (
            <div
              key={issue._id || index}
              className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/30 dark:to-gray-900/30 rounded-lg p-4 sm:p-6 border border-gray-300 dark:border-gray-700/50 space-y-4"
            >
              {/* Issue Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{issue.title}</h4>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{issue.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 self-start">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium uppercase ${getSeverityColor(issue.severity)}`}
                  >
                    {issue.severity}
                  </span>
                  {issue.impact && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 ${getImpactColor(issue.impact)}`}
                    >
                      {issue.impact} impact
                    </span>
                  )}
                </div>
              </div>

              {/* Resource Details */}
              {issue.url && (
                <div className="bg-gray-100 dark:bg-black/40 rounded-lg p-3 border border-gray-300 dark:border-gray-700/50">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">Resource URL:</div>
                  <div className="text-sm text-gray-900 dark:text-white font-mono break-all">{issue.url}</div>
                </div>
              )}

              {/* Size Info */}
              {issue.size !== undefined && issue.size > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Size:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{(issue.size / 1024).toFixed(2)} KB</span>
                </div>
              )}

              {/* Recommendation */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/50">
                <div className="flex items-start gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">Recommendation</div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">{issue.recommendation}</p>
                  </div>
                </div>
              </div>

              {/* Code Example */}
              {issue.code && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                      <Code className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>Code Example</span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(issue.code)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all touch-manipulation ${
                        copied
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/50'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-900 dark:bg-black rounded-lg p-4 border border-gray-700 overflow-x-auto">
                    <pre className="text-xs sm:text-sm text-green-400 font-mono whitespace-pre-wrap">{issue.code}</pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
