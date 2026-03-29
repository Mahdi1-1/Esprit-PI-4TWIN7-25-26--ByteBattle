import { useState, useEffect, useRef } from 'react';
import { easing } from '../utils/easing';

export const useCountUp = (
  end: number,
  duration: number,
  start: number = 0,
  easingFunction: (t: number) => number = easing.easeOutExpo
): number => {
  const [value, setValue] = useState(start);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    let frameId: number;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = timestamp - startTime.current;
      const percent = Math.min(progress / duration, 1);
      
      setValue(start + (end - start) * easingFunction(percent));

      if (percent < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };
    
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [end, duration, start, easingFunction]);

  return Math.round(value);
};
