import { useState, useEffect } from 'react';

/**
 * Hook to detect if the viewport is mobile-sized (< 1024px / lg breakpoint)
 * Uses matchMedia for efficient, reactive viewport detection
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  
  return isMobile;
}
