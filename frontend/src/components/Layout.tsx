import { ReactNode } from 'react';
import { ThemeEffects } from './ThemeEffects';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className = '' }: LayoutProps) {
  return (
    <div className={`relative min-h-screen bg-[var(--bg-primary)] ${className}`}>
      <ThemeEffects />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
