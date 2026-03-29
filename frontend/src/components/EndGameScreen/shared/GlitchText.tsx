import React from 'react';

interface GlitchTextProps {
  text: string;
  intensity?: 'low' | 'medium' | 'high';
  colors?: [string, string];
  className?: string;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  className = '',
  intensity = 'medium'
}) => {
  return (
    <span className={`relative inline-block ${className} ${intensity === 'high' ? 'animate-glitch' : ''}`}>
      <span className="relative z-10">{text}</span>
      <span className="absolute left-[-2px] top-0 opacity-70 z-0 text-red-500 blend-screen" aria-hidden="true">{text}</span>
      <span className="absolute left-[2px] top-0 opacity-70 z-0 text-cyan-500 blend-screen" aria-hidden="true">{text}</span>
    </span>
  );
};
