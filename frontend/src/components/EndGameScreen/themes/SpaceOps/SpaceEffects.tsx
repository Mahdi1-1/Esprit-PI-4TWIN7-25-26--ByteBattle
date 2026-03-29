import React from 'react';
import { motion } from 'framer-motion';

export const SpaceEffects: React.FC<{ variant: 'victory' | 'defeat' }> = ({ variant }) => {
  return (
    <>
      {/* Base background */}
      <div className={`absolute inset-0 z-0 ${variant === 'victory' ? 'bg-[#070A1A]' : 'bg-[#050510]'}`} />

      {/* Stars */}
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className={`absolute rounded-full bg-white ${variant === 'victory' ? '' : variant === 'defeat' ? 'opacity-20' : ''}`}
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 5 + 's',
            animation: `twinkle ${3 + Math.random() * 2}s ease-in-out infinite`,
            opacity: variant === 'defeat' ? 0.2 : undefined,
          }}
        />
      ))}

      {/* Nebula glow */}
      <div
        className="absolute inset-0 pointer-events-none z-[1] animate-pulse"
        style={{
          background: variant === 'victory'
            ? 'radial-gradient(ellipse at 50% 50%, rgba(29,78,216,0.1), transparent 50%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(213,0,0,0.08), transparent 50%)',
          animationDuration: '20s',
        }}
      />

      {/* HUD rotating circles (victory) */}
      {variant === 'victory' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[3]">
          {[300, 400, 500].map((size, i) => (
            <motion.div
              key={i}
              className="absolute border-2 border-[#22D3EE]/20 rounded-full"
              style={{
                width: size,
                height: size,
                top: -size / 2,
                left: -size / 2,
              }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 15 + i * 5, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </div>
      )}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[13]"
        style={{
          boxShadow: variant === 'victory'
            ? 'inset 0 0 150px rgba(0,0,0,0.6)'
            : 'inset 0 0 200px rgba(0,0,0,0.8)',
        }}
      />

      {variant === 'victory' && (
        <div className="absolute inset-0 bg-gradient-radial from-[#22D3EE]/10 to-transparent z-[1] opacity-50" />
      )}

      {variant === 'defeat' && (
        <>
          <div className="absolute inset-0 bg-gradient-radial from-[#D50000]/10 to-transparent z-[1] opacity-50 mix-blend-multiply" />
          {/* Red pulse border */}
          <div
            className="absolute inset-0 border-[10px] border-[#D50000]/20 pointer-events-none z-[10] animate-pulse"
            style={{ animationDuration: '0.8s' }}
          />
          {/* Space debris floating */}
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={`debris-${i}`}
              className="absolute bg-[#455A64] pointer-events-none z-[5]"
              style={{
                width: Math.random() * 30 + 15,
                height: Math.random() * 10 + 5,
                top: `${15 + Math.random() * 70}%`,
              }}
              animate={{ x: [-100, typeof window !== 'undefined' ? window.innerWidth + 100 : 1000], rotate: [0, 360] }}
              transition={{
                duration: 8 + Math.random() * 6,
                repeat: Infinity,
                ease: 'linear',
                delay: Math.random() * 5,
              }}
            />
          ))}
        </>
      )}
    </>
  );
};
