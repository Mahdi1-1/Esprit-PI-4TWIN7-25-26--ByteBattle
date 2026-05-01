import React from 'react';
import { GameTheme } from '../../../types/game.types';
import { ThemeConfigs } from '../../../constants/themes';
import { motion } from 'framer-motion';

interface MotivationalQuoteProps {
  theme: GameTheme;
  result: 'victory' | 'defeat';
  className?: string;
}

export const MotivationalQuote: React.FC<MotivationalQuoteProps> = ({
  theme,
  result,
  className = ''
}) => {
  const quote = ThemeConfigs[theme][result].motivationalQuote;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.5, duration: 1 }}
      className={`text-center italic text-sm text-gray-400 mt-8 mb-4 ${className}`}
    >
      "{quote}"
    </motion.div>
  );
};
