import React from 'react';
import { motion } from 'framer-motion';
import { ThemeComponentProps } from '../../EndGameScreen.types';
import { CyberEffectsRed } from './CyberEffects';
import { DebrisSystem } from '../../shared/ConfettiSystem';
import { StaggerReveal } from '../../shared/StaggerReveal';
import { TypewriterText } from '../../shared/TypewriterText';
import { GlitchText } from '../../shared/GlitchText';
import { ProgressBar } from '../../shared/ProgressBar';
import { MotivationalQuote } from '../../shared/MotivationalQuote';
import { ThemeConfigs } from '../../../../constants/themes';
import { GameTheme, GameResult } from '../../../../types/game.types';

const CyberDefeat: React.FC<ThemeComponentProps> = ({ data, onRetry, onBackToMenu }) => {
  const config = ThemeConfigs[GameTheme.CYBER_ARENA].defeat;

  const errorLogs = [
    { msg: '>> stack overflow detected at 0x4F2B', delay: 1.5 },
    { msg: '>> memory corruption at 0x8D1A...', delay: 2.0 },
    { msg: '>> null pointer dereference', delay: 2.5 },
    { msg: '>> process terminated [EXIT_CODE: -1]', delay: 3.0 },
  ];

  return (
    <div
      className="w-full h-full text-white relative overflow-hidden flex flex-col items-center justify-center p-6"
      style={{ fontFamily: "'Orbitron', sans-serif" }}
    >
      <CyberEffectsRed />
      <DebrisSystem active={true} colors={config.particleColors} />

      <StaggerReveal direction="down" staggerDelay={0.35}>

        {/* Emoji — chute depuis le haut (dysfonctionnement) */}
        <motion.div
          className="relative mb-3 z-[11] mx-auto text-center"
          initial={{ y: -80, scale: 1.5, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 60 }}
        >
          <motion.div
            className="text-[clamp(3.5rem,12vw,6rem)] relative z-10"
            style={{ filter: 'drop-shadow(0 0 25px rgba(255,23,68,0.6)) grayscale(0.3)' }}
            animate={{ x: [-3, 3, -2, 1, 0] }}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 2.5 }}
          >
            {config.emoji}
          </motion.div>
        </motion.div>

        {/* Titre — glitch impact */}
        <div className="text-center z-[11] relative mb-6">
          <GlitchText
            intensity="high"
            text={config.title}
            className="text-[clamp(1.8rem,7vw,4rem)] font-black text-[#FF1744] tracking-[0.2em] block [text-shadow:0_0_30px_rgba(255,23,68,0.5),3px_0_rgba(0,229,255,0.3),-3px_0_rgba(255,23,68,0.3)]"
          />
          <p className="text-[#FF6D00] text-[clamp(0.7rem,2.5vw,1rem)] mt-3 font-bold tracking-[0.3em] uppercase font-mono">
            <TypewriterText text={config.subtitle} speed={40} cursorColor="#FF1744" />
          </p>
        </div>

        {/* Panneau encadré — Error Report */}
        <motion.div
          className="max-w-lg w-full mx-auto z-[11] relative"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #0c0c16 0%, #0f1018 60%, #0c0c16 100%)',
              border: '1px solid rgba(255,23,68,0.4)',
              boxShadow: '0 0 40px rgba(255,23,68,0.15), inset 0 1px 0 rgba(255,23,68,0.1)',
            }}
          >
            {/* Ligne lumineuse rouge */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, #FF1744, transparent)' }}
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{
                background: 'linear-gradient(90deg, rgba(255,23,68,0.1), rgba(12,12,22,0.9), rgba(255,23,68,0.1))',
                borderBottom: '1px solid rgba(255,23,68,0.15)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <motion.span className="text-[#FF1744] text-base" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>⚠️</motion.span>
                <span className="text-[#FF1744] text-xs font-bold tracking-[0.25em] uppercase font-mono">RUNTIME ERROR</span>
              </div>
              <span className="text-red-800 text-[10px] font-mono tracking-widest">CORE_DUMP</span>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {/* Test checklist */}
              <div className="space-y-2 mb-5">
                {[
                  { label: 'Test 1 - Initialisation', pass: true },
                  { label: 'Test 2 - Connection', pass: true },
                  { label: 'Test 3 - Data Load', pass: true },
                  { label: 'Test 4 - Processing', pass: false },
                  { label: 'Test 5 - Validation', pass: false },
                ].map((t, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-2.5 text-sm font-mono"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.15 }}
                  >
                    <span className={t.pass ? 'text-green-500' : 'text-red-500'}>{t.pass ? '✓' : '✗'}</span>
                    <span className={t.pass ? 'text-green-400/80' : 'text-red-400/80'}>{t.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-[10px] text-gray-600 mb-1.5 font-mono tracking-widest">
                  <span>ACCURACY</span>
                  <span className="text-red-600">{data.player.accuracy}%</span>
                </div>
                <ProgressBar value={data.player.accuracy} maxValue={100} colorFrom="#FF1744" colorTo="#FF6D00" />
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-red-900/30 to-transparent my-4" />

              {/* Error terminal logs — séquentiel */}
              <div
                className="rounded p-3 space-y-1.5"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,23,68,0.1)' }}
              >
                {errorLogs.map((log, i) => (
                  <motion.div
                    key={i}
                    className="text-[11px] font-mono"
                    style={{ color: i === errorLogs.length - 1 ? '#FF1744' : '#FF6D00' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: i === errorLogs.length - 1 ? [1, 0.3, 1] : 0.7 }}
                    transition={{
                      delay: log.delay,
                      duration: i === errorLogs.length - 1 ? 1 : 0.4,
                      repeat: i === errorLogs.length - 1 ? Infinity : 0,
                    }}
                  >
                    {log.msg}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-5 py-1.5"
              style={{ background: 'rgba(10,10,18,0.9)', borderTop: '1px solid rgba(255,23,68,0.06)' }}
            >
              <span className="text-gray-700 text-[10px] font-mono">SCORE: {data.player.score} PTS</span>
              <span className="text-red-900 text-[10px] font-mono">RANK: {data.player.rank}</span>
            </div>
          </div>
        </motion.div>

        {/* Boutons 3D */}
        <div className="flex gap-4 justify-center mt-8 z-[11] relative">
          {/* Retry — rouge danger */}
          <motion.button
            onClick={onRetry}
            className="relative group"
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.96, y: 2 }}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'rgba(255,23,68,0.08)',
                border: '2px solid rgba(255,23,68,0.5)',
                boxShadow: '0 6px 0 rgba(100,0,20,0.6), 0 0 20px rgba(255,23,68,0.1)',
              }}
            />
            <div className="absolute inset-0 rounded-xl bg-[#FF1744]/0 group-hover:bg-[#FF1744]/90 transition-all duration-500" />
            <span
              className="relative z-10 block px-9 py-4 text-[#FF1744] group-hover:text-[#0A0A12] font-black uppercase tracking-[0.2em] text-sm transition-colors duration-500 flex items-center gap-2"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <span>⚡</span><span>RECOMPILE</span>
            </span>
          </motion.button>

          {/* Menu — discret */}
          <motion.button
            onClick={onBackToMenu}
            className="relative group"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'rgba(55,71,79,0.06)',
                border: '1px solid rgba(55,71,79,0.25)',
                boxShadow: '0 4px 0 rgba(0,0,0,0.4)',
              }}
            />
            <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/4 transition-all duration-400" />
            <span
              className="relative z-10 block px-8 py-4 text-gray-600 group-hover:text-gray-400 font-bold uppercase tracking-wider text-sm transition-colors duration-300 flex items-center gap-2"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <span>🔙</span><span>BACK</span>
            </span>
          </motion.button>
        </div>

        {/* Message motivationnel */}
        <motion.div
          className="mt-6 max-w-md mx-auto z-[11] relative text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5, duration: 1 }}
        >
          <div
            className="px-6 py-3 rounded-xl"
            style={{ background: 'rgba(255,23,68,0.06)', border: '1px solid rgba(255,23,68,0.15)' }}
          >
            <MotivationalQuote theme={GameTheme.CYBER_ARENA} result={GameResult.DEFEAT} />
          </div>
        </motion.div>

      </StaggerReveal>
    </div>
  );
};

export default CyberDefeat;
