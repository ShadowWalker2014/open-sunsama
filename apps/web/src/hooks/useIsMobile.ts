import { useState, useEffect, useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 1023;

/**
 * Hook to detect if the viewport is mobile-sized (< 1024px / lg breakpoint)
 * Uses useSyncExternalStore for correct SSR hydration
 */
export function useIsMobile(): boolean {
  const subscribe = (callback: () => void) => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    mq.addEventListener('change', callback);
    return () => mq.removeEventListener('change', callback);
  };

  const getSnapshot = () => {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  };

  const getServerSnapshot = () => {
    // Default to desktop on server
    return false;
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
