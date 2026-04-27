import { useTheme } from '../context/ThemeContext';

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

// Generate a deterministic box-shadow string for N stars (no DOM nodes per star)
function generateStarShadows(count: number): string {
  // Use a seeded pseudo-random sequence for SSR-consistency and zero re-renders
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(seed) / 0x7fffffff;
  };
  const shadows: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand() * 2000);
    const y = Math.floor(rand() * 2000);
    const opacity = 0.4 + rand() * 0.6;
    shadows.push(`${x}px ${y}px 0 rgba(255,255,255,${opacity.toFixed(2)})`);
  }
  return shadows.join(',');
}

// Cache at module level — computed once, never re-creates DOM nodes
const STAR_SHADOWS = generateStarShadows(150);

// Animated Stars for Space theme — single div, zero per-star DOM nodes
export function SpaceStars() {
  const { theme } = useTheme();

  if (theme !== 'space') return null;

  return (
    <div
      aria-hidden="true"
      className="fixed pointer-events-none"
      style={{
        zIndex: 0,
        width: '2px',
        height: '2px',
        top: 0,
        left: 0,
        borderRadius: '50%',
        background: 'transparent',
        boxShadow: STAR_SHADOWS,
        animation: 'twinkle 4s ease-in-out infinite alternate',
        transform: 'translateZ(0)', // promote to GPU layer
      }}
    />
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
