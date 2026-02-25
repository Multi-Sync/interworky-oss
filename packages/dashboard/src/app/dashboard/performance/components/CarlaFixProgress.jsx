'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function CarlaFixProgress({ errorId }) {
  const [progress, setProgress] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!errorId) return;

    let intervalId = null;

    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/models/performance-monitoring/errors/${errorId}/fix-progress`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 404) {
          // No active progress, stop polling
          if (intervalId) {
            clearInterval(intervalId);
          }
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch progress');
        }

        const data = await response.json();
        setProgress(data.data);

        // Stop polling if completed or failed
        if (data.data.status === 'completed' || data.data.status === 'failed') {
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err);
        setError(err.message);
        if (intervalId) {
          clearInterval(intervalId);
        }
      }
    };

    // Fetch immediately
    fetchProgress();

    // Poll every 2 seconds
    intervalId = setInterval(fetchProgress, 2000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [errorId]);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
        <div className="text-xs text-red-400">Failed to load progress: {error}</div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const getStatusIcon = () => {
    if (progress.status === 'in_progress') {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
    } else if (progress.status === 'completed') {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    } else if (progress.status === 'failed') {
      return <XCircle className="w-4 h-4 text-red-400" />;
    }
    return null;
  };

  const getStatusColor = () => {
    if (progress.status === 'in_progress') {
      return 'border-blue-500/20 bg-blue-500/10';
    } else if (progress.status === 'completed') {
      return 'border-green-500/20 bg-green-500/10';
    } else if (progress.status === 'failed') {
      return 'border-red-500/20 bg-red-500/10';
    }
    return 'border-gray-500/20 bg-gray-500/10';
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${getStatusColor()}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-white">{progress.currentStep}</span>
        </div>
        <div className="flex items-center gap-2">
          {progress.steps.length > 0 && <span className="text-xs text-gray-400">{progress.steps.length} steps</span>}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Detailed Steps */}
      {expanded && progress.steps.length > 0 && (
        <div className="border-t border-white/10 bg-black/20 p-3">
          <div className="space-y-2">
            {progress.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className="text-gray-500 font-mono whitespace-nowrap">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </span>
                <div className="flex-1">
                  <div className="text-gray-300">{step.step}</div>
                  {step.details && <div className="text-gray-500 mt-1">{JSON.stringify(step.details, null, 2)}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Result */}
          {progress.status === 'completed' && progress.result && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs">
                <div className="text-green-400 font-semibold mb-2">✓ Analysis Complete</div>
                {progress.result.pr_url && (
                  <div className="mb-1">
                    <span className="text-gray-400">PR: </span>
                    <a
                      href={progress.result.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {progress.result.pr_url}
                    </a>
                  </div>
                )}
                {progress.result.issue_url && (
                  <div className="mb-1">
                    <span className="text-gray-400">Issue: </span>
                    <a
                      href={progress.result.issue_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {progress.result.issue_url}
                    </a>
                  </div>
                )}
                <div className="text-gray-400 mt-2">
                  Confidence: <span className="text-white">{progress.result.confidence}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {progress.status === 'failed' && progress.error && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-red-400">
                <div className="font-semibold mb-1">✗ Failed</div>
                <div>{progress.error}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
