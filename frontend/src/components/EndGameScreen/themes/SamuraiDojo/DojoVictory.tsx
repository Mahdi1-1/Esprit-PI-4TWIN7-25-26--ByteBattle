import React from 'react';
import { motion } from 'framer-motion';
import { ThemeComponentProps } from '../../EndGameScreen.types';
import { DojoEffects } from './DojoEffects';
import { StaggerReveal } from '../../shared/StaggerReveal';
import { TypewriterText } from '../../shared/TypewriterText';
import { MotivationalQuote } from '../../shared/MotivationalQuote';
import { ThemeConfigs } from '../../../../constants/themes';
import { GameTheme, GameResult } from '../../../../types/game.types';

const DojoVictory: React.FC<ThemeComponentProps> = ({ data, onRetry, onBackToMenu }) => {
  const theme = ThemeConfigs[GameTheme.SAMURAI_DOJO];
  const config = theme.victory;

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center p-8"
      style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#D5D1C8' }}
    >
      <DojoEffects variant="victory" />

      {/* Decorative corner ornaments */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-dojo-gold/40 z-10" />
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-dojo-gold/40 z-10" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-dojo-gold/40 z-10" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-dojo-gold/40 z-10" />

      <StaggerReveal direction="up" staggerDelay={0.4}>
        {/* Victory Seal (Hanko) */}
        <motion.div 
          className="mb-12 z-20 relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: 'spring', 
            damping: 12, 
            stiffness: 100,
            duration: 1.2 
          }}
        >
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-dojo-gold/20 to-red-600/20 blur-xl scale-150 animate-pulse" />
            
            {/* Main seal */}
            <div className="relative w-40 h-40 rounded-full border-4 border-red-600 bg-gradient-to-br from-white via-dojo-ivory to-dojo-ivory shadow-[0_0_60px_rgba(220,38,38,0.4)]">
              {/* Inner decorative circles */}
              <div className="absolute inset-2 rounded-full border-2 border-red-600/30" />
              <div className="absolute inset-4 rounded-full border border-red-600/20" />
              
              {/* Kanji character */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-7xl font-noto-serif-jp font-bold text-red-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                  勝
                </span>
              </div>
              
              {/* Small decorative diamonds at cardinal points */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-dojo-gold" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-dojo-gold" />
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-3 rotate-45 bg-dojo-gold" />
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 rotate-45 bg-dojo-gold" />
            </div>

            {/* Trophy emoji with subtle animation */}
            <motion.div 
              className="absolute -bottom-6 -right-6 text-5xl"
              animate={{ 
                y: [0, -8, 0],
                rotate: [0, 5, 0, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {config.emoji}
            </motion.div>
          </div>
        </motion.div>

        {/* Title Section */}
        <div className="text-center z-20 relative mb-16 space-y-4">
          {/* Main title with brush stroke effect */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-dojo-gold/10 to-transparent blur-sm" />
            <h1 className={`text-4xl md:text-6xl ${theme.fonts.heading} text-dojo-ivory font-light tracking-[0.4em] uppercase relative`}>
              <TypewriterText text={config.subtitle} speed={80} cursor={false} />
            </h1>
          </div>
          
          {/* Subtitle with decorative lines */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-dojo-gold" />
            <p className="text-dojo-gold text-base tracking-[0.3em] uppercase font-light">
              道場 DOJO
            </p>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-dojo-gold" />
          </div>
          
          <p className="text-dojo-ivory/60 text-sm tracking-[0.25em] font-serif italic mt-2">
            形 完成 — Kata Completed
          </p>
        </div>

        {/* ── PANNEAU ENCADRÉ: Kata Results ── */}
        <motion.div
          className="relative max-w-xl w-full mx-auto z-[11]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {/* Animated top light line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden rounded-t">
            <motion.div
              className="h-full w-1/2"
              style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, #B8960C, transparent)' }}
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Header bar */}
          <div className="flex items-center gap-3 px-6 py-3"
            style={{ background: 'rgba(212,175,55,0.08)', borderBottom: '1px solid rgba(212,175,55,0.25)' }}>
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_6px_#D4AF37]" />
            <span className="text-xs tracking-[0.4em] uppercase text-[#D4AF37] font-semibold">形 MASTERED</span>
            <div className="flex-1" />
            <div className="relative border border-red-600 bg-black/40 px-3 py-0.5 text-xs tracking-[0.25em] text-red-400">
              <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#D4AF37]" />
              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#D4AF37]" />
              黒帯 BLACK BELT
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-7"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', border: '1px solid rgba(212,175,55,0.2)', borderTop: 'none' }}>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="space-y-1">
                <div className="text-xs tracking-[0.2em] uppercase" style={{ color: 'rgba(213,209,200,0.5)' }}>Score</div>
                <div className="text-3xl font-light" style={{ fontFamily: "'Noto Serif JP', serif", color: '#D5D1C8' }}>
                  {data.player.score}
                </div>
                <div className="w-10 h-px mx-auto" style={{ background: 'rgba(212,175,55,0.3)' }} />
              </div>
              <div className="space-y-1">
                <div className="text-xs tracking-[0.2em] uppercase" style={{ color: 'rgba(213,209,200,0.5)' }}>Time</div>
                <div className="text-3xl font-light" style={{ fontFamily: "'Noto Serif JP', serif", color: '#D5D1C8' }}>
                  {(data.player.timeElapsed / 60).toFixed(1)}<span className="text-sm opacity-60">m</span>
                </div>
                <div className="w-10 h-px mx-auto" style={{ background: 'rgba(212,175,55,0.3)' }} />
              </div>
              <div className="space-y-1">
                <div className="text-xs tracking-[0.2em] uppercase" style={{ color: 'rgba(213,209,200,0.5)' }}>精度</div>
                <div className="text-3xl font-light" style={{ fontFamily: "'Noto Serif JP', serif", color: '#D5D1C8' }}>
                  {data.player.accuracy ?? 0}%
                </div>
                <div className="w-10 h-px mx-auto" style={{ background: 'rgba(212,175,55,0.3)' }} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-2 text-xs tracking-[0.2em]"
            style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderTop: 'none', color: 'rgba(212,175,55,0.6)' }}>
            <span>⏱ {data.player.timeElapsed}s</span>
            <span>RANK #{data.player.rank ?? 1}</span>
            <span style={{ color: 'rgba(213,209,200,0.4)' }}>武道 BUDO</span>
          </div>
        </motion.div>

        {/* ── 3D ACTION BUTTONS ── */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12 z-[11] relative">
          <motion.button
            onClick={onRetry}
            className="group relative px-12 py-4 overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #D4AF37 0%, #B8960C 100%)',
              boxShadow: '0 6px 0 #5a3a00',
              border: '1px solid #E8C84A',
              letterSpacing: '0.25em',
              color: '#1a0f00',
              fontWeight: 700,
            }}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ y: 2 }}
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-900/50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-900/50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-900/50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-900/50" />
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-all duration-300" />
            <span className="relative flex items-center gap-3">
              <span className="text-xl">🏆</span>
              <span>HONNEUR!</span>
            </span>
          </motion.button>

          <motion.button
            onClick={onBackToMenu}
            className="group relative px-12 py-4 overflow-hidden"
            style={{
              background: 'transparent',
              border: '1px solid rgba(212,175,55,0.35)',
              letterSpacing: '0.25em',
              color: 'rgba(213,209,200,0.6)',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-px transition-all duration-500"
              style={{ background: 'rgba(213,209,200,0.3)' }} />
            <span className="flex items-center gap-3">
              <span className="text-xl opacity-0 group-hover:opacity-100 transition-opacity">⛩️</span>
              <span>LEAVE DOJO</span>
            </span>
          </motion.button>
        </div>

        {/* Motivational Quote */}
        <div className="mt-16">
          <MotivationalQuote theme={GameTheme.SAMURAI_DOJO} result={GameResult.VICTORY} />
        </div>
      </StaggerReveal>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none z-[15]">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-dojo-gold/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default DojoVictory;