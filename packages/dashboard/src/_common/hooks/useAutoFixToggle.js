/**
 * useAutoFixToggle Hook
 * React hook for toggling auto-fix enabled status
 */

'use client';

import { useState, useEffect } from 'react';
import { updateAutoFixEnabled } from '../api/assistantInfo';
import getErrorMessage from '../utils/axios/axiosGetErrorMessage';

/**
 * Hook for managing auto-fix toggle state
 * @param {string} organizationId - Organization UUID
 * @param {boolean} initialValue - Initial auto-fix enabled state
 * @returns {Object} { autoFixEnabled, isLoading, error, toggleAutoFix }
 */
export function useAutoFixToggle(organizationId, initialValue = false) {
  const [autoFixEnabled, setAutoFixEnabled] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync internal state with external prop changes (when SWR data loads)
  useEffect(() => {
    setAutoFixEnabled(initialValue);
  }, [initialValue]);

  /**
   * Toggle auto-fix enabled status
   * @param {boolean} newValue - New auto-fix enabled value
   * @throws {Error} When the API call fails
   */
  const toggleAutoFix = async newValue => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await updateAutoFixEnabled(organizationId, newValue);

      if (response.success) {
        setAutoFixEnabled(response.data.auto_fix_enabled);
        console.log(`[AutoFix] Auto-fix ${newValue ? 'enabled' : 'disabled'} successfully`);
      } else {
        throw new Error('Failed to update auto-fix status');
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('[AutoFix] Failed to toggle auto-fix:', errorMessage);
      // Revert to previous state on error
      setAutoFixEnabled(!newValue);
      // Re-throw the error so the caller can handle it
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    autoFixEnabled,
    isLoading,
    error,
    toggleAutoFix,
  };
}
