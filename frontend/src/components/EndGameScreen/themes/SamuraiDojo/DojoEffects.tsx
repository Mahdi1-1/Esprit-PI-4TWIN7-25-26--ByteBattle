import React from 'react';
import { motion } from 'framer-motion';

export const DojoEffects: React.FC<{ variant: 'victory' | 'defeat' }> = ({ variant }) => {
  return (
    <>
      {/* Background base */}
      <div className={`absolute inset-0 z-0 ${variant === 'victory' ? 'bg-[#0B0B0D]' : 'bg-[#070709]'}`} />
      
      {/* Rice paper texture */}
      <div className="absolute inset-0 opacity-10 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/rice-paper.png')] z-[5]" />

      {/* Cherry petals falling */}
      {Array.from({ length: variant === 'victory' ? 25 : 15 }).map((_, i) => (
        <motion.div
          key={i}
          className={`absolute z-[10] pointer-events-none text-lg ${variant === 'defeat' ? 'grayscale opacity-40' : 'opacity-70'}`}
          style={{
            left: `${Math.random() * 100}%`,
            top: -30,
            fontSize: `${Math.random() * 10 + 14}px`,
          }}
          animate={{
            y: [0, typeof window !== 'undefined' ? window.innerHeight + 50 : 800],
            rotate: [0, 360],
            x: [0, (Math.random() - 0.5) * 100],
          }}
          transition={{
            duration: 5 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 6,
            ease: 'linear',
          }}
        >
          🌸
        </motion.div>
      ))}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[13]"
        style={{
          boxShadow: variant === 'victory'
            ? 'inset 0 0 150px rgba(0,0,0,0.5)'
            : 'inset 0 0 200px rgba(0,0,0,0.7)',
        }}
      />

      {variant === 'victory' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-[#D4AF37]/10 to-transparent z-0 opacity-40 mix-blend-screen" />
      )}
      
      {variant === 'defeat' && (
        <>
          {/* Dim red moon glow */}
          <div className="absolute top-0 right-10 w-40 h-40 rounded-full bg-[#8B0000]/30 blur-[40px] animate-pulse z-0" />
          {/* Faded sakura petals (styled shapes instead of emoji) */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`petal-${i}`}
              className="absolute bg-gray-600 z-[10] pointer-events-none"
              style={{
                width: Math.random() * 8 + 4 + 'px',
                height: Math.random() * 4 + 4 + 'px',
                borderRadius: '50% 0 50% 0',
                top: -20,
                left: Math.random() * 100 + '%',
                animation: `fallSlow ${Math.random() * 2 + 3}s linear infinite`,
                animationDelay: Math.random() * 5 + 's',
                opacity: 0.25,
                filter: 'grayscale(0.5)',
              }}
            />
          ))}
        </>
      )}
    </>
  );
};
