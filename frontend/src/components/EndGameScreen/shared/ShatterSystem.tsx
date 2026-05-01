import React from 'react';
import { ParticleEngine } from './ParticleEngine';
import { ParticleConfig } from '../../../hooks/useParticleSystem';

export const ShatterSystem: React.FC<{ active: boolean; colors: string[] }> = ({ active, colors }) => {
  const config: ParticleConfig = {
    count: 35,
    colors,
    speed: { min: 8, max: 20 },
    size: { min: 5, max: 18 },
    lifetime: 4000,
    gravity: 0.8,
    spread: Math.PI * 2,
    shapes: ['rect', 'triangle'],
  };

  return (
    <ParticleEngine
      config={config}
      active={active}
      spawnPoint={{ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 }}
    />
  );
};
