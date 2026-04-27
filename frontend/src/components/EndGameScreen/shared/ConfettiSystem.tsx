import React from 'react';
import { ParticleEngine } from './ParticleEngine';
import { ParticleConfig } from '../../../hooks/useParticleSystem';

export const ConfettiSystem: React.FC<{ active: boolean; colors: string[] }> = ({ active, colors }) => {
  const config: ParticleConfig = {
    count: 150,
    colors,
    speed: { min: 10, max: 25 },
    size: { min: 6, max: 12 },
    lifetime: 4000,
    gravity: 0.8,
    spread: Math.PI * 1.5,
    shapes: ['rect', 'circle', 'triangle'],
  };

  return <ParticleEngine config={config} active={active} spawnPoint={{ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: -50 }} />;
};

export const DebrisSystem: React.FC<{ active: boolean; colors: string[] }> = ({ active, colors }) => {
  const config: ParticleConfig = {
    count: 80,
    colors,
    speed: { min: 5, max: 15 },
    size: { min: 4, max: 15 },
    lifetime: 5000,
    gravity: 0.5,
    spread: Math.PI,
    shapes: ['rect', 'triangle'],
  };

  return <ParticleEngine config={config} active={active} spawnPoint={{ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: -50 }} />;
};
