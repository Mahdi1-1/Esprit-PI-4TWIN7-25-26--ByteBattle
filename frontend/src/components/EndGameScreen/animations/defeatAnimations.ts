import { Variants } from 'framer-motion';

export const defeatDropAnim: Variants = {
  hidden: { y: -200, opacity: 0, rotate: 15 },
  show: { 
    y: 0, 
    opacity: 1, 
    rotate: [15, -5, 2, 0],
    transition: { type: 'spring', bounce: 0.3, duration: 1.2 }
  }
};

export const shakeAnim: Variants = {
  hidden: { x: 0 },
  show: { 
    x: [-10, 10, -10, 10, -5, 5, 0], 
    transition: { duration: 0.4 } 
  }
};
