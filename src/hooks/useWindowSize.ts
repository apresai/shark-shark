/**
 * useWindowSize - React hook for viewport dimension detection
 * 
 * Provides SSR-safe window dimension detection with mobile breakpoint.
 * Requirements: 2.1
 */

import { useState, useEffect } from 'react';

export interface WindowSize {
  width: number;
  height: number;
  isMobile: boolean;
}

const MOBILE_BREAKPOINT = 768;

// Default to desktop dimensions for SSR
const getDefaultSize = (): WindowSize => ({
  width: 1024,
  height: 768,
  isMobile: false,
});

const getWindowSize = (): WindowSize => {
  if (typeof window === 'undefined') {
    return getDefaultSize();
  }
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  return {
    width,
    height,
    isMobile: width <= MOBILE_BREAKPOINT,
  };
};

/**
 * Custom hook that tracks window dimensions and mobile breakpoint
 * Returns SSR-safe default values during server-side rendering
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(getDefaultSize);

  useEffect(() => {
    // Set initial size on mount (client-side only)
    setWindowSize(getWindowSize());

    const handleResize = () => {
      setWindowSize(getWindowSize());
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowSize;
}
