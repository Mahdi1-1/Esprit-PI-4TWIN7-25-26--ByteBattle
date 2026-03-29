import React from 'react';
import { motion } from 'framer-motion';
import { ThemeComponentProps } from '../../EndGameScreen.types';
import { SpaceEffects } from './SpaceEffects';
import { FireworkSystem } from '../../shared/FireworkSystem';
import { StaggerReveal } from '../../shared/StaggerReveal';
import { CountUpNumber } from '../../shared/CountUpNumber';
import { MotivationalQuote } from '../../shared/MotivationalQuote';
import { ThemeConfigs } from '../../../../constants/themes';
import { GameTheme, GameResult } from '../../../../types/game.types';

const SpaceVictory: React.FC<ThemeComponentProps> = ({ data, onRetry, onBackToMenu }) => {
  const theme = ThemeConfigs[GameTheme.SPACE_OPS];
  const config = theme.victory;

  return (
    <div
      className="w-full h-full text-white relative overflow-hidden flex flex-col items-center justify-center p-6"
      style={{ fontFamily: "'Chakra Petch', sans-serif" }}
    >
      <SpaceEffects variant="victory" />
      <FireworkSystem active={true} colors={config.particleColors} />

      {/* z-11 : Contenu */}
      <StaggerReveal direction="up" staggerDelay={0.25}>

        {/* Rocket — spring bounce depuis le ciel */}
        <motion.div
          className="relative mb-2 z-[11] mx-auto text-center"
          initial={{ scale: 0, y: -120, rotate: -20 }}
          animate={{ scale: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', damping: 8, stiffness: 80, delay: 0.1 }}
        >
          {/* Glow ring */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Thrust trail */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-5 h-20 bg-gradient-to-b from-orange-400/70 via-orange-300/30 to-transparent blur-md rounded-full" />
          <motion.div
            className="text-[clamp(4rem,14vw,7rem)] relative z-10"
            style={{ filter: 'drop-shadow(0 0 25px rgba(34,211,238,0.7))' }}
            animate={{ y: [0, -18, 0], rotate: [-8, 4, -8] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {config.emoji}
          </motion.div>
        </motion.div>

        {/* Titre — zoom explosif impact */}
        <div className="text-center z-[11] relative mb-6">
          <motion.h1
            className="text-[clamp(2.5rem,10vw,6rem)] font-black tracking-[0.15em] uppercase bg-clip-text text-transparent leading-none"
            style={{
              backgroundImage: 'linear-gradient(135deg, #22D3EE 0%, #60A5FA 40%, #E879F9 100%)',
              filter: 'drop-shadow(0 0 25px rgba(34,211,238,0.4))',
              fontFamily: "'Chakra Petch', sans-serif",
            }}
            initial={{ scale: 3, opacity: 0, filter: 'blur(20px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.4 }}
          >
            {config.title}
          </motion.h1>
          <motion.p
            className="text-[#22D3EE] text-[clamp(0.8rem,2.5vw,1.1rem)] mt-3 font-bold tracking-[0.3em] uppercase font-mono"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            {config.subtitle}
          </motion.p>
        </div>

        {/* Panneau encadré mission report */}
        <motion.div
          className="max-w-lg w-full mx-auto z-[11] relative"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(5,8,20,0.95) 0%, rgba(7,10,26,0.98) 100%)',
              border: '1px solid rgba(34,211,238,0.3)',
              boxShadow: '0 0 40px rgba(34,211,238,0.1), inset 0 1px 0 rgba(34,211,238,0.15)',
            }}
          >
            {/* Ligne lumineuse animée en haut */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)' }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-3"
              style={{
                background: 'linear-gradient(90deg, rgba(29,78,216,0.2), rgba(5,8,20,0.8), rgba(34,211,238,0.1))',
                borderBottom: '1px solid rgba(34,211,238,0.1)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-green-400"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span className="text-green-400 font-bold uppercase tracking-[0.25em] text-xs font-mono">
                  MISSION ACCOMPLISHED
                </span>
              </div>
              <span className="text-[#22D3EE]/50 text-[10px] font-mono tracking-widest">SYS_OK</span>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {/* Score central */}
              <div className="text-center mb-6">
                <div className="text-gray-500 text-[10px] tracking-[0.3em] font-mono mb-2 uppercase">
                  Commander Score
                </div>
                <div
                  className="text-[clamp(2.5rem,8vw,4.5rem)] font-black font-mono leading-none"
                  style={{ color: '#22D3EE', textShadow: '0 0 30px rgba(34,211,238,0.5)' }}
                >
                  <CountUpNumber from={0} to={data.player.score} duration={1500} />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Tests Passed', value: `${data.player.testsPassed}/${data.player.totalTests}`, color: '#4ADE80' },
                  { label: 'Accuracy', value: `${data.player.accuracy}%`, color: '#22D3EE' },
                  { label: 'Hostile Score', value: `${data.opponent?.score ?? 0}`, color: '#FF6F00' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="rounded-lg p-3 text-center"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + i * 0.15 }}
                  >
                    <div className="text-gray-600 text-[9px] tracking-widest uppercase font-mono mb-1">{stat.label}</div>
                    <div className="font-bold text-lg font-mono" style={{ color: stat.color }}>{stat.value}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-6 py-2"
              style={{
                background: 'rgba(5,8,20,0.8)',
                borderTop: '1px solid rgba(34,211,238,0.06)',
              }}
            >
              <span className="text-gray-700 text-[10px] font-mono tracking-wider">
                DURATION: {(data.player.timeElapsed / 60).toFixed(1)} MIN
              </span>
              <span className="text-[#22D3EE]/40 text-[10px] font-mono">RANK: {data.player.rank}</span>
            </div>
          </div>
        </motion.div>

        {/* Boutons 3D */}
        <div className="flex gap-4 justify-center mt-8 z-[11] relative">
          {/* Retry — accent positif */}
          <motion.button
            onClick={onRetry}
            className="relative group"
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.96, y: 2 }}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #1D4ED8 0%, #22D3EE 100%)',
                boxShadow: '0 6px 0 #0d2a6e, 0 10px 25px rgba(29,78,216,0.4)',
              }}
            />
            <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
            <div className="absolute -inset-px rounded-xl border border-[#22D3EE]/60 group-hover:border-[#22D3EE] transition-colors duration-300" />
            <span
              className="relative z-10 block px-10 py-4 font-black text-white uppercase tracking-[0.2em] text-sm flex items-center gap-2"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              <span>🚀</span><span>NEXT MISSION</span>
            </span>
          </motion.button>

          {/* Menu — secondaire discret */}
          <motion.button
            onClick={onBackToMenu}
            className="relative group"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'rgba(34,211,238,0.04)',
                border: '1px solid rgba(34,211,238,0.2)',
                boxShadow: '0 4px 0 rgba(0,0,0,0.4)',
              }}
            />
            <div className="absolute inset-0 rounded-xl bg-[#22D3EE]/0 group-hover:bg-[#22D3EE]/8 transition-all duration-300" />
            <span
              className="relative z-10 block px-8 py-4 text-[#22D3EE]/60 group-hover:text-[#22D3EE] font-bold uppercase tracking-wider text-sm transition-colors duration-300 flex items-center gap-2"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              <span>📡</span><span>MAIN BRIDGE</span>
            </span>
          </motion.button>
        </div>

        {/* Citation motivationnelle */}
        <motion.div
          className="mt-6 max-w-md mx-auto z-[11] relative"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.8 }}
        >
          <div
            className="px-6 py-3 text-center rounded-xl"
            style={{
              background: 'rgba(34,211,238,0.05)',
              border: '1px solid rgba(34,211,238,0.12)',
            }}
          >
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#22D3EE]/30 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#22D3EE]/30 rounded-tr-xl" />
            <MotivationalQuote theme={GameTheme.SPACE_OPS} result={GameResult.VICTORY} />
          </div>
        </motion.div>

      </StaggerReveal>
    </div>
  );
};

export default SpaceVictory;
