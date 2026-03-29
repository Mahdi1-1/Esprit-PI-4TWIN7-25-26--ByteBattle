import React from 'react';
import { motion } from 'framer-motion';
import { ThemeComponentProps } from '../../EndGameScreen.types';
import { SportsEffects } from './SportsEffects';
import { StaggerReveal } from '../../shared/StaggerReveal';
import { MotivationalQuote } from '../../shared/MotivationalQuote';
import { ThemeConfigs } from '../../../../constants/themes';
import { GameTheme, GameResult } from '../../../../types/game.types';

const SportsDefeat: React.FC<ThemeComponentProps> = ({ data, onRetry, onBackToMenu }) => {
  const theme = ThemeConfigs[GameTheme.SPORTS_ARENA];
  const config = theme.defeat;

  return (
    <div className="w-full h-full text-white relative flex flex-col items-center justify-center p-8 overflow-hidden font-barlow">
      <SportsEffects variant="defeat" />

      {/* Dark red ambient spotlights */}
      <motion.div
        className="absolute top-0 left-1/3 w-[600px] h-[400px] z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(185,28,28,0.08) 0%, transparent 60%)',
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-[500px] h-[300px] z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at bottom, rgba(75,85,99,0.08) 0%, transparent 60%)',
        }}
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <StaggerReveal direction="down" staggerDelay={0.4}>
        {/* Defeated emoji with dramatic entrance */}
        <motion.div
          className="relative mb-6 z-20 mx-auto text-center"
          initial={{ y: -80, opacity: 0, scale: 1.5 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 60, delay: 0.2 }}
        >
          {/* Red warning pulse behind */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(185,28,28,0.15) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="text-[clamp(5rem,12vw,8rem)] relative z-10 grayscale-[70%] opacity-80"
            style={{ filter: 'grayscale(70%) drop-shadow(0 10px 25px rgba(185,28,28,0.3))' }}
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {config.emoji}
          </motion.div>
        </motion.div>

        {/* Title - DEFEAT with impact */}
        <div className="text-center z-20 relative mb-10">
          <motion.div
            className="relative inline-block"
            initial={{ scale: 2.5, opacity: 0, filter: 'blur(15px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.4 }}
          >
            {/* Shadow text */}
            <h1
              className="text-[clamp(3rem,12vw,7rem)] italic font-black font-teko tracking-widest uppercase -skew-x-12 leading-none"
              style={{
                color: 'transparent',
                WebkitTextStroke: '2px rgba(185,28,28,0.2)',
                position: 'absolute',
                top: '5px',
                left: '5px',
                filter: 'blur(3px)',
              }}
            >
              {config.title}
            </h1>

            {/* Main title */}
            <h1
              className="text-[clamp(3rem,12vw,7rem)] italic font-black font-teko tracking-widest uppercase -skew-x-12 leading-none relative"
              style={{
                color: '#B91C1C',
                textShadow: '4px 4px 0 #000, 0 0 40px rgba(185,28,28,0.3)',
              }}
            >
              {config.title}
            </h1>
          </motion.div>

          <motion.p
            className="text-gray-500 text-lg md:text-xl font-bold tracking-wide mt-3 font-barlow"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            {config.subtitle}
          </motion.p>
        </div>

        {/* Scoreboard Jumbotron - Defeat style */}
        <motion.div
          className="max-w-2xl w-full mx-auto z-20 relative"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
        >
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              boxShadow:
                '0 25px 60px rgba(0,0,0,0.7), 0 0 30px rgba(185,28,28,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Top bar - muted league branding */}
            <div
              className="flex items-center justify-between px-6 py-2"
              style={{
                background: 'linear-gradient(90deg, #1a1a1a, #2a1010, #1a1a1a)',
              }}
            >
              <span className="text-xs font-bold tracking-[0.3em] text-gray-600 uppercase">
                ByteBattle League
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest text-red-700 uppercase">
                  Game Over
                </span>
              </div>
              <span className="text-xs font-bold tracking-[0.3em] text-gray-600 uppercase">
                Season 2025
              </span>
            </div>

            {/* Scoreboard body */}
            <div
              className="flex"
              style={{
                background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 50%, #050505 100%)',
              }}
            >
              {/* Home team (loser) */}
              <div className="flex-1 flex flex-col items-center justify-center py-8 px-6 relative opacity-60">
                {/* Team badge - dimmed */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-gray-400 font-black text-sm">YOU</span>
                </div>

                <div className="text-gray-600 font-bold uppercase tracking-[0.2em] text-xs mb-3">
                  Home
                </div>

                <div
                  className="text-[clamp(3rem,10vw,5.5rem)] font-mono font-black leading-none text-gray-600"
                  style={{
                    textShadow: '0 0 10px rgba(75,85,99,0.2)',
                  }}
                >
                  {data.player.score}
                </div>
              </div>

              {/* Center divider */}
              <div
                className="flex flex-col justify-center items-center px-5 shrink-0 relative"
                style={{
                  background:
                    'linear-gradient(180deg, transparent, rgba(255,255,255,0.02), transparent)',
                }}
              >
                <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-gray-800/50 to-transparent" />
                <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-gray-800/50 to-transparent" />

                {/* VS badge */}
                <div className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
                  <span className="text-gray-600 font-black text-xs italic">VS</span>
                </div>

                <motion.div
                  className="text-red-800 font-mono text-xl font-bold tracking-widest"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  FINAL
                </motion.div>
              </div>

              {/* Away team (winner) */}
              <div className="flex-1 flex flex-col items-center justify-center py-8 px-6 relative">
                {/* Winner indicator */}
                <motion.div
                  className="absolute top-3 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2 }}
                >
                  <div className="flex items-center gap-1.5 bg-red-900/30 border border-red-700/40 rounded-full px-3 py-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400 text-[10px] font-bold tracking-widest uppercase">
                      Winner
                    </span>
                  </div>
                </motion.div>

                {/* Team badge */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mb-3 shadow-lg shadow-red-500/20">
                  <span className="text-white font-black text-sm">OPP</span>
                </div>

                <div className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs mb-3">
                  Away
                </div>

                <div
                  className="text-[clamp(3rem,10vw,5.5rem)] font-mono font-black leading-none"
                  style={{
                    color: '#DC2626',
                    textShadow: '0 0 30px rgba(220,38,38,0.5), 0 0 60px rgba(220,38,38,0.2)',
                  }}
                >
                  {data.opponent?.score ?? 0}
                </div>
              </div>
            </div>

            {/* Bottom ticker - defeat themed */}
            <div
              className="overflow-hidden py-1.5 relative"
              style={{
                background: 'linear-gradient(90deg, #050505, #0f0505, #050505)',
                borderTop: '1px solid rgba(185,28,28,0.1)',
              }}
            >
              <motion.div
                className="flex items-center gap-8 whitespace-nowrap text-xs font-bold tracking-wider"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <span className="text-red-700">FINAL SCORE</span>
                    <span className="text-gray-700">•</span>
                    <span className="text-gray-500">HOME {data.player.score}</span>
                    <span className="text-gray-700">-</span>
                    <span className="text-red-600">AWAY {data.opponent?.score ?? 0}</span>
                    <span className="text-gray-700">•</span>
                    <span className="text-gray-500">BETTER LUCK NEXT TIME</span>
                    <span className="text-gray-700">•</span>
                    <span className="text-gray-600">
                      MATCH DURATION: {(data.player.timeElapsed / 60).toFixed(0)} MIN
                    </span>
                    <span className="text-gray-700">•</span>
                  </React.Fragment>
                ))}
              </motion.div>
            </div>
          </div>

          {/* LED dots - muted red */}
          <div className="flex justify-center gap-1 mt-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={`led-${i}`}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: i < 8 ? '#991B1B' : '#1a1a1a' }}
                animate={{
                  opacity: i < 8 ? [0.3, 0.7, 0.3] : 0.15,
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Buttons */}
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
                background: 'linear-gradient(135deg, #1E3A5F, #1e40af)',
                boxShadow: '0 6px 0 #0f1d30, 0 10px 20px rgba(30,58,95,0.3)',
              }}
            />
            <div className="absolute inset-0 rounded-lg -skew-x-12 bg-gradient-to-t from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -inset-1 rounded-lg -skew-x-12 border-2 border-[#FBBF24]/30 group-hover:border-[#FBBF24]/80 transition-colors duration-300" />
            <span className="relative z-10 block px-10 py-4 font-teko text-xl font-black italic tracking-[0.15em] text-white -skew-x-12 flex items-center gap-2">
              <span>🔄</span>
              <span>REMATCH</span>
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
                background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                boxShadow: '0 6px 0 #0a0a0a, 0 10px 15px rgba(0,0,0,0.3)',
                border: '1px solid rgba(75,85,99,0.3)',
              }}
            />
            <div className="absolute inset-0 rounded-lg -skew-x-12 bg-gradient-to-t from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 block px-10 py-4 font-teko text-xl font-black italic tracking-[0.15em] text-gray-500 group-hover:text-gray-300 -skew-x-12 transition-colors duration-300 flex items-center gap-2">
              <span>🏠</span>
              <span>MAIN MENU</span>
            </span>
          </motion.button>
        </div>

        {/* Motivational quote - bordered frame */}
        <motion.div
          className="mt-10 z-20 relative max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.8 }}
        >
          <div
            className="relative px-8 py-4 text-center rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(185,28,28,0.08), rgba(30,20,20,0.5))',
              border: '1px solid rgba(185,28,28,0.2)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-800/40 rounded-tl" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-800/40 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-800/40 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-800/40 rounded-br" />

            <MotivationalQuote theme={GameTheme.SPORTS_ARENA} result={GameResult.DEFEAT} />
          </div>
        </motion.div>
      </StaggerReveal>
    </div>
  );
};

export default SportsDefeat;