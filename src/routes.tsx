import { createBrowserRouter } from 'react-router';
import { Landing } from './pages/Landing';
import { UnifiedLogin } from './pages/UnifiedLogin';
import { Dashboard } from './pages/Dashboard';
import { Problems } from './pages/Problems';
import { Problem } from './pages/Problem';
import { DuelMatchmaking } from './pages/DuelMatchmaking';
import { Hackathon } from './pages/Hackathon';
import { HackathonScoreboard } from './pages/HackathonScoreboard';
import { Leaderboard } from './pages/Leaderboard';
import { Themes } from './pages/Themes';
import { ThemeShowcase } from './pages/ThemeShowcase';
import { ThemeShowcaseComponents } from './pages/ThemeShowcaseComponents';
import { CanvasCatalog } from './pages/CanvasCatalog';
import { CanvasChallengeBrief } from './pages/CanvasChallengeBrief';
import { CanvasEditor } from './pages/CanvasEditor';
import { CanvasSubmissionResult } from './pages/CanvasSubmissionResult';
import { CanvasGallery } from './pages/CanvasGallery';

// Front Office Pages
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminProblems } from './pages/admin/AdminProblems';
import { AdminMonitoring } from './pages/admin/AdminMonitoring';
import { AdminSubmissions } from './pages/admin/AdminSubmissions';
import { AdminCanvasChallenges } from './pages/admin/AdminCanvasChallenges';
import { AdminHackathons } from './pages/admin/AdminHackathons';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminAnticheat } from './pages/admin/AdminAnticheat';
import { AdminAISettings } from './pages/admin/AdminAISettings';
import { AdminFeatureFlags } from './pages/admin/AdminFeatureFlags';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';

// Error Pages
import { NotFound, PermissionDenied, LoadingPage, EmptyStatePage, ErrorPage } from './pages/ErrorPages';

// Under Construction Pages
import {
  UnderConstruction,
  DuelRoomPlaceholder,
  AchievementsPlaceholder,
  NotificationsPlaceholder,
  UGCModerationPlaceholder,
  BillingPlaceholder,
  SettingsSecurityPlaceholder
} from './pages/UnderConstruction';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Landing,
  },
  {
    path: '/login',
    Component: UnifiedLogin,
  },
  {
    path: '/signup',
    Component: UnifiedLogin,
  },
  {
    path: '/dashboard',
    Component: Dashboard,
  },
  {
    path: '/profile',
    Component: Profile,
  },
  {
    path: '/settings',
    Component: Settings,
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
    path: '/theme-components',
    Component: ThemeShowcaseComponents,
  },
  {
    path: '/canvas',
    Component: CanvasCatalog,
  },
  {
    path: '/canvas/:id/brief',
    Component: CanvasChallengeBrief,
  },
  {
    path: '/canvas/:id/editor',
    Component: CanvasEditor,
  },
  {
    path: '/canvas/:id/result',
    Component: CanvasSubmissionResult,
  },
  {
    path: '/canvas/gallery',
    Component: CanvasGallery,
  },
  // Admin Routes
  {
    path: '/admin',
    Component: AdminDashboard,
  },
  {
    path: '/admin/dashboard',
    Component: AdminDashboard,
  },
  {
    path: '/admin/users',
    Component: AdminUsers,
  },
  {
    path: '/admin/problems',
    Component: AdminProblems,
  },
  {
    path: '/admin/canvas-challenges',
    Component: AdminCanvasChallenges,
  },
  {
    path: '/admin/submissions',
    Component: AdminSubmissions,
  },
  {
    path: '/admin/hackathons',
    Component: AdminHackathons,
  },
  {
    path: '/admin/reports',
    Component: AdminReports,
  },
  {
    path: '/admin/anticheat',
    Component: AdminAnticheat,
  },
  {
    path: '/admin/monitoring',
    Component: AdminMonitoring,
  },
  {
    path: '/admin/ai-settings',
    Component: AdminAISettings,
  },
  {
    path: '/admin/feature-flags',
    Component: AdminFeatureFlags,
  },
  {
    path: '/admin/audit-logs',
    Component: AdminAuditLogs,
  },
  // Error Pages
  {
    path: '/403',
    Component: PermissionDenied,
  },
  {
    path: '/500',
    Component: ErrorPage,
  },
  {
    path: '/loading',
    Component: LoadingPage,
  },
  {
    path: '/empty',
    Component: EmptyStatePage,
  },
  {
    path: '*',
    Component: NotFound,
  },
  // Under Construction Pages
  {
    path: '/under-construction',
    Component: UnderConstruction,
  },
  {
    path: '/duel-room',
    Component: DuelRoomPlaceholder,
  },
  {
    path: '/achievements',
    Component: AchievementsPlaceholder,
  },
  {
    path: '/notifications',
    Component: NotificationsPlaceholder,
  },
  {
    path: '/ugc-moderation',
    Component: UGCModerationPlaceholder,
  },
  {
    path: '/billing',
    Component: BillingPlaceholder,
  },
  {
    path: '/settings-security',
    Component: SettingsSecurityPlaceholder,
  },
]);