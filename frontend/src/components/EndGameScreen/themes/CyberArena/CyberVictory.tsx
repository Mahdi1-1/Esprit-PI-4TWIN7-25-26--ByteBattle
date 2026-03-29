import React from 'react';
import { motion } from 'framer-motion';
import { ThemeComponentProps } from '../../EndGameScreen.types';
import { CyberEffects } from './CyberEffects';
import { ConfettiSystem } from '../../shared/ConfettiSystem';
import { CountUpNumber } from '../../shared/CountUpNumber';
import { StaggerReveal } from '../../shared/StaggerReveal';
import { MotivationalQuote } from '../../shared/MotivationalQuote';
import { ThemeConfigs } from '../../../../constants/themes';
import { GameTheme, GameResult } from '../../../../types/game.types';

const CyberVictory: React.FC<ThemeComponentProps> = ({ data, onRetry, onBackToMenu }) => {
  const config = ThemeConfigs[GameTheme.CYBER_ARENA].victory;

  return (
    <div
      className="w-full h-full text-white relative overflow-hidden flex flex-col items-center justify-center p-6"
      style={{ fontFamily: "'Orbitron', sans-serif" }}
    >
      <CyberEffects />
      <ConfettiSystem active={true} colors={config.particleColors} />

      <StaggerReveal direction="up" staggerDelay={0.25}>

        {/* Emoji — spring bounce depuis le ciel */}
        <motion.div
          className="relative mb-3 z-[11] mx-auto text-center"
          initial={{ scale: 0, y: -120, rotate: -25 }}
          animate={{ scale: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', damping: 8, stiffness: 80, delay: 0.1 }}
        >
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.25) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="text-[clamp(3.5rem,14vw,7rem)] relative z-10"
            style={{ filter: 'drop-shadow(0 0 30px rgba(0,229,255,0.7))' }}
            animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {config.emoji}
          </motion.div>
        </motion.div>

        {/* Titre — zoom explosif */}
        <div className="text-center z-[11] relative mb-6">
          <motion.h1
            className="text-[clamp(2rem,9vw,5rem)] font-black tracking-[0.15em] uppercase bg-clip-text text-transparent leading-none"
            style={{
              backgroundImage: 'linear-gradient(135deg, #00E5FF 0%, #8B5CF6 60%, #00E5FF 100%)',
              backgroundSize: '200% 100%',
              filter: 'drop-shadow(0 0 25px rgba(0,229,255,0.4))',
            }}
            initial={{ scale: 3, opacity: 0, filter: 'blur(20px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)', backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3, backgroundPosition: { duration: 4, repeat: Infinity } }}
          >
            {config.title}
          </motion.h1>
          <motion.p
            className="text-[#00E5FF] text-[clamp(0.75rem,2.5vw,1rem)] mt-3 font-bold tracking-[0.3em] uppercase font-mono"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            {config.subtitle}
          </motion.p>
        </div>

        {/* Panneau encadré — Battle Points */}
        <motion.div
          className="max-w-lg w-full mx-auto z-[11] relative"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #0d1428 0%, #121A2F 60%, #0d1428 100%)',
              border: '1px solid rgba(0,229,255,0.3)',
              boxShadow: '0 0 40px rgba(0,229,255,0.1), inset 0 1px 0 rgba(0,229,255,0.15)',
            }}
          >
            {/* Ligne lumineuse animée */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, #00E5FF, #8B5CF6, transparent)' }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-3"
              style={{
                background: 'linear-gradient(90deg, rgba(0,229,255,0.08), rgba(11,16,32,0.9), rgba(139,92,246,0.08))',
                borderBottom: '1px solid rgba(0,229,255,0.1)',
              }}
            >
              <div className="flex items-center gap-2">
                <motion.div className="w-2 h-2 rounded-full bg-[#00E5FF]" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                <span className="text-[#00E5FF] text-xs font-bold tracking-[0.25em] uppercase font-mono">Battle Points Generated</span>
              </div>
              <span className="text-[#8B5CF6]/60 text-[10px] font-mono tracking-widest">SYS_OK</span>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {/* Score principal — CountUp */}
              <div className="text-center mb-6">
                <div
                  className="text-[clamp(3rem,10vw,5rem)] font-black font-mono leading-none"
                  style={{ color: '#00E5FF', textShadow: '0 0 30px rgba(0,229,255,0.6)' }}
                >
                  <CountUpNumber from={0} to={data.player.score} duration={1500} />
                </div>
                <div className="text-[#8B5CF6] text-xs mt-1 tracking-[0.3em] uppercase">POINTS</div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Tests Passed', value: `${data.player.testsPassed}/${data.player.totalTests}`, color: '#22C55E' },
                  { label: 'Accuracy', value: `${data.player.accuracy}%`, color: '#00E5FF' },
                  { label: 'Time', value: `${(data.player.timeElapsed / 60).toFixed(1)}m`, color: '#F59E0B' },
                  { label: 'Rank', value: data.player.rank, color: '#8B5CF6' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.08)' }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + i * 0.12 }}
                  >
                    <div className="text-gray-600 text-[9px] tracking-widest uppercase font-mono mb-1">{s.label}</div>
                    <div className="font-bold text-xl font-mono" style={{ color: s.color }}>{s.value}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-6 py-2"
              style={{ background: 'rgba(11,16,32,0.9)', borderTop: '1px solid rgba(0,229,255,0.06)' }}
            >
              <span className="text-gray-700 text-[10px] font-mono tracking-wider">XP GAINED: +{data.player.xpGained}</span>
              <span className="text-[#8B5CF6]/40 text-[10px] font-mono">LVL {data.player.level}</span>
            </div>
          </div>
        </motion.div>

        {/* Boutons 3D */}
        <div className="flex gap-4 justify-center mt-8 z-[11] relative">
          {/* Retry — accent cyan→violet */}
          <motion.button
            onClick={onRetry}
            className="relative group"
            whileHover={{ scale: 1.07, y: -3 }}
            whileTap={{ scale: 0.95, y: 2 }}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #00C8E0 0%, #8B5CF6 100%)',
                boxShadow: '0 6px 0 #004d6e, 0 10px 25px rgba(0,229,255,0.35)',
              }}
            />
            <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/15 transition-all duration-300" />
            <span
              className="relative z-10 block px-10 py-4 font-black text-[#0B1020] uppercase tracking-[0.2em] text-sm flex items-center gap-2"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <span>🎉</span><span>CÉLÉBRER!</span>
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
                background: 'rgba(0,229,255,0.04)',
                border: '1px solid rgba(0,229,255,0.2)',
                boxShadow: '0 4px 0 rgba(0,0,0,0.4)',
              }}
            />
            <div className="absolute inset-0 rounded-xl bg-[#00E5FF]/0 group-hover:bg-[#00E5FF]/6 transition-all duration-300" />
            <span
              className="relative z-10 block px-8 py-4 text-[#00E5FF]/60 group-hover:text-[#00E5FF] font-bold uppercase tracking-wider text-sm transition-colors duration-300"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              MAIN MENU
            </span>
          </motion.button>
        </div>

        {/* Citation motivationnelle */}
        <motion.div
          className="mt-6 max-w-md mx-auto z-[11] relative text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.8 }}
        >
          <div
            className="px-6 py-3 rounded-xl"
            style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)' }}
          >
            <MotivationalQuote theme={GameTheme.CYBER_ARENA} result={GameResult.VICTORY} />
          </div>
        </motion.div>

      </StaggerReveal>
    </div>
  );
};

export default CyberVictory;
