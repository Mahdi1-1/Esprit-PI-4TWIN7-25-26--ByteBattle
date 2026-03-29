import React from 'react';
import { motion } from 'framer-motion';

export const CyberEffects: React.FC = () => {
  return (
    <>
      {/* Base background */}
      <div className="absolute inset-0 bg-[#0B1020] z-0" />

      {/* Cyber grid background */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px), linear-gradient(0deg, rgba(0,229,255,0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'gridScroll 20s linear infinite',
        }}
      />

      {/* Scan line */}
      <motion.div
        className="absolute left-0 w-full h-1 z-[12] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, #00E5FF, transparent)',
          boxShadow: '0 0 20px #00E5FF',
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[13]"
        style={{ boxShadow: 'inset 0 0 150px rgba(0,0,0,0.6)' }}
      />

      {/* Light leak */}
      <div
        className="absolute inset-0 pointer-events-none z-[11] animate-pulse opacity-50"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, rgba(0,229,255,0.08), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.08), transparent 50%)',
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1020] to-transparent opacity-50 z-[2]" />
    </>
  );
};

export const CyberEffectsRed: React.FC = () => {
  return (
    <>
      {/* Base dark background */}
      <div className="absolute inset-0 bg-[#0A0A12] z-0" />

      {/* Red-tinted grid background with shake */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,23,68,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,23,68,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'gridShake 0.5s infinite',
        }}
      />

      {/* Scan line (red) */}
      <motion.div
        className="absolute left-0 w-full h-[2px] z-[12] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, #FF1744, transparent)',
          boxShadow: '0 0 20px #FF1744',
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Dark vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[13]"
        style={{ boxShadow: 'inset 0 0 150px rgba(0,0,0,0.8)' }}
      />

      {/* Red flash overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[11] animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(255,0,0,0.15), transparent)',
          animationDuration: '2s',
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[10] opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A12] to-transparent opacity-70 z-[2]" />

      {/* Data streams (falling code) */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-[#FF1744] text-xs font-orbitron opacity-40 z-[8] pointer-events-none"
          style={{
            left: `${10 + i * 15}%`,
            writingMode: 'vertical-rl',
          }}
          animate={{ y: ['-100%', '100vh'] }}
          transition={{
            duration: 5 + Math.random() * 4,
            repeat: Infinity,
            ease: 'linear',
            delay: Math.random() * 3,
          }}
        >
          {'01アイウエオカキ'.split('').sort(() => Math.random() - 0.5).join('')}
        </motion.div>
      ))}

      {/* Pulsing red border */}
      <div className="absolute inset-0 border-4 border-[#FF1744]/20 animate-pulse pointer-events-none z-[14]" />
    </>
  );
};
