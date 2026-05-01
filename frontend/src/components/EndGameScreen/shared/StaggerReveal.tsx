import React from 'react';
import { motion } from 'framer-motion';

export const StaggerReveal: React.FC<{
  delay?: number;
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  children: React.ReactNode;
}> = ({ delay = 0, staggerDelay = 0.2, direction = 'up', children }) => {
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      }
    }
  };
  
  const getTransform = () => {
    switch (direction) {
      case 'up': return { y: 20 };
      case 'down': return { y: -20 };
      case 'left': return { x: 20 };
      case 'right': return { x: -20 };
    }
  };

  const item = {
    hidden: { opacity: 0, ...getTransform() },
    show: { opacity: 1, x: 0, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {React.Children.map(children, child => (
        <motion.div variants={item}>{child}</motion.div>
      ))}
    </motion.div>
  );
};
