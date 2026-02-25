'use client';
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to track scroll position and detect when past a threshold
 * @param {number} threshold - Scroll position in pixels to trigger isPastThreshold
 * @returns {{ isPastThreshold: boolean, scrollY: number }}
 */
export function useScrollPosition(threshold = 400) {
  const [isPastThreshold, setIsPastThreshold] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    setScrollY(currentScrollY);
    setIsPastThreshold(currentScrollY > threshold);
  }, [threshold]);

  useEffect(() => {
    // Check initial position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return { isPastThreshold, scrollY };
}
