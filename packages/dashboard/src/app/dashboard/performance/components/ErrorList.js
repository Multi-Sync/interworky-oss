'use client';

import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import CarlaFixProgress from './CarlaFixProgress';

export default function ErrorList({ errors, isLoading, onErrorClick, onFixWithCarla, autoFixEnabled }) {
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Group errors by fingerprint (message + location)
  // This hook must be called before any conditional returns
  const groupedErrors = useMemo(() => {
    if (!errors || errors.length === 0) {
      return [];
    }
    const groups = new Map();

    errors.forEach(error => {
      const fingerprint = `${error.error_type || error.type}-${error.message?.substring(0, 100)}-${error.source_file || error.data?.filename}-${error.line_number || error.data?.lineno}`;

      if (!groups.has(fingerprint)) {
        groups.set(fingerprint, {
          fingerprint,
          type: error.error_type || error.type,
          message: error.message || error.data?.message || 'Unknown error',
          filename: error.source_file || error.data?.filename || 'unknown',
          lineno: error.line_number || error.data?.lineno || 0,
          colno: error.column_number || error.data?.colno || 0,
          // Use severity from backend API (already categorized by determineSeverity function)
          severity: error.severity || 'medium',
          instances: [],
          firstSeen: error.timestamp,
          lastSeen: error.timestamp,
        });
      }

      const group = groups.get(fingerprint);
      group.instances.push(error);

      // Update timestamps
      if (new Date(error.timestamp) < new Date(group.firstSeen)) {
        group.firstSeen = error.timestamp;
      }
      if (new Date(error.timestamp) > new Date(group.lastSeen)) {
        group.lastSeen = error.timestamp;
      }
    });

    // Convert to array and sort by severity then count
    return Array.from(groups.values()).sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.instances.length - a.instances.length;
    });
  }, [errors]);

  // Conditional renders AFTER all hooks are called
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700/30 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (!errors || errors.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        <p>No errors found</p>
      </div>
    );
  }

  const toggleGroup = fingerprint => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(fingerprint)) {
      newExpanded.delete(fingerprint);
    } else {
      newExpanded.add(fingerprint);
    }
    setExpandedGroups(newExpanded);
  };

  const getSeverityColor = severity => {
    switch (severity) {
      case 'critical':
        return 'border-red-400 dark:border-red-500/50 bg-red-100 dark:bg-red-500/10';
      case 'high':
        return 'border-orange-400 dark:border-orange-500/50 bg-orange-100 dark:bg-orange-500/10';
      case 'medium':
        return 'border-yellow-400 dark:border-yellow-500/50 bg-yellow-100 dark:bg-yellow-500/10';
      case 'low':
        return 'border-green-400 dark:border-green-500/50 bg-green-100 dark:bg-green-500/10';
      default:
        return 'border-gray-400 dark:border-gray-500/50 bg-gray-100 dark:bg-gray-500/10';
    }
  };

  const getSeverityBadge = severity => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50 dark:border-red-500/30';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/50 dark:border-orange-500/30';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50 dark:border-yellow-500/30';
      case 'low':
        return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50 dark:border-green-500/30';
      default:
        return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/50 dark:border-gray-500/30';
    }
  };

  const getTrendIcon = group => {
    const recentCount = group.instances.filter(
      e => new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000),
    ).length;
    const oldCount = group.instances.length - recentCount;

    if (recentCount > oldCount * 1.5) {
      return <TrendingUp className="w-4 h-4 text-red-400" />;
    } else if (recentCount < oldCount * 0.5) {
      return <TrendingDown className="w-4 h-4 text-green-400" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getStatusBadge = error => {
    const status = error.status || 'new';

    switch (status) {
      case 'carla_fixing':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
            <Loader2 className="w-3 h-3 animate-spin" />
            Carla analyzing...
          </span>
        );
      case 'pr_created':
        return (
          <a
            href={error.carla_analysis?.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded border border-green-500/30 hover:bg-green-500/30"
            onClick={e => e.stopPropagation()}
          >
            <CheckCircle className="w-3 h-3" />
            PR Created
          </a>
        );
      case 'issue_created':
        return (
          <a
            href={error.carla_analysis?.issue_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded border border-orange-500/30 hover:bg-orange-500/30"
            onClick={e => e.stopPropagation()}
          >
            <AlertTriangle className="w-3 h-3" />
            Issue Created
          </a>
        );
      case 'fix_failed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded border border-red-500/30">
            <AlertTriangle className="w-3 h-3" />
            Fix Failed
          </span>
        );
      case 'resolved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded border border-green-500/30">
            <CheckCircle className="w-3 h-3" />
            Resolved
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {groupedErrors.map(group => {
        const isExpanded = expandedGroups.has(group.fingerprint);

        return (
          <div
            key={group.fingerprint}
            className={`border rounded-lg overflow-hidden transition-all ${getSeverityColor(group.severity)}`}
          >
            {/* Group Header */}
            <div
              className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              onClick={() => toggleGroup(group.fingerprint)}
            >
              {/* Expand/Collapse Icon */}
              <div className="flex-shrink-0 mt-1">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>

              {/* Error Icon */}
              <div className="flex-shrink-0 mt-1">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>

              {/* Error Details */}
              <div className="flex-1 min-w-0">
                {/* Error Message */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-gray-900 dark:text-white font-medium text-sm truncate">{group.message}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded border uppercase ${getSeverityBadge(group.severity)}`}>
                    {group.severity}
                  </span>
                </div>

                {/* Location */}
                <div className="text-gray-600 dark:text-gray-400 text-xs font-mono mb-2">
                  {group.filename}:{group.lineno}:{group.colno}
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    📊 {group.instances[0]?.metadata?.custom_data?.occurrence_count || group.instances.length}{' '}
                    occurrence
                    {(group.instances[0]?.metadata?.custom_data?.occurrence_count || group.instances.length) !== 1
                      ? 's'
                      : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    {getTrendIcon(group)}
                    Trend
                  </span>
                  <span>
                    First:{' '}
                    {new Date(group.firstSeen).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'UTC',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    UTC
                  </span>
                  <span>
                    Last:{' '}
                    {new Date(group.lastSeen).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'UTC',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    UTC
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded Instances */}
            {isExpanded && (
              <div className="border-t border-gray-300 dark:border-gray-700/50 bg-gray-50 dark:bg-black/20">
                <div className="p-4 space-y-2">
                  <h4 className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase mb-3">
                    Individual Occurrences (
                    {group.instances[0]?.metadata?.custom_data?.occurrence_count || group.instances.length} total)
                  </h4>
                  {group.instances.map((error, idx) => (
                    <div key={error.id} className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800/30 rounded border border-gray-300 dark:border-gray-700/50 hover:border-primary/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={e => {
                            e.stopPropagation();
                            onErrorClick(error);
                          }}
                        >
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-mono mb-1">
                            Session: {error.session_id || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-500">
                            {new Date(error.timestamp).toLocaleString('en-US', { timeZone: 'UTC' })} UTC
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Status Badge */}
                          {getStatusBadge(error)}

                          {/* Fix with Carla Button */}
                          {error.status === 'new' && onFixWithCarla && autoFixEnabled && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onFixWithCarla(error);
                              }}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-primary/20 text-primary rounded border border-primary/30 hover:bg-primary/30 transition-colors"
                            >
                              <Wrench className="w-3 h-3" />
                              Ask Carla to Fix
                            </button>
                          )}

                          {/* View Details Link */}
                          <div
                            className="text-primary dark:text-primary text-xs hover:text-primary-hover dark:hover:text-primary cursor-pointer"
                            onClick={e => {
                              e.stopPropagation();
                              onErrorClick(error);
                            }}
                          >
                            View Details →
                          </div>
                        </div>
                      </div>

                      {/* Carla Fix Progress */}
                      {error.status === 'carla_fixing' && <CarlaFixProgress errorId={error.id} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
