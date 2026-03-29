import React from 'react';
import { motion } from 'framer-motion';

export const SportsEffects: React.FC<{ variant: 'victory' | 'defeat' }> = ({ variant }) => {
  return (
    <>
      {/* Base background */}
      <div className={`absolute inset-0 z-0 ${variant === 'victory' ? 'bg-[#111827]' : 'bg-[#0C0F17]'}`} />

      {/* Sports grid pattern */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px), linear-gradient(0deg, rgba(37,99,235,0.05) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Stadium Lights (top) */}
      <div className="absolute top-0 left-0 w-full h-32 flex justify-around opacity-40 z-[5] pointer-events-none">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="relative w-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full blur-[2px]" />
            <div
              className={`absolute top-2 left-1/2 -translate-x-1/2 w-32 h-96 bg-gradient-to-b from-white/30 to-transparent ${variant === 'defeat' ? 'opacity-30 mix-blend-overlay' : 'mix-blend-screen'}`}
              style={{ clipPath: 'polygon(45% 0, 55% 0, 100% 100%, 0% 100%)' }}
            />
          </div>
        ))}
      </div>

      {/* Crowd wave at bottom */}
      {variant === 'victory' && (
        <div className="absolute bottom-0 left-0 w-full h-[100px] flex items-end justify-around z-[10] pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-[30px] rounded-t-lg"
              style={{
                background: 'linear-gradient(to top, #2563EB, #FBBF24)',
              }}
              animate={{ height: [40, 80, 40] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Defeat: crowd silhouettes (static, muted) */}
      {variant === 'defeat' && (
        <div
          className="absolute bottom-0 left-0 w-full h-[150px] pointer-events-none z-[10]"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute bottom-[20px] w-[30px] bg-[#1a1a1a] rounded-t-lg"
              style={{
                left: `${i * 5}%`,
                height: `${40 + Math.random() * 30}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Defeat: rain drops */}
      {variant === 'defeat' && Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`rain-${i}`}
          className="absolute w-[2px] pointer-events-none z-[8]"
          style={{
            height: Math.random() * 30 + 20,
            background: 'linear-gradient(transparent, rgba(255,255,255,0.2))',
            left: `${Math.random() * 100}%`,
          }}
          animate={{ y: [-50, typeof window !== 'undefined' ? window.innerHeight : 800] }}
          transition={{
            duration: 0.5 + Math.random(),
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'linear',
          }}
        />
      ))}

      {/* Spotlight sweep */}
      {variant === 'victory' && (
        <motion.div
          className="absolute top-0 w-[200px] h-full pointer-events-none z-[4]"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)',
          }}
          animate={{ left: ['10%', '60%', '10%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {variant === 'victory' && (
        <div className="absolute inset-0 z-[1]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, rgba(37,99,235,0.1) 0px, rgba(37,99,235,0.1) 20px, transparent 20px, transparent 40px)`
        }} />
      )}

      {variant === 'defeat' && (
        <div className="absolute inset-0 z-[6] bg-black/60 mix-blend-multiply" />
      )}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[13]"
        style={{
          boxShadow: variant === 'victory'
            ? 'inset 0 0 120px rgba(0,0,0,0.5)'
            : 'inset 0 0 200px rgba(0,0,0,0.7)',
        }}
      />
    </>
  );
};
