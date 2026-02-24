import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';

// Animated Grid Background for Cyber/Sports themes
export function AnimatedGrid() {
  const { theme } = useTheme();
  
  if (theme !== 'cyber' && theme !== 'sports') return null;
  
  return (
    <div 
      className="fixed inset-0 bg-grid bg-grid-animated pointer-events-none opacity-30"
      style={{ zIndex: 0 }}
    />
  );
}

// Scan Line Effect for Cyber theme
export function ScanLine() {
  const { theme } = useTheme();
  
  if (theme !== 'cyber') return null;
  
  return (
    <>
      <div className="scan-line" style={{ top: '20%' }} />
      <div className="scan-horizontal" style={{ left: '30%' }} />
    </>
  );
}

// Animated Stars for Space theme
export function SpaceStars() {
  const { theme } = useTheme();
  const [stars, setStars] = useState<{ x: number; y: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    if (theme === 'space') {
      const newStars = Array.from({ length: 100 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 2,
      }));
      setStars(newStars);
    }
  }, [theme]);

  if (theme !== 'space') return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute w-[2px] h-[2px] bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            animation: `twinkle ${star.duration}s infinite`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// Decorative Separator for Samurai theme
export function SamuraiSeparator() {
  return (
    <div 
      className="w-full h-[1px] my-8 opacity-30"
      style={{
        background: 'linear-gradient(90deg, transparent, var(--brand-secondary), transparent)'
      }}
    />
  );
}

// Pixel Grid Background
export function PixelGrid() {
  const { theme } = useTheme();
  
  if (theme !== 'pixel') return null;
  
  return (
    <div 
      className="fixed inset-0 pointer-events-none opacity-20"
      style={{ 
        zIndex: 0,
        backgroundImage: `
          repeating-linear-gradient(0deg, 
            rgba(255, 255, 255, 0.03) 0px,
            rgba(255, 255, 255, 0.03) 4px,
            transparent 4px,
            transparent 8px),
          repeating-linear-gradient(90deg, 
            rgba(255, 255, 255, 0.03) 0px,
            rgba(255, 255, 255, 0.03) 4px,
            transparent 4px,
            transparent 8px)
        `
      }}
    />
  );
}

// Combined Theme Effects Component
export function ThemeEffects() {
  return (
    <>
      <AnimatedGrid />
      <ScanLine />
      <SpaceStars />
      <PixelGrid />
    </>
  );
}
