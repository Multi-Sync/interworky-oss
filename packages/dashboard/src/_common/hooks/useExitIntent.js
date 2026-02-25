'use client';
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect exit intent (mouse leaving viewport at top)
 * @param {Object} options
 * @param {number} options.threshold - Y position threshold to trigger (default: 50)
 * @param {number} options.delay - Delay in ms before enabling detection (default: 5000)
 * @param {number} options.cookieExpiry - Days before showing again (default: 7)
 * @returns {{ showExitIntent: boolean, setShowExitIntent: Function }}
 */
export function useExitIntent({ threshold = 50, delay = 5000, cookieExpiry = 7 } = {}) {
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  // Check localStorage for previous trigger on mount
  useEffect(() => {
    const lastShown = localStorage.getItem('exitIntentLastShown');
    if (lastShown) {
      const daysSince = (Date.now() - parseInt(lastShown, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < cookieExpiry) {
        setHasTriggered(true);
      }
    }
  }, [cookieExpiry]);

  // Enable exit intent after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEnabled(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const handleMouseLeave = useCallback(
    e => {
      if (!isEnabled || hasTriggered) return;

      // Only trigger when mouse leaves at the top of the viewport
      if (e.clientY < threshold) {
        setShowExitIntent(true);
        setHasTriggered(true);
        localStorage.setItem('exitIntentLastShown', Date.now().toString());
      }
    },
    [isEnabled, hasTriggered, threshold],
  );

  useEffect(() => {
    if (!isEnabled) return;

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isEnabled, handleMouseLeave]);

  return { showExitIntent, setShowExitIntent };
}
