import React from 'react';
import { motion } from 'framer-motion';
import { ThemeComponentProps } from '../../EndGameScreen.types';
import { RPGEffects } from './RPGEffects';
import { StaggerReveal } from '../../shared/StaggerReveal';
import { ThemeConfigs } from '../../../../constants/themes';
import { GameTheme } from '../../../../types/game.types';

const RPGDefeat: React.FC<ThemeComponentProps> = ({ data, onRetry, onBackToMenu }) => {
  const themeConfig = ThemeConfigs[GameTheme.MYTHIC_RPG];
  const config = themeConfig.defeat;

  return (
    <div className="w-full h-full text-gray-400 relative flex flex-col items-center justify-center p-8 overflow-hidden font-lora">
      <RPGEffects variant="defeat" />

      <StaggerReveal direction="down" staggerDelay={0.5}>
        {/* Skull emoji - faded and ghostly */}
        <motion.div 
          className="text-[clamp(4rem,12vw,8rem)] mb-8 z-20 relative mx-auto text-center grayscale opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 4 }}
        >
          {config.emoji}
          <div className="absolute inset-0 bg-red-900/20 blur-[50px] rounded-full scale-150 -z-10" />
        </motion.div>

        <div className="text-center z-20 relative mb-12">
          <h1 
            className="text-[clamp(2rem,8vw,4.5rem)] font-cinzel text-[#D4C5A0] mb-6 tracking-widest uppercase"
            style={{ textShadow: '0 0 20px rgba(127,29,29,0.5)' }}
          >
            {config.title}
          </h1>
          <p className="text-[#92400E] text-[clamp(1rem,3vw,1.5rem)] font-lora italic">
            {config.subtitle}
          </p>
        </div>

        {/* Defeat panel */}
        <div 
          className="max-w-md w-full mx-auto z-20 relative text-center p-8 rounded"
          style={{
            background: 'linear-gradient(135deg, rgba(59,7,100,0.3), rgba(127,29,29,0.2))',
            border: '3px solid rgba(127,29,29,0.4)',
            boxShadow: '0 0 40px rgba(127,29,29,0.3)',
          }}
        >
          <div className="mb-4 text-sm font-serif flex justify-between px-4 opacity-60">
            <span>Ennemis vaincus</span>
            <span>{data.player.testsPassed}</span>
          </div>

          {/* Chains visual */}
          <div className="flex justify-center gap-8 my-6">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="w-[3px] h-[60px]"
                style={{ background: 'linear-gradient(#7F1D1D, transparent)' }}
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
              />
            ))}
          </div>

          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#7F1D1D] to-transparent my-6" />
          <div className="italic text-gray-600 text-sm font-serif">
            "Your soul returns to the bonfire."
          </div>
        </div>

        {/* Buttons - minimalist dark souls style */}
        <div className="flex flex-col gap-4 justify-center mt-12 z-20 relative items-center">
          <motion.button
            whileHover={{ scale: 1.05, color: '#EF4444' }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry} 
            className="text-gray-400 hover:text-red-500 transition-all uppercase tracking-[0.2em] text-lg font-cinzel"
            style={{
              background: 'linear-gradient(135deg, #7F1D1D, #3B0764)',
              border: '2px solid #F59E0B',
              padding: '15px 30px',
              borderRadius: '10px',
            }}
          >
            ⚔️ RETRY QUEST
          </motion.button>
          <div className="text-gray-800 text-xs">— OR —</div>
          <motion.button
            whileHover={{ scale: 1.05, color: '#ccc' }}
            whileTap={{ scale: 0.95 }}
            onClick={onBackToMenu} 
            className="text-[#92400E] hover:text-gray-400 transition-all uppercase tracking-widest text-sm font-lora border border-[#92400E] px-6 py-3 rounded"
          >
            🏚️ RETURN TO TAVERN
          </motion.button>
        </div>

        {/* Motivational */}
        <motion.div
          className="mt-8 px-6 py-3 rounded z-20 text-center"
          style={{
            background: 'rgba(127,29,29,0.2)',
            border: '2px solid #92400E',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <span className="text-[#D4C5A0] text-sm italic font-lora">"{config.motivationalQuote}"</span>
        </motion.div>
      </StaggerReveal>
    </div>
  );
};

export default RPGDefeat;
