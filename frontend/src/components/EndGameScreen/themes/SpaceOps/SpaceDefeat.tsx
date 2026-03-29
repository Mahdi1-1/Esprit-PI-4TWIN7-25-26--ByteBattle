import React from 'react';
import { motion } from 'framer-motion';
import { ThemeComponentProps } from '../../EndGameScreen.types';
import { SpaceEffects } from './SpaceEffects';
import { ShatterSystem } from '../../shared/ShatterSystem';
import { StaggerReveal } from '../../shared/StaggerReveal';
import { ProgressBar } from '../../shared/ProgressBar';
import { MotivationalQuote } from '../../shared/MotivationalQuote';
import { ThemeConfigs } from '../../../../constants/themes';
import { GameTheme, GameResult } from '../../../../types/game.types';

const SpaceDefeat: React.FC<ThemeComponentProps> = ({ data, onRetry, onBackToMenu }) => {
  const theme = ThemeConfigs[GameTheme.SPACE_OPS];
  const config = theme.defeat;

  const systemLogs = [
    { time: '14:32:07', msg: 'WARNING: Shield generator offline', type: 'warn' },
    { time: '14:32:12', msg: 'CRITICAL: Hull breach detected - Sector 7', type: 'error' },
    { time: '14:32:18', msg: 'ALERT: Life support failing', type: 'error' },
    { time: '14:32:25', msg: 'MAYDAY: Evacuation protocol initiated', type: 'critical' },
    { time: '14:32:31', msg: 'SIGNAL LOST...', type: 'dead' },
  ];

  const scoreDiff = Math.abs(data.player.score - (data.opponent?.score ?? 0));

  return (
    <div
      className="w-full h-full text-white relative overflow-hidden flex flex-col items-center justify-center p-6"
      style={{ fontFamily: "'Chakra Petch', sans-serif" }}
    >
      <SpaceEffects variant="defeat" />
      <ShatterSystem active={true} colors={config.particleColors} />

      {/* z-11 : Contenu */}
      <StaggerReveal direction="down" staggerDelay={0.35}>

        {/* Vaisseau détruit — tombe du haut (gravité) */}
        <motion.div
          className="relative mb-3 z-[11] mx-auto text-center"
          initial={{ scale: 2, opacity: 0, filter: 'blur(20px) brightness(3)', y: -60 }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px) brightness(1)', y: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          {/* Explosion glow */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(213,0,0,0.18) 0%, rgba(255,100,0,0.06) 40%, transparent 70%)' }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Debris orbit ring */}
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 pointer-events-none" viewBox="0 0 200 200">
            <motion.circle cx="100" cy="100" r="85" fill="none" stroke="rgba(213,0,0,0.18)" strokeWidth="1" strokeDasharray="8 14"
              animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: 'center' }} />
          </svg>
          <motion.div
            className="text-[clamp(3.5rem,12vw,6rem)] relative z-10"
            style={{ filter: 'grayscale(50%) drop-shadow(0 0 25px rgba(213,0,0,0.35))' }}
            animate={{ rotate: [0, 4, -3, 0], scale: [1, 1.04, 0.98, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {config.emoji}
          </motion.div>
        </motion.div>

        {/* Titre — glitch impact */}
        <div className="text-center z-[11] relative mb-6">
          <div className="relative inline-block">
            {/* Glitch layer 1 */}
            <motion.h1
              className="text-[clamp(2rem,8vw,4.5rem)] font-black tracking-[0.2em] uppercase absolute top-0 left-0"
              style={{ color: '#00ffff', clipPath: 'inset(0 0 60% 0)', opacity: 0.6 }}
              animate={{ x: [0, -5, 3, 0], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 0.12, repeat: Infinity, repeatDelay: 3.5 }}
            >
              {config.title}
            </motion.h1>
            <motion.h1
              className="text-[clamp(2rem,8vw,4.5rem)] font-black tracking-[0.2em] uppercase absolute top-0 left-0"
              style={{ color: '#ff0040', clipPath: 'inset(60% 0 0 0)', opacity: 0.6 }}
              animate={{ x: [0, 4, -2, 0], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 0.12, repeat: Infinity, repeatDelay: 3.5, delay: 0.06 }}
            >
              {config.title}
            </motion.h1>
            {/* Main */}
            <motion.h1
              className="text-[clamp(2rem,8vw,4.5rem)] font-black tracking-[0.2em] uppercase relative"
              style={{ color: '#D50000', textShadow: '0 0 40px rgba(213,0,0,0.5), 0 0 80px rgba(213,0,0,0.2)' }}
              animate={{ x: [0, 2, -1, 0] }}
              transition={{ duration: 0.18, repeat: Infinity, repeatDelay: 4.5 }}
            >
              {config.title}
            </motion.h1>
          </div>
          <motion.p
            className="text-[#FF6F00] text-[clamp(0.75rem,2vw,1rem)] mt-3 font-bold tracking-[0.3em] uppercase font-mono"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ⚠ {config.subtitle}
          </motion.p>
        </div>

        {/* Panneau encadré DAMAGE REPORT */}
        <motion.div
          className="max-w-xl w-full mx-auto z-[11] relative"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #040408 0%, #080810 50%, #040408 100%)',
              border: '1px solid rgba(213,0,0,0.3)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(213,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {/* Ligne lumineuse animée en haut */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, #D50000, transparent)' }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-2.5"
              style={{
                background: 'linear-gradient(90deg, rgba(213,0,0,0.12), rgba(20,5,5,0.9), rgba(213,0,0,0.12))',
                borderBottom: '1px solid rgba(213,0,0,0.15)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-red-600"
                  animate={{ opacity: [1, 0.2, 1], scale: [1, 0.7, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                <span className="text-red-500 font-bold uppercase tracking-[0.2em] text-xs font-mono">DAMAGE REPORT</span>
              </div>
              <span className="text-red-800 text-[10px] tracking-widest font-mono">SYS_CRITICAL</span>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {/* Status bars */}
              <div className="space-y-3.5 mb-5">
                {[
                  { label: 'HULL INTEGRITY', value: 8, colorFrom: '#D50000', colorTo: '#330000', status: 'CRITICAL', blink: true },
                  { label: 'OXYGEN RESERVES', value: 3, colorFrom: '#FF6F00', colorTo: '#331a00', status: 'DEPLETED', blink: false },
                  { label: 'SHIELD POWER', value: 0, colorFrom: '#333', colorTo: '#111', status: 'OFFLINE', blink: false },
                ].map((bar, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] text-gray-600 mb-1.5 tracking-[0.2em] font-mono">
                      <span>{bar.label}</span>
                      <motion.span
                        className="text-red-600"
                        animate={bar.blink ? { opacity: [1, 0.3, 1] } : {}}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        {bar.status}
                      </motion.span>
                    </div>
                    <ProgressBar value={bar.value} maxValue={100} colorFrom={bar.colorFrom} colorTo={bar.colorTo} direction="drain" duration={3 + i} />
                  </div>
                ))}
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-red-900/30 to-transparent my-4" />

              {/* Score comparison */}
              <div className="flex items-center justify-center gap-8 mb-5">
                <div className="text-center">
                  <div className="text-gray-600 text-[10px] tracking-[0.2em] font-mono mb-1">YOUR SCORE</div>
                  <div className="text-gray-500 text-3xl font-mono font-bold">{data.player.score}</div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-px bg-red-800/40" />
                  <span className="text-red-700 text-xs font-bold">-{scoreDiff}</span>
                  <div className="w-6 h-px bg-red-800/40" />
                </div>
                <div className="text-center">
                  <div className="text-gray-600 text-[10px] tracking-[0.2em] font-mono mb-1">HOSTILE</div>
                  <div className="text-red-500 text-3xl font-mono font-bold" style={{ textShadow: '0 0 12px rgba(213,0,0,0.4)' }}>
                    {data.opponent?.score ?? 0}
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-800/40 to-transparent my-4" />

              {/* System logs — séquentiel */}
              <div className="space-y-1.5">
                {systemLogs.map((log, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3 text-xs font-mono"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 + i * 0.4 }}
                  >
                    <span className="text-gray-700 shrink-0">[{log.time}]</span>
                    <span className={
                      log.type === 'critical' ? 'text-red-500 font-bold' :
                      log.type === 'error' ? 'text-red-600/80' :
                      log.type === 'dead' ? 'text-gray-600 italic' : 'text-yellow-700/80'
                    }>
                      {log.type === 'dead'
                        ? <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>{log.msg}</motion.span>
                        : `>> ${log.msg}`}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Countdown */}
              <motion.div
                className="text-center mt-5 text-red-700 font-mono font-bold text-base tracking-[0.3em]"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                T-MINUS 00:00:00
              </motion.div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-5 py-1.5"
              style={{ background: 'rgba(4,4,8,0.9)', borderTop: '1px solid rgba(213,0,0,0.08)' }}
            >
              <span className="text-gray-700 text-[10px] font-mono tracking-wider">BLACKBOX RECORDING</span>
              <motion.div className="flex items-center gap-1.5" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                <div className="w-1.5 h-1.5 rounded-full bg-red-800" />
                <span className="text-red-800 text-[10px] font-mono tracking-wider">REC</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Boutons 3D */}
        <div className="flex gap-4 justify-center mt-8 z-[11] relative">
          {/* Retry — accent espoir orange */}
          <motion.button
            onClick={onRetry}
            className="relative group"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.96, y: 2 }}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,111,0,0.1), rgba(255,111,0,0.04))',
                border: '1px solid rgba(255,111,0,0.45)',
                boxShadow: '0 6px 0 rgba(80,35,0,0.6), 0 0 20px rgba(255,111,0,0.08)',
              }}
            />
            <div className="absolute inset-0 rounded-xl bg-[#FF6F00]/0 group-hover:bg-[#FF6F00]/90 transition-all duration-500" />
            {/* Corner brackets */}
            <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-[#FF6F00]/50 rounded-tl" />
            <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-[#FF6F00]/50 rounded-tr" />
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-[#FF6F00]/50 rounded-bl" />
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-[#FF6F00]/50 rounded-br" />
            <span
              className="relative z-10 block px-10 py-4 text-[#FF6F00] group-hover:text-[#050510] font-bold uppercase tracking-[0.2em] transition-colors duration-500 text-sm flex items-center gap-2"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              <span>🔄</span><span>RESTART MISSION</span>
            </span>
          </motion.button>

          {/* Menu — encore plus discret */}
          <motion.button
            onClick={onBackToMenu}
            className="relative group"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'rgba(69,90,100,0.06)',
                border: '1px solid rgba(69,90,100,0.25)',
                boxShadow: '0 4px 0 rgba(0,0,0,0.5)',
              }}
            />
            <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/4 transition-all duration-400" />
            <span
              className="relative z-10 block px-8 py-4 text-gray-600 group-hover:text-gray-400 font-bold uppercase tracking-[0.2em] transition-colors duration-400 text-sm flex items-center gap-2"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              <span>📡</span><span>RETURN TO BASE</span>
            </span>
          </motion.button>
        </div>

        {/* Citation motivationnelle */}
        <motion.div
          className="mt-6 z-[11] relative max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4, duration: 1 }}
        >
          <div
            className="relative px-7 py-4 text-center rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(213,0,0,0.06), rgba(10,5,5,0.5))',
              border: '1px solid rgba(213,0,0,0.12)',
            }}
          >
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-900/35" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-900/35" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-red-900/35" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-900/35" />
            <MotivationalQuote theme={GameTheme.SPACE_OPS} result={GameResult.DEFEAT} />
          </div>
        </motion.div>

      </StaggerReveal>
    </div>
  );
};

export default SpaceDefeat;
