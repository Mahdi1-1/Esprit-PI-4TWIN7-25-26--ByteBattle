import { Variants } from 'framer-motion';

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } }
};

export const slideUpFade: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
};

export const scaleUpBounce: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 15 } }
};

export const stampEffect: Variants = {
  hidden: { opacity: 0, scale: 3, rotate: -15 },
  show: { opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 20 } }
};
