'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Eye,
  Activity,
  Zap,
  Move,
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  Check,
  MapPin,
  Wifi,
  Monitor,
  Globe2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CoreWebVitalsModal({ isOpen, onClose, metricsData }) {
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

  const handleCopyAllMetrics = () => {
    const allMetrics = JSON.stringify(metricsData, null, 2);
    navigator.clipboard.writeText(allMetrics);
    setCopied(true);
    toast.success('All metrics copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper function to get color classes (Tailwind JIT compatibility)
  const getColorClasses = color => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/30',
        icon: 'text-blue-600 dark:text-blue-400',
      },
      purple: {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/30',
        icon: 'text-purple-600 dark:text-purple-400',
      },
      cyan: {
        bg: 'bg-cyan-500/20',
        border: 'border-cyan-500/30',
        icon: 'text-cyan-600 dark:text-cyan-400',
      },
      orange: {
        bg: 'bg-orange-500/20',
        border: 'border-orange-500/30',
        icon: 'text-orange-600 dark:text-orange-400',
      },
      pink: {
        bg: 'bg-pink-500/20',
        border: 'border-pink-500/30',
        icon: 'text-pink-600 dark:text-pink-400',
      },
      indigo: {
        bg: 'bg-indigo-500/20',
        border: 'border-indigo-500/30',
        icon: 'text-indigo-600 dark:text-indigo-400',
      },
    };
    return colorMap[color] || colorMap.blue;
  };

  // Helper function to get rating color classes
  const getRatingColorClasses = color => {
    const colorMap = {
      green: 'text-green-700 dark:text-green-400',
      yellow: 'text-yellow-700 dark:text-yellow-400',
      red: 'text-red-700 dark:text-red-400',
      gray: 'text-gray-700 dark:text-gray-400',
    };
    return colorMap[color] || colorMap.gray;
  };

  // Don't render on server or if not open
  if (!mounted || !isOpen || !metricsData) return null;

  // Extract data with proper fallbacks
  const coreWebVitals = metricsData.core_web_vitals || {};
  const loadingPerformance = metricsData.loading_performance || {};
  const resources = metricsData.resources || {};
  const runtime = metricsData.runtime || {};
  const network = metricsData.network || {};
  const images = metricsData.images || {};
  const device = metricsData.device || {};
  const browser = metricsData.browser || {};
  const networkInfo = metricsData.network_info || {};
  const location = metricsData.location || {};
  const mobile = metricsData.mobile || {};
  const score = metricsData.score || 0;

  // Helper function to get metric rating
  const getRating = (metric, value) => {
    if (!value && value !== 0)
      return { label: 'N/A', color: 'gray', bgColor: 'bg-gray-100 dark:bg-gray-800', icon: Minus };

    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      ttfb: { good: 600, poor: 800 },
      cls: { good: 0.1, poor: 0.25 },
      inp: { good: 200, poor: 500 },
      fid: { good: 100, poor: 300 },
    };

    const threshold = thresholds[metric];
    if (!threshold)
      return {
        label: 'OK',
        color: 'blue',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        icon: Minus,
      };

    if (value <= threshold.good) {
      return {
        label: 'Good',
        color: 'green',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        icon: TrendingUp,
      };
    } else if (value <= threshold.poor) {
      return {
        label: 'Needs Improvement',
        color: 'yellow',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        icon: Minus,
      };
    } else {
      return {
        label: 'Poor',
        color: 'red',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        icon: TrendingDown,
      };
    }
  };

  const metrics = [
    {
      key: 'fcp',
      name: 'First Contentful Paint',
      value: coreWebVitals.fcp,
      unit: 'ms',
      icon: Eye,
      color: 'blue',
      description: 'Time until first content appears on screen',
      thresholds: { good: '< 1.8s', needsImprovement: '1.8s - 3.0s', poor: '> 3.0s' },
    },
    {
      key: 'lcp',
      name: 'Largest Contentful Paint',
      value: coreWebVitals.lcp,
      unit: 'ms',
      icon: Activity,
      color: 'purple',
      description: 'Time until largest content element is visible',
      thresholds: { good: '< 2.5s', needsImprovement: '2.5s - 4.0s', poor: '> 4.0s' },
    },
    {
      key: 'ttfb',
      name: 'Time to First Byte',
      value: coreWebVitals.ttfb,
      unit: 'ms',
      icon: Zap,
      color: 'cyan',
      description: 'Server response time',
      thresholds: { good: '< 600ms', needsImprovement: '600ms - 800ms', poor: '> 800ms' },
    },
    {
      key: 'cls',
      name: 'Cumulative Layout Shift',
      value: coreWebVitals.cls,
      unit: '',
      icon: Move,
      color: 'orange',
      description: 'Visual stability metric',
      thresholds: { good: '< 0.1', needsImprovement: '0.1 - 0.25', poor: '> 0.25' },
    },
    {
      key: 'inp',
      name: 'Interaction to Next Paint',
      value: coreWebVitals.inp,
      unit: 'ms',
      icon: Gauge,
      color: 'pink',
      description: 'Responsiveness to user interactions',
      thresholds: { good: '< 200ms', needsImprovement: '200ms - 500ms', poor: '> 500ms' },
    },
    {
      key: 'fid',
      name: 'First Input Delay',
      value: coreWebVitals.fid,
      unit: 'ms',
      icon: Zap,
      color: 'indigo',
      description: 'Time to first interaction',
      thresholds: { good: '< 100ms', needsImprovement: '100ms - 300ms', poor: '> 300ms' },
    },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="core-web-vitals-title"
    >
      <div
        className="relative bg-white dark:bg-surface  border border-gray-300 dark:border-blue-500/30 rounded-xl w-full max-w-6xl max-h-[90vh] m-2 sm:m-4 shadow-2xl  flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-surface  rounded-xl  -z-10" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6 border-b border-gray-300 dark:border-blue-500/20">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 id="core-web-vitals-title" className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Core Web Vitals
              </h3>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              {score > 0 && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                  Performance Score: {Math.round(score)}
                </span>
              )}
              <span className="text-xs">{new Date(metricsData.timestamp).toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center self-start sm:self-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-blue-500/10 rounded-lg touch-manipulation"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
          {/* Action Button */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyAllMetrics}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm touch-manipulation ${
                copied
                  ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/50'
                  : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-200 dark:hover:bg-blue-500/30'
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
                  Copy All Metrics
                </>
              )}
            </button>
          </div>

          {/* Core Web Vitals Grid */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map(metric => {
                const rating = getRating(metric.key, metric.value);
                const Icon = metric.icon;
                const colorClasses = getColorClasses(metric.color);
                const ratingColorClass = getRatingColorClasses(rating.color);

                return (
                  <div
                    key={metric.key}
                    className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/30 dark:to-gray-900/30 rounded-lg p-4 border border-gray-300 dark:border-gray-700/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">{metric.name}</h5>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${rating.bgColor} ${ratingColorClass}`}
                      >
                        {rating.icon && <rating.icon className="w-3 h-3" />}
                        {rating.label}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metric.value !== undefined && metric.value !== null
                          ? metric.key === 'cls'
                            ? metric.value.toFixed(3)
                            : Math.round(metric.value)
                          : 'N/A'}
                      </span>
                      {metric.unit && metric.value !== undefined && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">{metric.unit}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{metric.description}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">Good: {metric.thresholds.good}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">
                          OK: {metric.thresholds.needsImprovement}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">Poor: {metric.thresholds.poor}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Loading Performance */}
          {Object.keys(loadingPerformance).length > 0 && (
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Loading Performance</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(loadingPerformance)
                  .filter(([, value]) => value !== undefined) // Skip undefined values
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-gray-100 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-300 dark:border-gray-700/50"
                    >
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 capitalize">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {typeof value === 'number' ? Math.round(value) : value}
                        {typeof value === 'number' && (
                          <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">ms</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              {/* Info about cached/reused connections */}
              {(loadingPerformance.dns_lookup === undefined ||
                loadingPerformance.tcp_connection === undefined ||
                loadingPerformance.ssl_negotiation === undefined) && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Some network timings (DNS, TCP, SSL) are not shown because the page used
                    cached resources or reused an existing connection. This is actually good for performance!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Device & Browser Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Device Info */}
            {device && Object.keys(device).length > 0 && (
              <div className="bg-gray-100 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-300 dark:border-gray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Device</h5>
                </div>
                <div className="space-y-2 text-sm">
                  {device.device_type && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Type:</span>
                      <span className="text-gray-900 dark:text-white font-medium capitalize">{device.device_type}</span>
                    </div>
                  )}
                  {device.os_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">OS:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {device.os_name} {device.os_version}
                      </span>
                    </div>
                  )}
                  {device.screen_resolution && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Screen:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{device.screen_resolution}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Browser Info */}
            {browser && Object.keys(browser).length > 0 && (
              <div className="bg-gray-100 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-300 dark:border-gray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Globe2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Browser</h5>
                </div>
                <div className="space-y-2 text-sm">
                  {browser.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {browser.name} {browser.version}
                      </span>
                    </div>
                  )}
                  {browser.language && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Language:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{browser.language}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Network Info */}
            {networkInfo && Object.keys(networkInfo).length > 0 && (
              <div className="bg-gray-100 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-300 dark:border-gray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Network</h5>
                </div>
                <div className="space-y-2 text-sm">
                  {networkInfo.effective_type && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Type:</span>
                      <span className="text-gray-900 dark:text-white font-medium uppercase">
                        {networkInfo.effective_type}
                      </span>
                    </div>
                  )}
                  {networkInfo.downlink && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Downlink:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{networkInfo.downlink} Mbps</span>
                    </div>
                  )}
                  {networkInfo.rtt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">RTT:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{networkInfo.rtt} ms</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location Info */}
            {location && Object.keys(location).length > 0 && (
              <div className="bg-gray-100 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-300 dark:border-gray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Location</h5>
                </div>
                <div className="space-y-2 text-sm">
                  {location.city && location.region && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Location:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {location.city}, {location.region}
                      </span>
                    </div>
                  )}
                  {location.country && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Country:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{location.country}</span>
                    </div>
                  )}
                  {location.timezone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Timezone:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{location.timezone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
