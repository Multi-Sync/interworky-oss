'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Save, AlertCircle, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';

/**
 * Conversion Config Form
 * Allows users to configure conversion tracking (button clicks or page visits)
 *
 * HOW IT WORKS:
 * BUTTON TRACKING:
 * 1. User selects "Button Click" and configures a CSS selector (e.g., "#checkout-btn")
 * 2. Configuration is saved to MongoDB (conversion_configs collection)
 * 3. The assistant widget automatically fetches the active config on initialization
 * 4. A click listener is attached to the configured element
 * 5. When clicked, a conversion event is tracked with element context
 *
 * PAGE VISIT TRACKING:
 * 1. User selects "Page Visit" and configures a page URL (e.g., "/thank-you")
 * 2. Configuration is saved to MongoDB (conversion_configs collection)
 * 3. The assistant widget automatically fetches the active config on initialization
 * 4. When the specified page is visited, a conversion event is tracked
 *
 * REQUIREMENTS:
 * - analytics_enabled must be true in AssistantInfo (now default)
 * - For button tracking: Element with the specified selector must exist on the page
 * - For page visit tracking: Page URL must be accessible
 * - Only ONE active conversion config per organization at a time
 *
 * DEBUGGING:
 * - Check browser console for "[Interworky Conversion]" logs
 * - Validation failures are displayed in this form with page URLs
 * - Use "Test Selector" button to validate CSS selector syntax (button tracking only)
 */
export default function ConversionConfigForm({ organizationId }) {
  const [config, setConfig] = useState(null);
  const [formData, setFormData] = useState({
    conversion_name: '',
    conversion_type: 'button', // 'button' or 'page_visit'
    element_selector: '',
    page_url: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectorValidation, setSelectorValidation] = useState(null);

  // Fetch existing config on mount
  useEffect(() => {
    if (!organizationId) return;

    async function fetchConfig() {
      try {
        const response = await fetch(`/api/conversion-config/${organizationId}`);
        const data = await response.json();

        if (data.config) {
          setConfig(data.config);
          setFormData({
            conversion_name: data.config.conversion_name || '',
            conversion_type: data.config.conversion_type || 'button',
            element_selector: data.config.element_selector || '',
            page_url: data.config.page_url || '',
          });
        }
      } catch (error) {
        console.error('Error fetching conversion config:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfig();
  }, [organizationId]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage(null);
    // Clear selector validation when user changes the selector
    if (name === 'element_selector') {
      setSelectorValidation(null);
    }
  };

  const testSelector = () => {
    if (!formData.element_selector.trim()) {
      setSelectorValidation({
        type: 'error',
        text: 'Please enter a CSS selector first',
      });
      return;
    }

    try {
      // Test if the selector is valid CSS syntax
      document.querySelector(formData.element_selector);
      setSelectorValidation({
        type: 'success',
        text: 'Valid CSS selector syntax',
      });
    } catch (error) {
      setSelectorValidation({
        type: 'error',
        text: `Invalid CSS selector: ${error.message}`,
      });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      // Validate required fields based on conversion type
      if (!formData.conversion_name.trim()) {
        setMessage({
          type: 'error',
          text: 'Conversion name is required',
        });
        setIsSaving(false);
        return;
      }

      if (formData.conversion_type === 'button' && !formData.element_selector.trim()) {
        setMessage({
          type: 'error',
          text: 'CSS selector is required for button tracking',
        });
        setIsSaving(false);
        return;
      }

      if (formData.conversion_type === 'page_visit' && !formData.page_url.trim()) {
        setMessage({
          type: 'error',
          text: 'Page URL is required for page visit tracking',
        });
        setIsSaving(false);
        return;
      }

      const method = config ? 'PUT' : 'POST';
      const body = config ? { ...formData, id: config.id } : formData;

      const response = await fetch(`/api/conversion-config/${organizationId}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      setConfig(data.config);
      setMessage({
        type: 'success',
        text: 'Conversion configuration saved successfully!',
      });
    } catch (error) {
      console.error('Error saving conversion config:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to save configuration',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-cyan-400/40 dark:border-cyan-500/20 p-6"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-100 dark:bg-white/5 rounded"></div>
            <div className="h-10 bg-gray-100 dark:bg-white/5 rounded"></div>
            <div className="h-10 bg-gray-100 dark:bg-white/5 rounded"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white/80 to-white/80 dark:from-[#0a0e27]/80 dark:to-[#0a0e27]/40 backdrop-blur-xl border border-cyan-400/40 dark:border-cyan-500/20 p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conversion Tracking Configuration</h3>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/20">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium text-cyan-700 dark:text-cyan-400 mb-1">How it works:</p>
            <p>
              Enter a CSS selector (like{' '}
              <code className="px-1.5 py-0.5 bg-cyan-100 dark:bg-white/10 rounded text-cyan-800 dark:text-cyan-400">
                #checkout-btn
              </code>{' '}
              or{' '}
              <code className="px-1.5 py-0.5 bg-cyan-100 dark:bg-white/10 rounded text-cyan-800 dark:text-cyan-400">
                .buy-button
              </code>
              ) to track clicks as conversions. The element must exist on your website.
            </p>
          </div>
        </div>
      </div>

      {/* Validation Status - Show if config exists and has validation failures */}
      {config && config.validation_failures && config.validation_failures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-400 dark:border-amber-500/30"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                Element Not Found on Some Pages
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                The configured selector could not be found on the following pages:
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {config.validation_failures
                  .slice(-5)
                  .reverse()
                  .map((failure, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <XCircle className="w-3 h-3 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-gray-700 dark:text-gray-300 font-mono break-all">{failure.page_url}</p>
                        <p className="text-gray-500 dark:text-gray-500 text-[10px]">
                          {new Date(failure.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
              {config.validation_failures.length > 5 && (
                <p className="text-xs text-gray-600 dark:text-gray-500 mt-2">
                  ...and {config.validation_failures.length - 5} more
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Success Status - Show if config exists and NO validation failures */}
      {config && (!config.validation_failures || config.validation_failures.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-400 dark:border-emerald-500/30"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div className="text-sm text-emerald-700 dark:text-emerald-400">
              <p className="font-medium">Tracking Active</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Your conversion element is being tracked successfully
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Conversion Name */}
        <div>
          <label htmlFor="conversion_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Conversion Name <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            type="text"
            id="conversion_name"
            name="conversion_name"
            value={formData.conversion_name}
            onChange={handleInputChange}
            placeholder="e.g., Checkout Button, Sign Up Form"
            className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-gray-600/50 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-500/50 focus:border-cyan-500 dark:focus:border-cyan-500/50 transition-all"
            required
          />
        </div>

        {/* CSS Selector */}
        <div>
          <label htmlFor="element_selector" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CSS Selector <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="element_selector"
              name="element_selector"
              value={formData.element_selector}
              onChange={handleInputChange}
              placeholder="e.g., #checkout-btn, .buy-now-button, button[name='purchase']"
              className="flex-1 px-4 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-gray-600/50 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-500/50 focus:border-cyan-500 dark:focus:border-cyan-500/50 transition-all font-mono text-sm"
              required
            />
            <button
              type="button"
              onClick={testSelector}
              className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-300 dark:border-gray-600/50 hover:border-cyan-500 dark:hover:border-cyan-500/50 rounded-lg text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all text-sm font-medium whitespace-nowrap"
            >
              Test Selector
            </button>
          </div>

          {/* Selector Validation Message */}
          <AnimatePresence>
            {selectorValidation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mt-2 p-2 rounded flex items-center gap-2 text-xs ${
                  selectorValidation.type === 'success'
                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                }`}
              >
                {selectorValidation.type === 'success' ? (
                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                )}
                <span>{selectorValidation.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-500">
            Use browser DevTools to find the element&apos;s selector (right-click → Inspect)
          </p>
        </div>

        {/* Page URL (Optional) */}
        <div>
          <label htmlFor="page_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Page URL <span className="text-gray-600 dark:text-gray-500 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            id="page_url"
            name="page_url"
            value={formData.page_url}
            onChange={handleInputChange}
            placeholder="e.g., /pricing, /checkout"
            className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-gray-600/50 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-500/50 focus:border-cyan-500 dark:focus:border-cyan-500/50 transition-all"
          />
        </div>

        {/* Element Description (Optional) */}
        <div>
          <label
            htmlFor="element_description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Description <span className="text-gray-600 dark:text-gray-500 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            id="element_description"
            name="element_description"
            value={formData.element_description}
            onChange={handleInputChange}
            placeholder="e.g., Main checkout button on pricing page"
            className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-gray-600/50 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-500/50 focus:border-cyan-500 dark:focus:border-cyan-500/50 transition-all"
          />
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-400 dark:border-emerald-500/30'
                : 'bg-red-50 dark:bg-red-500/10 border border-red-400 dark:border-red-500/30'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <p
              className={`text-sm ${message.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}
            >
              {message.text}
            </p>
          </motion.div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-cyan-500/50 disabled:shadow-none flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : config ? 'Update Configuration' : 'Save Configuration'}</span>
        </button>
      </form>
    </motion.div>
  );
}
