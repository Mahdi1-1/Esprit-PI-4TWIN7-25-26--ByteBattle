import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Layout — wrapper de contenu de page.
 * Navbar et ThemeEffects sont gérés UNE SEULE FOIS par RouterShell dans routes.tsx.
 * Ce composant ne fait qu'ajouter le padding/structure propre à chaque page.
 */
export function Layout({ children, className = '' }: LayoutProps) {
  return (
    <div className={`relative z-10 ${className}`}>
      <main>
        {children}
        <Outlet />
      </main>
    </div>
  );
}
