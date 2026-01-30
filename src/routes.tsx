import { createBrowserRouter } from 'react-router';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Problems } from './pages/Problems';
import { Problem } from './pages/Problem';
import { DuelMatchmaking } from './pages/DuelMatchmaking';
import { Hackathon } from './pages/Hackathon';
import { HackathonScoreboard } from './pages/HackathonScoreboard';
import { Leaderboard } from './pages/Leaderboard';
import { Themes } from './pages/Themes';
import { ThemeShowcase } from './pages/ThemeShowcase';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Landing,
  },
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/signup',
    Component: Login, // Same component, different flow
  },
  {
    path: '/dashboard',
    Component: Dashboard,
  },
  {
    path: '/problems',
    Component: Problems,
  },
  {
    path: '/problem/:id',
    Component: Problem,
  },
  {
    path: '/duel',
    Component: DuelMatchmaking,
  },
  {
    path: '/duel/matchmaking',
    Component: DuelMatchmaking,
  },
  {
    path: '/hackathon',
    Component: Hackathon,
  },
  {
    path: '/hackathon/:id/scoreboard',
    Component: HackathonScoreboard,
  },
  {
    path: '/leaderboard',
    Component: Leaderboard,
  },
  {
    path: '/themes',
    Component: Themes,
  },
  {
    path: '/theme-showcase',
    Component: ThemeShowcase,
  },
  {
    path: '*',
    Component: () => (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-h1 mb-4 text-[var(--text-primary)]">404</h1>
          <p className="text-[var(--text-secondary)] mb-6">Page non trouvée</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-[var(--brand-primary)] text-[var(--bg-primary)] rounded-[var(--radius-md)] font-medium hover:opacity-90 transition-opacity"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    ),
  },
]);