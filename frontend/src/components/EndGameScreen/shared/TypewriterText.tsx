import React from 'react';
import { useTypewriter } from '../../../hooks/useTypewriter';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  cursorColor?: string;
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  delay = 0,
  cursor = true,
  cursorColor = 'inherit',
  className = ''
}) => {
  const displayed = useTypewriter(text, speed, delay);
  
  return (
    <span className={className}>
      {displayed}
      {cursor && <span className="animate-pulse" style={{ color: cursorColor }}>|</span>}
    </span>
  );
};
