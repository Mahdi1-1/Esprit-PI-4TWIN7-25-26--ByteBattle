import React from 'react';
import { motion } from 'framer-motion';
import { ThemeComponentProps } from '../../EndGameScreen.types';
import { RPGEffects } from './RPGEffects';
import { StaggerReveal } from '../../shared/StaggerReveal';
import { TypewriterText } from '../../shared/TypewriterText';
import { CountUpNumber } from '../../shared/CountUpNumber';
import { MotivationalQuote } from '../../shared/MotivationalQuote';
import { ThemeConfigs } from '../../../../constants/themes';
import { GameTheme, GameResult } from '../../../../types/game.types';

const RPGVictory: React.FC<ThemeComponentProps> = ({ data, onRetry, onBackToMenu }) => {
  const theme = ThemeConfigs[GameTheme.MYTHIC_RPG];
  const config = theme.victory;

  return (
    <div className="w-full h-full text-white relative flex flex-col items-center justify-center p-8 overflow-hidden font-lora">
      <RPGEffects variant="victory" />

      <StaggerReveal direction="up" staggerDelay={0.4}>
        {/* Dragon emoji with breathing effect */}
        <motion.div 
          className="text-[clamp(4rem,15vw,8rem)] mb-8 z-20 relative mx-auto text-center"
          style={{ filter: 'drop-shadow(0 0 30px rgba(245,158,11,0.5))' }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {config.emoji}
          <div className="absolute inset-0 bg-yellow-400/20 blur-[40px] rounded-full scale-150 -z-10" />
        </motion.div>

        {/* Title */}
        <div className="text-center z-20 relative mb-12">
          <h1 
            className="text-[clamp(2rem,10vw,5rem)] font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 mb-6"
            style={{ textShadow: '0 0 30px rgba(109,40,217,0.5)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
          >
            {config.title}
          </h1>
          <p className="text-[#F59E0B] text-[clamp(1rem,4vw,1.5rem)] font-lora italic" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}>
            <TypewriterText text={config.subtitle} speed={80} cursor={false} />
          </p>
        </div>

        {/* Scroll/Parchment Panel */}
        <div className="p-10 max-w-xl w-full mx-auto z-20 relative text-center bg-black/40 border-2 border-yellow-700/50 rounded-sm backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <div className="absolute top-0 left-0 w-full h-full border-[10px] border-double border-yellow-900/30 rounded pointer-events-none" />
          
          <div className="text-[#F59E0B] mb-6 text-xl tracking-[0.2em] font-cinzel">HEROICS</div>

          {/* XP Bar */}
          <div className="w-48 h-3 bg-black/50 rounded-md mx-auto mb-6 overflow-hidden border-2 border-[#F59E0B]">
            <motion.div
              className="h-full rounded-md"
              style={{ background: 'linear-gradient(90deg, #6D28D9, #F59E0B)', boxShadow: '0 0 15px #6D28D9' }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-8 relative z-10">
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-2 font-serif italic">Gold Earned</div>
              <div className="text-3xl text-yellow-400 font-bold">
                <CountUpNumber from={0} to={data.player.score * 10} duration={2000} prefix="⚔️ " />
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-2 font-serif italic">Accuracy</div>
              <div className="text-3xl text-green-400 font-bold">
                <CountUpNumber from={0} to={data.player.accuracy} duration={1500} suffix="%" />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-yellow-800/50">
            <div className="text-gray-400 text-sm mb-2 uppercase tracking-widest">Level Up!</div>
            <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-yellow-900">
              <motion.div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-300" 
                initial={{ width: '0%' }} animate={{ width: `${data.player.accuracy}%` }} transition={{ duration: 2, delay: 1 }} />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-6 justify-center mt-12 z-20 relative">
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={onRetry} 
            className="px-8 py-4 bg-gradient-to-b from-[#6D28D9] to-[#F59E0B] border-2 border-[#F59E0B] text-white rounded font-bold uppercase tracking-wider font-cinzel shadow-[0_4px_0_#422006] hover:shadow-[0_2px_0_#422006] hover:translate-y-[2px] transition-all"
          >
            ⚔️ LANCER!
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={onBackToMenu} 
            className="px-8 py-4 bg-gray-800 text-gray-300 rounded font-bold uppercase tracking-wider shadow-[0_4px_0_#1f2937] hover:shadow-[0_2px_0_#1f2937] hover:translate-y-[2px] transition-all border border-gray-700 font-cinzel"
          >
            TAVERN
          </motion.button>
        </div>
        <MotivationalQuote theme={GameTheme.MYTHIC_RPG} result={GameResult.VICTORY} className="text-yellow-600/50 font-serif" />
      </StaggerReveal>
    </div>
  );
};

export default RPGVictory;
