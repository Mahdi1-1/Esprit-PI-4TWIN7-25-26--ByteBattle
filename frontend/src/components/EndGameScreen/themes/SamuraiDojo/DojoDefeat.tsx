import React from 'react';
import { motion } from 'framer-motion';
import { ThemeComponentProps } from '../../EndGameScreen.types';
import { DojoEffects } from './DojoEffects';
import { StaggerReveal } from '../../shared/StaggerReveal';
import { ProgressBar } from '../../shared/ProgressBar';
import { MotivationalQuote } from '../../shared/MotivationalQuote';
import { ThemeConfigs } from '../../../../constants/themes';
import { GameTheme, GameResult } from '../../../../types/game.types';

const DojoDefeat: React.FC<ThemeComponentProps> = ({ data, onRetry, onBackToMenu }) => {
  const theme = ThemeConfigs[GameTheme.SAMURAI_DOJO];
  const config = theme.defeat;

  const testResults = [
    { name: 'Test 1 - Initialisation', passed: true },
    { name: 'Test 2 - Connection', passed: true },
    { name: 'Test 3 - Data Load', passed: true },
    { name: 'Test 4 - Processing', passed: false },
    { name: 'Test 5 - Validation', passed: false },
  ];

  const passedCount = testResults.filter((t) => t.passed).length;
  const progressPercent = (passedCount / testResults.length) * 100;

  return (
    <div className="w-full h-full text-dojo-ivory relative font-noto-sans-jp overflow-hidden flex flex-col items-center justify-center p-8">
      <DojoEffects variant="defeat" />

      <StaggerReveal direction="down" staggerDelay={0.5}>
        {/* Titre principal - grand et dramatique */}
        <div className="text-center z-20 relative mb-8">
          <motion.h1
            className={`text-5xl md:text-7xl ${theme.fonts.heading} text-dojo-ivory font-light tracking-[0.15em] uppercase`}
            initial={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            {config.subtitle}
          </motion.h1>

          <motion.p
            className="text-dojo-ivory/40 text-lg tracking-[0.3em] mt-4"
            style={{ fontFamily: "'Noto Serif JP', serif" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            道は続く — Le chemin continue
          </motion.p>
        </div>

        {/* Panneau principal avec stats et tests */}
        <motion.div
          className="relative max-w-2xl w-full mx-auto z-20 rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          {/* Fond du panneau */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 18, 12, 0.92), rgba(20, 10, 6, 0.96))',
              border: '1px solid rgba(150, 80, 40, 0.2)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
          />

          <div className="relative px-10 py-8">
            {/* Header d'erreur */}
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-yellow-500 text-xl">⚠</span>
                <span
                  className="text-red-500 text-lg tracking-[0.3em] font-bold uppercase"
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  RUNTIME ERROR
                </span>
              </div>

              {/* Score grand au centre */}
              <motion.div
                className="text-5xl font-bold text-red-500/80 my-4"
                style={{ fontFamily: "'Noto Serif JP', serif" }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.5, type: 'spring', damping: 10 }}
              >
                {data.player.score}
              </motion.div>
            </motion.div>

            {/* Barre de progression */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
            >
              <div className="relative h-4 rounded-full overflow-hidden bg-gray-800/60">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, #DC2626, #F59E0B ${progressPercent}%)`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ delay: 2, duration: 1.5, ease: 'easeOut' }}
                />
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ left: ['-20%', '120%'] }}
                  transition={{ delay: 3.5, duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
                />
              </div>
            </motion.div>

            {/* Liste des tests */}
            <div className="space-y-3 mb-8">
              {testResults.map((test, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-center gap-3 text-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.2 + index * 0.2 }}
                >
                  <span className={test.passed ? 'text-green-500' : 'text-red-500'}>
                    {test.passed ? '✓' : '✗'}
                  </span>
                  <span
                    className={`tracking-wider ${
                      test.passed ? 'text-green-400/80' : 'text-red-400/80'
                    }`}
                  >
                    {test.name}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Messages d'erreur terminal */}
            <motion.div
              className="text-center space-y-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 3.2 }}
            >
              <p
                className="text-gray-500 text-xs"
                style={{ fontFamily: "'Courier New', monospace" }}
              >
                {'>> stack overflow detected...'}
              </p>
              <p
                className="text-gray-500 text-xs"
                style={{ fontFamily: "'Courier New', monospace" }}
              >
                {'>> memory corruption at 0x4F2B...'}
              </p>
              <p
                className="text-gray-500 text-xs"
                style={{ fontFamily: "'Courier New', monospace" }}
              >
                {'>> process terminated'}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 z-20 relative">
          <motion.button
            onClick={onRetry}
            className={`relative px-10 py-3.5 rounded overflow-hidden group ${theme.fonts.heading}`}
            style={{
              background: 'linear-gradient(135deg, rgba(180, 50, 30, 0.2), rgba(150, 30, 20, 0.1))',
              border: '1px solid rgba(220, 38, 38, 0.4)',
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(220, 38, 38, 0.2)' }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/90 transition-all duration-500" />
            <span className="relative z-10 text-red-400 group-hover:text-white transition-colors duration-500 font-light tracking-[0.2em] flex items-center gap-3">
              <span>🗡️</span>
              <span>TRAIN AGAIN</span>
            </span>
          </motion.button>

          <motion.button
            onClick={onBackToMenu}
            className="px-8 py-3.5 font-light tracking-[0.2em] transition-colors duration-700 rounded flex items-center gap-2 justify-center"
            style={{
              color: 'rgba(200, 160, 120, 0.5)',
              border: '1px solid rgba(200, 160, 120, 0.15)',
            }}
            whileHover={{
              scale: 1.03,
              color: 'rgba(200, 160, 120, 0.8)',
              borderColor: 'rgba(200, 160, 120, 0.3)',
            }}
            whileTap={{ scale: 0.97 }}
          >
            <span>🏯</span>
            <span>RETURN TO DOJO</span>
          </motion.button>
        </div>

        {/* Citation motivationnelle encadrée */}
        <motion.div
          className="mt-6 z-20 relative text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5 }}
        >
          <MotivationalQuote theme={GameTheme.SAMURAI_DOJO} result={GameResult.DEFEAT} />
        </motion.div>
      </StaggerReveal>
    </div>
  );
};

export default DojoDefeat;