import { useState, RefObject } from 'react';
import { useAnimationFrame } from './useAnimationFrame';

export interface ParticleConfig {
  count: number;
  colors: string[];
  speed: { min: number; max: number };
  size: { min: number; max: number };
  lifetime: number;
  gravity: number;
  spread: number;
  shapes: ('circle' | 'rect' | 'triangle')[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: string;
  life: number;
  maxLife: number;
  angle: number;
  spin: number;
}

export const useParticleSystem = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  config: ParticleConfig
) => {
  const [active, setActive] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const start = () => setActive(true);
  const stop = () => setActive(false);

  const burst = (x: number, y: number, burstCount?: number) => {
    const pCount = burstCount || config.count;
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < pCount; i++) {
      const angle = (Math.random() * config.spread) - (config.spread / 2) - Math.PI / 2;
      const speed = Math.random() * (config.speed.max - config.speed.min) + config.speed.min;
      
      newParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * (config.size.max - config.size.min) + config.size.min,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        shape: config.shapes[Math.floor(Math.random() * config.shapes.length)],
        life: config.lifetime * (0.8 + Math.random() * 0.4), // variation
        maxLife: config.lifetime,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    if (!active) setActive(true);
  };

  useAnimationFrame((deltaTime) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    let aliveParticles = false;

    setParticles(prev => {
      const updated = prev.map(p => {
        const lifeRatio = p.life / p.maxLife;
        p.x += p.vx * (deltaTime / 16);
        p.y += p.vy * (deltaTime / 16);
        p.vy += config.gravity * (deltaTime / 16);
        p.angle += p.spin * (deltaTime / 16);
        p.life -= deltaTime;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = Math.max(0, lifeRatio);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size/2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size/2);
          ctx.lineTo(p.size/2, p.size/2);
          ctx.lineTo(-p.size/2, p.size/2);
          ctx.fill();
        }
        
        ctx.restore();

        if (p.life > 0) aliveParticles = true;
        return p;
      }).filter(p => p.life > 0);
      
      return updated;
    });

    if (!aliveParticles && !active) {
       // stop? wait, active implies continuous spawning, which isn't implemented here, 
       // but 'burst' handles one-time bursts.
    }
  }, active || particles.length > 0);

  return { start, stop, burst };
};
