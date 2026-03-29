import React from 'react';
import { useCountUp } from '../../../hooks/useCountUp';

interface CountUpNumberProps {
  from: number;
  to: number;
  duration: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  direction?: 'up' | 'down';
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  from,
  to,
  duration,
  prefix = '',
  suffix = '',
  className = ''
}) => {
  const count = useCountUp(to, duration, from);
  
  return (
    <span className={className}>
      {prefix}{count}{suffix}
    </span>
  );
};
