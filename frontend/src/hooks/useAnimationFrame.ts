import { useRef, useEffect } from 'react';

export const useAnimationFrame = (callback: (deltaTime: number) => void, active: boolean) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  const animate = (time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    if (active) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (active) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      previousTimeRef.current = undefined;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [active, callback]);
};
