import { useState, useEffect } from 'react';

export const useStaggeredEntrance = (
  itemCount: number,
  staggerDelay: number = 300,
  initialDelay: number = 0
): boolean[] => {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(Array(itemCount).fill(false));

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    setVisibleItems(Array(itemCount).fill(false));

    setTimeout(() => {
      for (let i = 0; i < itemCount; i++) {
        const timeout = setTimeout(() => {
          setVisibleItems(prev => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * staggerDelay);
        timeouts.push(timeout);
      }
    }, initialDelay);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [itemCount, staggerDelay, initialDelay]);

  return visibleItems;
};
