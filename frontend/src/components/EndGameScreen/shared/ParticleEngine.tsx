import React, { useRef, useEffect } from 'react';
import { ParticleConfig } from '../../../hooks/useParticleSystem';
import { useAnimationFrame } from '../../../hooks/useAnimationFrame';
import { random, randomInt, randomChoice } from '../../../utils/random';

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

export const ParticleEngine: React.FC<{
  config: ParticleConfig;
  active: boolean;
  spawnPoint?: { x: number; y: number };
}> = ({ config, active, spawnPoint }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  const createParticle = (x: number, y: number): Particle => {
    const angle = random(-config.spread / 2, config.spread / 2) - Math.PI / 2;
    const speed = random(config.speed.min, config.speed.max);
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: random(config.size.min, config.size.max),
      color: randomChoice(config.colors),
      shape: randomChoice(config.shapes),
      life: config.lifetime * random(0.8, 1.2),
      maxLife: config.lifetime,
      angle: random(0, Math.PI * 2),
      spin: random(-0.2, 0.2),
    };
  };

  useEffect(() => {
    if (active) {
      const cx = spawnPoint?.x ?? window.innerWidth / 2;
      const cy = spawnPoint?.y ?? window.innerHeight / 2;
      for (let i = 0; i < config.count; i++) {
        particlesRef.current.push(createParticle(cx, cy));
      }
    }
  }, [active, config.count]); // Trigger exact burst

  useAnimationFrame((dt) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear transparent
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    particlesRef.current = particlesRef.current.filter((p) => {
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);
      p.vy += config.gravity * (dt / 16);
      p.angle += p.spin * (dt / 16);
      p.life -= dt;

      if (p.life <= 0) return false;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(0, -p.size / 2);
        ctx.lineTo(p.size / 2, p.size / 2);
        ctx.lineTo(-p.size / 2, p.size / 2);
        ctx.fill();
      }

      ctx.restore();
      return true;
    });
  }, true);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 mix-blend-screen"
      width={typeof window !== 'undefined' ? window.innerWidth : 800}
      height={typeof window !== 'undefined' ? window.innerHeight : 600}
    />
  );
};
