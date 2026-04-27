import { useState, useCallback, CSSProperties } from 'react';

export interface ScreenShakeConfig {
  intensity: number;
  duration: number;
  frequency: number;
}

export const useScreenShake = () => {
  const [shakeStyle, setShakeStyle] = useState<CSSProperties>({});

  const triggerShake = useCallback((config: ScreenShakeConfig) => {
    let startTime = Date.now();
    
    const shake = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < config.duration) {
        const progress = 1 - elapsed / config.duration;
        const offset = Math.sin(elapsed * config.frequency) * config.intensity * progress;
        setShakeStyle({ transform: `translateX(${offset}px)` });
        requestAnimationFrame(shake);
      } else {
        setShakeStyle({});
      }
    };
    
    requestAnimationFrame(shake);
  }, []);

  return { triggerShake, style: shakeStyle };
};
