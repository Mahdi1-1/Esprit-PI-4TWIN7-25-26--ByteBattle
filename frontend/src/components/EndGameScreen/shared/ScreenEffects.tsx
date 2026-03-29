import React from 'react';
import { ScreenShakeConfig, useScreenShake } from '../../../hooks/useScreenShake';

interface ScreenEffectsProps {
  shake?: ScreenShakeConfig;
  flash?: 'white' | 'red' | 'blue';
  vignette?: boolean;
  vignetteColor?: string;
  vignetteIntensity?: number;
  chromaticAberration?: boolean;
}

export const ScreenEffects: React.FC<ScreenEffectsProps> = ({
  shake,
  flash,
  vignette,
  vignetteColor = 'rgba(0,0,0,0.8)',
  vignetteIntensity = 50,
  chromaticAberration
}) => {
  const { triggerShake, style } = useScreenShake();

  React.useEffect(() => {
    if (shake) triggerShake(shake);
  }, [shake, triggerShake]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40" style={style}>
      {flash === 'white' && <div className="absolute inset-0 bg-white animate-pulse mix-blend-screen opacity-50" style={{ animationDuration: '0.2s' }} />}
      {flash === 'red' && <div className="absolute inset-0 bg-red-600 mix-blend-multiply opacity-50 animate-pulse" style={{ animationDuration: '0.3s' }} />}
      {flash === 'blue' && <div className="absolute inset-0 bg-blue-600 mix-blend-screen opacity-50 animate-pulse" style={{ animationDuration: '0.3s' }} />}
      
      {vignette && (
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle, transparent 50%, ${vignetteColor} ${100 + vignetteIntensity}%)`
          }}
        />
      )}
      
      {chromaticAberration && (
        <div className="absolute inset-0 chromatic-aberration opacity-30 mix-blend-screen" />
      )}
    </div>
  );
};
