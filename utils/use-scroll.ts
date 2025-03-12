import { useState, useEffect } from 'react';

export function useScroll() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    // Set isBrowser to true once the component mounts
    setIsBrowser(true);
    
    // Only run this code on the client side
    if (typeof window === 'undefined') {
      return;
    }

    const calculateScrollValues = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      const docHeight = Math.max(
        document.body.scrollHeight, 
        document.body.offsetHeight,
        document.documentElement.clientHeight, 
        document.documentElement.scrollHeight, 
        document.documentElement.offsetHeight
      ) - window.innerHeight;
      
      setScrollProgress(Math.min(1, currentScrollY / (docHeight || 1)));
    };

    // Calculate initial values
    calculateScrollValues();
    
    // Set up the scroll handler with throttling
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          calculateScrollValues();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { scrollY, scrollProgress, isBrowser };
}
