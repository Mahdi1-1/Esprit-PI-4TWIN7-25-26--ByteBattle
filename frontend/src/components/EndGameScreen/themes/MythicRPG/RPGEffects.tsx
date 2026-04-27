import React from 'react';
import { motion } from 'framer-motion';

export const RPGEffects: React.FC<{ variant: 'victory' | 'defeat' }> = ({ variant }) => {
  return (
    <>
      {/* Parchment texture */}
      <div className="absolute inset-0 z-[5] mix-blend-multiply opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]" />

      {/* Base background */}
      <div className={`absolute inset-0 z-0 ${variant === 'victory' ? 'bg-[#0F172A]' : 'bg-[#0A0F1F]'}`}>
        {variant === 'victory' && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-700/40 via-transparent to-transparent z-0 opacity-60" />
        )}
        {variant === 'defeat' && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent z-0 opacity-80" />
        )}
      </div>

      {/* Magic circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[3] pointer-events-none">
        <motion.div
          className="rounded-full"
          style={{
            width: 300,
            height: 300,
            border: `3px solid ${variant === 'victory' ? 'rgba(245,158,11,0.3)' : 'rgba(127,29,29,0.3)'}`,
          }}
          animate={{ rotate: variant === 'defeat' ? -360 : 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        >
          <div
            className="absolute inset-[30px] rounded-full"
            style={{ border: `2px solid ${variant === 'victory' ? 'rgba(109,40,217,0.2)' : 'rgba(59,7,100,0.3)'}` }}
          />
          <div
            className="absolute inset-[60px] rounded-full"
            style={{ border: `1px solid ${variant === 'victory' ? 'rgba(245,158,11,0.15)' : 'rgba(127,29,29,0.2)'}` }}
          />
        </motion.div>
      </div>

      {/* Runes (victory) */}
      {variant === 'victory' && ['ᚠ', 'ᚦ', 'ᚱ', 'ᛉ'].map((rune, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl text-[#F59E0B] z-[5] pointer-events-none"
          style={{
            left: `${10 + i * 25}%`,
            top: `${20 + (i % 2) * 50}%`,
            textShadow: '0 0 20px rgba(109,40,217,0.5)',
          }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 1, ease: 'easeInOut' }}
        >
          {rune}
        </motion.div>
      ))}

      {/* Floating magic particles / embers */}
      {Array.from({ length: variant === 'victory' ? 40 : 30 }).map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full pointer-events-none ${variant === 'victory' ? 'bg-yellow-500 blur-[2px]' : 'bg-gray-800 blur-[1px]'}`}
          style={{
            width: Math.random() * 6 + 2 + 'px',
            height: Math.random() * 6 + 2 + 'px',
            left: Math.random() * 100 + '%',
            bottom: -20,
            opacity: Math.random() * 0.6 + 0.2,
          }}
          animate={{
            y: [0, -(typeof window !== 'undefined' ? window.innerHeight : 800) - 50],
            x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'linear',
          }}
        />
      ))}

      {/* Wisps for defeat */}
      {variant === 'defeat' && Array.from({ length: 10 }).map((_, i) => {
        const wispColors = ['#1E3A5F', '#3B0764', '#134E4A'];
        const color = wispColors[i % wispColors.length];
        return (
          <motion.div
            key={`wisp-${i}`}
            className="absolute w-[10px] h-[10px] rounded-full pointer-events-none z-[4]"
            style={{
              background: color,
              boxShadow: `0 0 15px ${color}`,
              left: `${Math.random() * 100}%`,
              bottom: 0,
            }}
            animate={{
              y: [50, -150],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'easeOut',
            }}
          />
        );
      })}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[13]"
        style={{
          boxShadow: variant === 'victory'
            ? 'inset 0 0 150px rgba(0,0,0,0.5)'
            : 'inset 0 0 200px rgba(0,0,0,0.7)',
        }}
      />
    </>
  );
};
