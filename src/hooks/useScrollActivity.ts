import { useEffect, useRef } from 'react';

export const useScrollActivity = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  callback: () => void,
  delay: number
) => {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      if (currentScrollTop !== lastScrollTop.current) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(callback, delay);
        lastScrollTop.current = currentScrollTop;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [containerRef, callback, delay]);
};