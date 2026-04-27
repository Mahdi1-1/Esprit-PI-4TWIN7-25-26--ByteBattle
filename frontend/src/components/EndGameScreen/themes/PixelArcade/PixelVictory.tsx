import React from 'react';
import { motion } from 'framer-motion';
import { ThemeComponentProps } from '../../EndGameScreen.types';
import { PixelEffects } from './PixelEffects';
import { ConfettiSystem } from '../../shared/ConfettiSystem';
import { CountUpNumber } from '../../shared/CountUpNumber';
import { MotivationalQuote } from '../../shared/MotivationalQuote';
import { ThemeConfigs } from '../../../../constants/themes';
import { GameTheme, GameResult } from '../../../../types/game.types';

const PixelVictory: React.FC<ThemeComponentProps> = ({ data, onRetry, onBackToMenu }) => {
  const config = ThemeConfigs[GameTheme.PIXEL_ARCADE].victory;

  return (
    <div className="w-full h-full text-white relative flex flex-col items-center justify-center p-8 overflow-hidden" style={{ fontFamily: '"Press Start 2P", monospace' }}>
      <PixelEffects variant="victory" />
      <ConfettiSystem active={true} colors={config.particleColors} />

      {/* Trophy with pixel spin */}
      <motion.div 
        className="text-[clamp(4rem,15vw,8rem)] mb-8 z-20 relative mx-auto text-center"
        style={{ filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,1))' }}
        animate={{ rotateY: [0, 180, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        {config.emoji}
      </motion.div>

      <div className="text-center z-20 relative mb-12">
        {/* Title with pixel bounce */}
        <motion.h1 
          className="text-[clamp(1.5rem,8vw,3rem)] text-[#FFBE0B] tracking-widest leading-relaxed mb-6"
          style={{ textShadow: '4px 4px 0 #FF006E, 8px 8px 0 #3A86FF' }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
        >
          {config.title}
        </motion.h1>
        {/* Subtitle with blink */}
        <motion.p 
          className="text-[#06FFA5] text-xl tracking-widest leading-relaxed"
          style={{ filter: 'drop-shadow(2px 2px 0 blue)' }}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
        >
          {config.subtitle}
        </motion.p>
      </div>

      {/* Score panel - arcade style */}
      <div className="bg-[#1A1A2E] border-4 border-white p-8 max-w-lg w-full mx-auto z-20 relative leading-relaxed" style={{ boxShadow: '0 0 20px #8338EC, 8px 8px 0 rgba(0,0,0,1)' }}>
        <div className="text-center mb-6 border-b-4 border-dashed border-white/50 pb-6">
          <div className="text-white text-sm mb-2 opacity-80">HI-SCORE</div>
          <div className="text-[#06FFA5] text-4xl">
            <CountUpNumber from={0} to={data.player.score} duration={1000} />
          </div>
        </div>
        
        <div className="space-y-4 text-sm leading-loose">
          <div className="flex justify-between items-center bg-black/50 p-2">
            <span className="text-[#FF006E]">P1 SCORE</span>
            <span className="text-white">{data.player.score}</span>
          </div>
          <div className="flex justify-between items-center bg-black/50 p-2">
            <span className="text-red-400">P2 SCORE</span>
            <span className="text-white">{data.opponent?.score ?? '???'}</span>
          </div>
          <div className="flex justify-between flex-row items-center border-t-2 border-white/20 pt-4 mt-4 text-xs">
            <span className="text-[#FFBE0B]">WIN BONUS</span>
            <motion.span 
              className="text-[#FFBE0B]"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >+5000</motion.span>
          </div>
        </div>
      </div>

      {/* Buttons - retro arcade style */}
      <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12 z-20 relative text-sm">
        <motion.button
          whileTap={{ y: 4, boxShadow: '0 2px 0 #8338EC' }}
          onClick={onRetry} 
          className="px-6 py-4 bg-[#3A86FF] border-4 border-white text-white shadow-[0_6px_0_#8338EC] hover:shadow-[0_4px_0_#8338EC] hover:translate-y-[2px] transition-all leading-relaxed"
        >
          🎮 START!
        </motion.button>
        <motion.button
          whileTap={{ y: 4, boxShadow: '0 2px 0 #555' }}
          onClick={onBackToMenu} 
          className="px-6 py-4 bg-gray-500 border-4 border-white text-white shadow-[0_6px_0_#333] hover:shadow-[0_4px_0_#333] hover:translate-y-[2px] transition-all leading-relaxed"
        >
          EXIT
        </motion.button>
      </div>

      <div className="z-20 relative w-full text-center mt-8">
        <MotivationalQuote theme={GameTheme.PIXEL_ARCADE} result={GameResult.VICTORY} className="text-xs text-white/50" />
      </div>
    </div>
  );
};

export default PixelVictory;
