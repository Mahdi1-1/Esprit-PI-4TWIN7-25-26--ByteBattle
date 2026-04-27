import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  maxValue: number;
  colorFrom: string;
  colorTo: string;
  animated?: boolean;
  direction?: 'fill' | 'drain';
  duration?: number;
  showLabel?: boolean;
  height?: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  maxValue,
  colorFrom,
  colorTo,
  animated = true,
  direction = 'fill',
  duration = 1.5,
  showLabel = false,
  height = 8,
  className = ''
}) => {
  const [currentValue, setCurrentValue] = useState(direction === 'fill' ? 0 : maxValue);
  
  const targetPercent = Math.min(100, Math.max(0, (value / maxValue) * 100));

  useEffect(() => {
    if (animated) {
      setTimeout(() => setCurrentValue(value), 100);
    } else {
      setCurrentValue(value);
    }
  }, [value, animated]);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span>{currentValue}</span>
          <span>{maxValue}</span>
        </div>
      )}
      <div 
        className="w-full bg-black/20 rounded-full overflow-hidden" 
        style={{ height: `${height}px` }}
      >
        <motion.div 
          className="h-full rounded-full"
          initial={{ width: direction === 'fill' ? '0%' : '100%' }}
          animate={{ width: `${targetPercent}%` }}
          transition={{ duration, ease: "easeInOut" }}
          style={{
            background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`
          }}
        />
      </div>
    </div>
  );
};
