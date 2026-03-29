import React, { useState, useEffect } from 'react';
import { ParticleEngine } from './ParticleEngine';
import { ParticleConfig } from '../../../hooks/useParticleSystem';
import { randomInt } from '../../../utils/random';

export const FireworkSystem: React.FC<{ active: boolean; colors: string[] }> = ({ active, colors }) => {
  const [bursts, setBursts] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    if (active) {
      const b = [];
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          setBursts(prev => [...prev, {
            x: randomInt(window.innerWidth * 0.2, window.innerWidth * 0.8),
            y: randomInt(window.innerHeight * 0.2, window.innerHeight * 0.5),
            id: Date.now() + i
          }]);
        }, i * 200 + randomInt(0, 200));
      }
    } else {
      setBursts([]);
    }
  }, [active]);

  const config: ParticleConfig = {
    count: 40,
    colors,
    speed: { min: 5, max: 15 },
    size: { min: 3, max: 6 },
    lifetime: 1500,
    gravity: 0.2,
    spread: Math.PI * 2,
    shapes: ['circle'],
  };

  return (
    <>
      {bursts.map((b) => (
        <ParticleEngine key={b.id} config={config} active={true} spawnPoint={{ x: b.x, y: b.y }} />
      ))}
    </>
  );
};
