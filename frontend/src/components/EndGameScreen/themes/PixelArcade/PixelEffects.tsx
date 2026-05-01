import React from 'react';
import { motion } from 'framer-motion';

export const PixelEffects: React.FC<{ variant: 'victory' | 'defeat' }> = ({ variant }) => {
  return (
    <>
      {/* Base pixel grid background */}
      <div className={`absolute inset-0 z-0 ${variant === 'victory' ? 'bg-[#1A1A2E]' : 'bg-[#12121F]'}`} style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)`,
        backgroundSize: '4px 4px'
      }} />

      {/* CRT SCANLINES */}
      <div className="absolute inset-0 z-[5] pointer-events-none" style={{
        background: `repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.15),
          rgba(0, 0, 0, 0.15) 1px,
          transparent 1px,
          transparent 2px
        )`,
      }} />

      {/* CRT RGB sub-pixel effect */}
      <div className="absolute inset-0 z-[6] pointer-events-none" style={{
        background: `linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))`,
        backgroundSize: '6px 100%'
      }} />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[13]"
        style={{ boxShadow: 'inset 0 0 120px rgba(0,0,0,0.7)' }}
      />

      {variant === 'victory' && (
        <>
          <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#FF006E]/20 via-transparent to-transparent mix-blend-screen" />
          {/* Floating pixel power-ups */}
          {['⭐', '🍒', '🍄', '💎'].map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl z-[8] pointer-events-none opacity-80"
              style={{
                left: `${15 + i * 20}%`,
                top: `${20 + (i % 2) * 40}%`,
              }}
              animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
            >
              {emoji}
            </motion.div>
          ))}
        </>
      )}
      {variant === 'defeat' && (
        <>
          <div className="absolute inset-0 z-[7] bg-red-900/10 mix-blend-color-burn animate-pulse" />
          {/* Falling pixel blocks */}
          {Array.from({ length: 8 }).map((_, i) => {
            const colors = ['#FF0040', '#3A86FF', '#FFBE0B', '#06FFA5', '#8338EC'];
            return (
              <motion.div
                key={i}
                className="absolute w-[30px] h-[30px] z-[8] pointer-events-none"
                style={{
                  background: colors[i % colors.length],
                  left: `${5 + Math.random() * 90}%`,
                }}
                animate={{ y: [-50, typeof window !== 'undefined' ? window.innerHeight : 800] }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'linear',
                }}
              />
            );
          })}
        </>
      )}
    </>
  );
};
