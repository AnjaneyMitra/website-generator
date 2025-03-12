'use client';

import { useEffect, useState } from 'react';

/**
 * A utility component that only renders its children on the client side
 * to prevent hydration issues with components that use browser APIs
 */
export function ClientOnly({ children, fallback = null }) {
  const [isClient, setIsClient] = useState(false);

  // Using useEffect in a safe way
  useEffect(() => {
    // This code only runs on the client
    setIsClient(true);
  }, []);

  // Return fallback on server, children on client
  return isClient ? children : fallback;
}

/**
 * Hook that returns true if we're in the browser, false otherwise
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return isClient;
}
