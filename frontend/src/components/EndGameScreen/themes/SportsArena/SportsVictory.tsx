import React from 'react';
import { motion } from 'framer-motion';
import { ThemeComponentProps } from '../../EndGameScreen.types';
import { SportsEffects } from './SportsEffects';
import { ConfettiSystem } from '../../shared/ConfettiSystem';
import { StaggerReveal } from '../../shared/StaggerReveal';
import { CountUpNumber } from '../../shared/CountUpNumber';
import { MotivationalQuote } from '../../shared/MotivationalQuote';
import { ThemeConfigs } from '../../../../constants/themes';
import { GameTheme, GameResult } from '../../../../types/game.types';

const SportsVictory: React.FC<ThemeComponentProps> = ({ data, onRetry, onBackToMenu }) => {
  const theme = ThemeConfigs[GameTheme.SPORTS_ARENA];
  const config = theme.victory;

  return (
    <div className="w-full h-full text-white relative flex flex-col items-center justify-center p-8 overflow-hidden font-barlow">
      <SportsEffects variant="victory" />
      <ConfettiSystem active={true} colors={config.particleColors} />

      {/* Spotlight effects */}
      <motion.div
        className="absolute top-0 left-1/4 w-[500px] h-[500px] z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(37,99,235,0.12) 0%, transparent 60%)',
        }}
        animate={{ opacity: [0.5, 1, 0.5], x: [-20, 20, -20] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-0 right-1/4 w-[500px] h-[500px] z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(251,191,36,0.1) 0%, transparent 60%)',
        }}
        animate={{ opacity: [0.5, 1, 0.5], x: [20, -20, 20] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <StaggerReveal direction="up" staggerDelay={0.3}>
        {/* Trophy entrance with burst */}
        <motion.div
          className="relative mb-6 z-20 mx-auto text-center"
          initial={{ scale: 0, y: -100, rotate: -30 }}
          animate={{ scale: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', damping: 8, stiffness: 80, delay: 0.2 }}
        >
          {/* Trophy glow ring */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Burst rays behind trophy */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={`ray-${i}`}
              className="absolute top-1/2 left-1/2 origin-bottom-left h-1 bg-gradient-to-r from-yellow-400/30 to-transparent pointer-events-none"
              style={{
                width: '100px',
                transform: `rotate(${i * 30}deg)`,
                transformOrigin: '0% 50%',
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: [0, 1, 0.6], opacity: [0, 0.6, 0.2] }}
              transition={{ delay: 0.8 + i * 0.05, duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
            />
          ))}

          <motion.div
            className="text-[clamp(5rem,15vw,9rem)] relative z-10"
            style={{ filter: 'drop-shadow(0 10px 30px rgba(251,191,36,0.6))' }}
            animate={{ rotate: [-8, 8, -8], y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {config.emoji}
          </motion.div>
        </motion.div>

        {/* GOAL! title - massive sports impact */}
        <div className="text-center z-20 relative mb-10">
          <motion.div
            className="relative inline-block"
            initial={{ scale: 3, opacity: 0, filter: 'blur(20px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
          >
            {/* Shadow text for depth */}
            <h1
              className="text-[clamp(3.5rem,15vw,8rem)] italic font-black font-teko tracking-wider uppercase -skew-x-12 leading-none"
              style={{
                WebkitTextStroke: '2px rgba(37,99,235,0.3)',
                color: 'transparent',
                position: 'absolute',
                top: '4px',
                left: '4px',
                filter: 'blur(2px)',
              }}
            >
              {config.title}
            </h1>

            {/* Main title */}
            <motion.h1
              className="text-[clamp(3.5rem,15vw,8rem)] italic font-black font-teko tracking-wider uppercase -skew-x-12 bg-clip-text text-transparent leading-none relative"
              style={{
                backgroundImage: 'linear-gradient(135deg, #3B82F6, #60A5FA, #FBBF24, #F59E0B)',
                backgroundSize: '200% 200%',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                scale: [1, 1.03, 1],
              }}
              transition={{
                backgroundPosition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              {config.title}
            </motion.h1>
          </motion.div>

          {/* Subtitle with ticker tape effect */}
          <motion.div
            className="mt-3 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <p className="text-[#FBBF24] text-2xl md:text-3xl font-bold italic tracking-wide font-barlow relative">
              <motion.span
                className="absolute -left-2 -right-2 top-0 bottom-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, delay: 1.5, repeat: Infinity, repeatDelay: 5 }}
              />
              {config.subtitle}
            </p>
          </motion.div>
        </div>

        {/* Scoreboard Jumbotron - Enhanced ESPN style */}
        <motion.div
          className="max-w-2xl w-full mx-auto z-20 relative"
          initial={{ opacity: 0, y: 40, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
        >
          {/* Jumbotron frame */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              boxShadow:
                '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(37,99,235,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {/* Top bar - league branding */}
            <div
              className="flex items-center justify-between px-6 py-2"
              style={{
                background: 'linear-gradient(90deg, #1e3a8a, #2563EB, #1e3a8a)',
              }}
            >
              <span className="text-xs font-bold tracking-[0.3em] text-blue-200/80 uppercase">
                ByteBattle League
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold tracking-widest text-red-400 uppercase">
                  Final
                </span>
              </div>
              <span className="text-xs font-bold tracking-[0.3em] text-blue-200/80 uppercase">
                Season 2025
              </span>
            </div>

            {/* Scoreboard body */}
            <div
              className="flex"
              style={{
                background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)',
              }}
            >
              {/* Home team */}
              <div className="flex-1 flex flex-col items-center justify-center py-8 px-6 relative">
                {/* Winner indicator */}
                <motion.div
                  className="absolute top-3 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.5 }}
                >
                  <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/40 rounded-full px-3 py-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-[10px] font-bold tracking-widest uppercase">
                      Winner
                    </span>
                  </div>
                </motion.div>

                {/* Team badge */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
                  <span className="text-white font-black text-sm">YOU</span>
                </div>

                <div className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs mb-3">
                  Home
                </div>

                <div
                  className="text-[clamp(3.5rem,10vw,6rem)] font-mono font-black leading-none"
                  style={{
                    color: '#FBBF24',
                    textShadow: '0 0 30px rgba(251,191,36,0.8), 0 0 60px rgba(251,191,36,0.3)',
                  }}
                >
                  <CountUpNumber from={0} to={data.player.score} duration={1500} />
                </div>
              </div>

              {/* Center divider with match info */}
              <div
                className="flex flex-col justify-center items-center px-5 shrink-0 relative"
                style={{
                  background:
                    'linear-gradient(180deg, transparent, rgba(255,255,255,0.03), transparent)',
                }}
              >
                {/* Vertical lines */}
                <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-gray-700/50 to-transparent" />
                <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-gray-700/50 to-transparent" />

                {/* VS badge */}
                <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-4">
                  <span className="text-gray-400 font-black text-xs italic">VS</span>
                </div>

                <div className="text-gray-600 font-bold text-[10px] uppercase tracking-widest mb-1">
                  QTR
                </div>
                <div className="text-red-500 font-mono text-xl font-bold mb-4">4</div>

                <div className="text-gray-600 font-bold text-[10px] uppercase tracking-widest mb-1">
                  Time
                </div>
                <motion.div
                  className="text-red-500 font-mono text-xl font-bold"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  0:00
                </motion.div>
              </div>

              {/* Away team */}
              <div className="flex-1 flex flex-col items-center justify-center py-8 px-6 opacity-50">
                {/* Team badge */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mb-3 shadow-lg shadow-red-500/10">
                  <span className="text-white font-black text-sm">OPP</span>
                </div>

                <div className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs mb-3">
                  Away
                </div>

                <div
                  className="text-[clamp(3.5rem,10vw,6rem)] font-mono font-black leading-none text-red-500"
                  style={{
                    textShadow: '0 0 20px rgba(239,68,68,0.3)',
                  }}
                >
                  {data.opponent?.score ?? 0}
                </div>
              </div>
            </div>

            {/* Bottom ticker */}
            <div
              className="overflow-hidden py-1.5 relative"
              style={{
                background: 'linear-gradient(90deg, #0a0a0a, #1a1a1a, #0a0a0a)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <motion.div
                className="flex items-center gap-8 whitespace-nowrap text-xs font-bold tracking-wider"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <span className="text-yellow-500">⚡ FINAL SCORE</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-blue-400">HOME {data.player.score}</span>
                    <span className="text-gray-600">-</span>
                    <span className="text-red-400">AWAY {data.opponent?.score ?? 0}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-green-400">🏆 VICTORY CONFIRMED</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">
                      MATCH DURATION: {(data.player.timeElapsed / 60).toFixed(0)} MIN
                    </span>
                    <span className="text-gray-500">•</span>
                  </React.Fragment>
                ))}
              </motion.div>
            </div>
          </div>

          {/* LED dots under scoreboard */}
          <div className="flex justify-center gap-1 mt-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={`led-${i}`}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: i < 12 ? '#3B82F6' : '#1e3a8a' }}
                animate={{
                  opacity: i < 12 ? [0.4, 1, 0.4] : 0.2,
                  scale: i < 12 ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.08,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Action buttons */}
        <div className="flex gap-5 justify-center mt-12 z-20 relative">
          <motion.button
            onClick={onRetry}
            className="relative group"
            whileHover={{ scale: 1.07, y: -2 }}
            whileTap={{ scale: 0.95, y: 2 }}
          >
            <div
              className="absolute inset-0 rounded-lg -skew-x-12"
              style={{
                background: 'linear-gradient(135deg, #1e40af, #2563EB)',
                boxShadow: '0 6px 0 #1e3a8a, 0 10px 20px rgba(37,99,235,0.3)',
              }}
            />
            <div className="absolute inset-0 rounded-lg -skew-x-12 bg-gradient-to-t from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -inset-1 rounded-lg -skew-x-12 border-2 border-[#FBBF24]/50 group-hover:border-[#FBBF24] transition-colors duration-300" />
            <span className="relative z-10 block px-10 py-4 font-teko text-xl font-black italic tracking-wider text-white -skew-x-12 flex items-center gap-2">
              <span>⚽</span>
              <span>REMATCH!</span>
            </span>
          </motion.button>

          <motion.button
            onClick={onBackToMenu}
            className="relative group"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95, y: 2 }}
          >
            <div
              className="absolute inset-0 rounded-lg -skew-x-12"
              style={{
                background: 'linear-gradient(135deg, #e5e7eb, #f3f4f6)',
                boxShadow: '0 6px 0 #9ca3af, 0 10px 15px rgba(0,0,0,0.2)',
              }}
            />
            <div className="absolute inset-0 rounded-lg -skew-x-12 bg-gradient-to-t from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 block px-10 py-4 font-teko text-xl font-black italic tracking-wider text-gray-800 -skew-x-12 flex items-center gap-2 group-hover:text-blue-700 transition-colors duration-300">
              <span>🏟️</span>
              <span>LOCKER ROOM</span>
            </span>
          </motion.button>
        </div>

        <MotivationalQuote theme={GameTheme.SPORTS_ARENA} result={GameResult.VICTORY} />
      </StaggerReveal>
    </div>
  );
};

export default SportsVictory;