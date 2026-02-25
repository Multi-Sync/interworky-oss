'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Copy,
  Check,
  AlertTriangle,
  Code,
  User,
  Globe,
  Clock,
  Activity,
  Wrench,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ErrorDetailsModal({
  error,
  isOpen,
  onClose,
  onFixWithCarla,
  onResolveError,
  onDeleteError,
  autoFixEnabled,
}) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleCopyStackTrace = () => {
    const stackTrace = error?.stack_trace || error?.data?.stack || error?.data?.rawStack || 'No stack trace available';
    navigator.clipboard.writeText(stackTrace);
    setCopied(true);
    toast.success('Stack trace copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyFullError = () => {
    const fullError = JSON.stringify(error, null, 2);
    navigator.clipboard.writeText(fullError);
    toast.success('Full error data copied to clipboard!');
  };

  const handleFixWithCarla = async () => {
    if (!onFixWithCarla) return;

    setIsFixing(true);
    try {
      await onFixWithCarla(error);
      // Don't close modal - let user see the updated status
    } catch (err) {
      console.error('Failed to fix with Carla:', err);
    } finally {
      setIsFixing(false);
    }
  };

  const handleResolveError = async () => {
    if (!onResolveError) return;

    setIsResolving(true);
    try {
      await onResolveError(error);
      toast.success('Error marked as resolved');
      onClose(); // Close modal after resolving
    } catch (err) {
      console.error('Failed to resolve error:', err);
      toast.error('Failed to resolve error');
    } finally {
      setIsResolving(false);
    }
  };

  const handleDeleteError = async () => {
    if (!onDeleteError) return;

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this error and all its occurrences? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteError(error);
      toast.success('Error deleted successfully');
      onClose(); // Close modal after deletion
    } catch (err) {
      console.error('Failed to delete error:', err);
      toast.error('Failed to delete error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Don't render on server or if not open
  if (!mounted || !isOpen || !error) return null;

  const getSeverityColor = () => {
    const type = error.type;
    if (type === 'unhandled_exception' || type === 'promise_rejection') {
      return 'from-red-500/20 to-red-600/20 border-red-500/30';
    }
    if (type === 'console_error' || type === 'resource_error') {
      return 'from-orange-500/20 to-orange-600/20 border-orange-500/30';
    }
    return 'from-primary/20 to-purple-600/20 border-primary/30';
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-details-title"
    >
      <div
        className="relative bg-white dark:bg-[#0a0e27]/95 backdrop-blur-xl border border-gray-300 dark:border-primary/30 rounded-xl w-full max-w-6xl max-h-[90vh] m-4 shadow-2xl dark:shadow-primary/20 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-r ${getSeverityColor()} rounded-xl blur-xl -z-10`} />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-primary/20">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h3 id="error-details-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                {error.data?.message || 'Error Details'}
              </h3>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-mono">
                {error.data?.filename || 'unknown'}:{error.data?.lineno || 0}:{error.data?.colno || 0}
              </span>
              <span className="px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded text-xs uppercase">
                {error.type}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors p-2 hover:bg-gray-100 dark:hover:bg-primary/10 rounded-lg"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Error Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Timestamp */}
            <div className="bg-gray-100 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-300 dark:border-gray-700/50">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-2">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">Timestamp</span>
              </div>
              <div className="text-gray-900 dark:text-white">{new Date(error.timestamp).toLocaleString()}</div>
            </div>

            {/* Session ID */}
            <div className="bg-gray-100 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-300 dark:border-gray-700/50">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-2">
                <User className="w-4 h-4" />
                <span className="font-semibold">Session ID</span>
              </div>
              <div className="text-gray-900 dark:text-white font-mono text-sm truncate">{error.sessionId || 'N/A'}</div>
            </div>

            {/* URL */}
            <div className="bg-gray-100 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-300 dark:border-gray-700/50 col-span-2">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-2">
                <Globe className="w-4 h-4" />
                <span className="font-semibold">Page URL</span>
              </div>
              <div className="text-gray-900 dark:text-white text-sm break-all">{error.url || 'N/A'}</div>
            </div>
          </div>

          {/* Stack Trace */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <Code className="w-5 h-5 text-primary" />
                <span>Stack Trace</span>
              </div>
              <button
                onClick={handleCopyStackTrace}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  copied
                    ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/50 dark:border-green-500/30'
                    : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Stack Trace
                  </>
                )}
              </button>
            </div>
            <div className="bg-gray-100 dark:bg-black/40 rounded-lg p-4 border border-gray-300 dark:border-primary/20 overflow-x-auto">
              <pre className="text-sm text-gray-900 dark:text-gray-300 font-mono whitespace-pre-wrap">
                {error.stack_trace || error.data?.stack || error.data?.rawStack || 'No stack trace available'}
              </pre>
            </div>
          </div>

          {/* User Journey / Breadcrumbs */}
          {error.context?.breadcrumbs && error.context.breadcrumbs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold mb-3">
                <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>User Journey (What led to this error?)</span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-300 dark:border-gray-700/50 space-y-2">
                {error.context.breadcrumbs.map((breadcrumb, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <span className="text-gray-600 dark:text-gray-500 font-mono">{idx + 1}.</span>
                    <div className="flex-1">
                      <span className="text-cyan-700 dark:text-cyan-400 font-semibold">{breadcrumb.type}</span>
                      {breadcrumb.data && (
                        <span className="text-gray-600 dark:text-gray-400 ml-2">
                          {JSON.stringify(breadcrumb.data, null, 0).substring(0, 100)}
                        </span>
                      )}
                      <div className="text-xs text-gray-600 dark:text-gray-500 mt-1">
                        {new Date(breadcrumb.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Console History */}
          {error.context?.consoleHistory && error.context.consoleHistory.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold mb-3">
                <Code className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span>Console History (Before crash)</span>
              </div>
              <div className="bg-gray-100 dark:bg-black/40 rounded-lg p-4 border border-yellow-400 dark:border-yellow-500/20 space-y-1">
                {error.context.consoleHistory.map((log, idx) => (
                  <div key={idx} className="text-sm font-mono">
                    <span
                      className={`${
                        log.level === 'error'
                          ? 'text-red-600 dark:text-red-400'
                          : log.level === 'warn'
                            ? 'text-yellow-700 dark:text-yellow-400'
                            : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="text-gray-900 dark:text-gray-300 ml-2">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Environment Info */}
          {error.context?.environment && (
            <div>
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold mb-3">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Environment</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Network */}
                {error.context.environment.network && (
                  <div className="bg-gray-100 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-300 dark:border-gray-700/50">
                    <h4 className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase mb-2">Network</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>{' '}
                        <span className="text-gray-900 dark:text-white">
                          {error.context.environment.network.online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>{' '}
                        <span className="text-gray-900 dark:text-white">
                          {error.context.environment.network.connectionType}
                        </span>
                      </div>
                      {error.context.environment.network.downlink && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Speed:</span>{' '}
                          <span className="text-gray-900 dark:text-white">
                            {error.context.environment.network.downlink} Mbps
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Viewport */}
                {error.context.environment.viewport && (
                  <div className="bg-gray-100 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-300 dark:border-gray-700/50">
                    <h4 className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase mb-2">Viewport</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Size:</span>{' '}
                        <span className="text-gray-900 dark:text-white">
                          {error.context.environment.viewport.width} x {error.context.environment.viewport.height}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Scroll:</span>{' '}
                        <span className="text-gray-900 dark:text-white">
                          ({error.context.environment.viewport.scrollX}, {error.context.environment.viewport.scrollY})
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">DPR:</span>{' '}
                        <span className="text-gray-900 dark:text-white">
                          {error.context.environment.viewport.devicePixelRatio}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Agent */}
          <div className="bg-gray-100 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-300 dark:border-gray-700/50">
            <h4 className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase mb-2">User Agent</h4>
            <div className="text-sm text-gray-900 dark:text-white font-mono break-all">{error.userAgent || 'N/A'}</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-300 dark:border-primary/20">
          {/* Left side - Primary actions */}
          <div className="flex items-center gap-3">
            {/* Fix with Carla - Only show if auto-fix enabled and not already fixed/resolving */}
            {onFixWithCarla && autoFixEnabled && error.status !== 'pr_created' && error.status !== 'resolved' && (
              <button
                onClick={handleFixWithCarla}
                disabled={isFixing || error.status === 'carla_fixing'}
                className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wrench className={`w-4 h-4 ${isFixing || error.status === 'carla_fixing' ? 'animate-spin' : ''}`} />
                {isFixing || error.status === 'carla_fixing' ? 'Analyzing...' : 'Fix with Carla'}
              </button>
            )}

            {/* Resolve Error - Only show if not already resolved */}
            {onResolveError && error.status !== 'resolved' && (
              <button
                onClick={handleResolveError}
                disabled={isResolving}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                {isResolving ? 'Resolving...' : 'Resolve Error'}
              </button>
            )}

            {/* Delete Error */}
            {onDeleteError && (
              <button
                onClick={handleDeleteError}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete Error'}
              </button>
            )}
          </div>

          {/* Right side - Secondary actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyFullError}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-lg text-gray-700 dark:text-gray-300 hover:border-primary/50 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              Copy Full Error JSON
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-r from-primary to-primary text-white rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render modal at document body level using Portal
  return createPortal(modalContent, document.body);
}
