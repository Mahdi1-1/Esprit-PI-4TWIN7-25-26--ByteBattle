import React from 'react';
import { motion } from 'framer-motion';
import { ThemeComponentProps } from '../../EndGameScreen.types';
import { PixelEffects } from './PixelEffects';
import { ScreenEffects } from '../../shared/ScreenEffects';
import { ThemeConfigs } from '../../../../constants/themes';
import { GameTheme } from '../../../../types/game.types';

const PixelDefeat: React.FC<ThemeComponentProps> = ({ data, onRetry, onBackToMenu }) => {
  const config = ThemeConfigs[GameTheme.PIXEL_ARCADE].defeat;

  return (
    <div className="w-full h-full text-white relative flex flex-col items-center justify-center p-8 overflow-hidden" style={{ fontFamily: '"Press Start 2P", monospace' }}>
      <PixelEffects variant="defeat" />
      <ScreenEffects shake={{ intensity: 8, duration: 400, frequency: 50 }} chromaticAberration={true} />

      {/* Emoji with pixel invert glitch */}
      <motion.div 
        className="text-[clamp(4rem,12vw,8rem)] mb-8 z-20 relative mx-auto text-center grayscale"
        style={{ filter: 'drop-shadow(4px 4px 0 rgba(255,0,0,0.5))' }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
      >
        {config.emoji}
      </motion.div>

      <div className="text-center z-20 relative mb-12">
        {/* GAME OVER title with bounce */}
        <motion.h1 
          className="text-[clamp(1.5rem,8vw,4rem)] text-[#FF0040] tracking-widest leading-relaxed mb-8"
          style={{ textShadow: '4px 4px 0 #000, 8px 8px 0 #FF006E' }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
        >
          {config.title}
        </motion.h1>
        {/* Countdown blink */}
        <motion.p 
          className="text-[#FFBE0B] text-base tracking-widest leading-relaxed"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
        >
          {config.subtitle}
        </motion.p>
      </div>

      {/* Score panel - defeat arcade style */}
      <div className="bg-[#2A2A3E] border-4 border-white p-8 max-w-md w-full mx-auto z-20 relative" style={{ boxShadow: '8px 8px 0 #FF006E' }}>
        <div className="text-center text-[#FF0040] text-sm mb-8 leading-loose uppercase">
          {data.player.score > 0 ? `SCORE: ${data.player.score}` : 'NO SCORE'}
          <br/>
          {`TIME: ${Math.floor(data.player.timeElapsed)}S`}
        </div>

        {/* Countdown bar */}
        <div className="w-full bg-gray-900 border-2 border-[#FF0040] h-4 mb-4">
          <motion.div 
            className="h-full bg-[#FF0040]"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 9, ease: 'linear' }}
          />
        </div>

        <div className="text-center text-[#FFBE0B] text-xs leading-loose mt-4">
          INSERT COIN TO CONTINUE
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12 z-20 relative text-sm">
        <motion.button
          whileTap={{ y: 4, boxShadow: '2px 2px 0 #000' }}
          onClick={onRetry} 
          className="px-6 py-4 bg-[#3A86FF] border-4 border-white text-white shadow-[4px_4px_0_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] transition-all leading-relaxed"
        >
          CONTINUE? [YES]
        </motion.button>
        <motion.button
          whileTap={{ y: 4, boxShadow: '2px 2px 0 #000' }}
          onClick={onBackToMenu} 
          className="px-6 py-4 bg-gray-800 border-4 border-[#FF0040] text-[#FF0040] shadow-[4px_4px_0_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] transition-all leading-relaxed"
        >
          [NO] QUIT
        </motion.button>
      </div>

      {/* Motivational */}
      <motion.div
        className="mt-8 px-6 py-3 z-20 text-center bg-[#2A2A3E] border-4 border-[#FFBE0B]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <span className="text-[#FFBE0B] text-[0.6rem] leading-relaxed">"{config.motivationalQuote}"</span>
      </motion.div>
    </div>
  );
};

export default PixelDefeat;
