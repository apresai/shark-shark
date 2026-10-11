/**
 * useWindowSize - React hook for viewport dimension detection
 * 
 * Provides SSR-safe window dimension detection with mobile breakpoint.
 * Requirements: 2.1
 */

import { useSyncExternalStore } from 'react';

export interface WindowSize {
  width: number;
  height: number;
  isMobile: boolean;
}

const MOBILE_BREAKPOINT = 768;

// Default to desktop dimensions for SSR
const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 768;

// The snapshot is encoded as a "width,height" string so useSyncExternalStore
// compares a primitive: an object built per call would never be equal to the
// previous snapshot and would re-render forever.
const DEFAULT_SNAPSHOT = `${DEFAULT_WIDTH},${DEFAULT_HEIGHT}`;

function subscribe(onChange: () => void): () => void {
  window.addEventListener('resize', onChange);
  return () => {
    window.removeEventListener('resize', onChange);
  };
}

function getSnapshot(): string {
  return `${window.innerWidth},${window.innerHeight}`;
}

// The server and the hydrating client render the default size, so the markup
// matches; React then re-renders with the real window size.
function getServerSnapshot(): string {
  return DEFAULT_SNAPSHOT;
}

/**
 * Custom hook that tracks window dimensions and mobile breakpoint
 * Returns SSR-safe default values during server-side rendering
 */
export function useWindowSize(): WindowSize {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [width, height] = snapshot.split(',').map(Number);
  return {
    width,
    height,
    isMobile: width <= MOBILE_BREAKPOINT,
  };
}
