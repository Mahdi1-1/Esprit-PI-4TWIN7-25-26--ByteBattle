import { Variants } from 'framer-motion';

export const victoryTrophyAnim: Variants = {
  hidden: { y: -100, opacity: 0, rotate: -20 },
  show: { 
    y: 0, 
    opacity: 1, 
    rotate: 0,
    transition: { type: 'spring', bounce: 0.5, duration: 1 }
  }
};

export const victoryPulse: Variants = {
  hidden: { scale: 1 },
  show: { 
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } 
  }
};
