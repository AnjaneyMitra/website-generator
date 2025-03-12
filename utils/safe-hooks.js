import { useEffect, useLayoutEffect } from 'react';

// Safely handle server-side rendering
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Safely use effects on client-side only
export const useClientSideEffect = (callback, deps) => {
  const isClient = typeof window !== 'undefined';
  
  useEffect(() => {
    if (isClient) {
      return callback();
    }
    // Return empty cleanup function for server-side
    return () => {};
  }, deps);
};
