import { createBrowserRouter } from 'react-router';
import { Landing } from './pages/Landing';
import { AuthCallback } from './pages/AuthCallback';
import { UnifiedLogin } from './pages/UnifiedLogin';
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard';
import { Problems } from './pages/Problems';
import { Problem } from './pages/Problem';
import { DuelRoom } from './pages/DuelRoom';
import { DuelMatchmaking } from './pages/DuelMatchmaking';
import { Hackathon } from './pages/Hackathon';
import { HackathonScoreboard } from './pages/HackathonScoreboard';
import { HackathonLobby } from './pages/HackathonLobby';
import { HackathonWorkspace } from './pages/HackathonWorkspace';
import { HackathonResults } from './pages/HackathonResults';
import { Leaderboard } from './pages/Leaderboard';
import { Themes } from './pages/Themes';
import { ThemeShowcase } from './pages/ThemeShowcase';
import { ThemeShowcaseComponents } from './pages/ThemeShowcaseComponents';
import { CanvasCatalog } from './pages/CanvasCatalog';
import { CanvasChallengeBrief } from './pages/CanvasChallengeBrief';
import { CanvasEditor } from './pages/CanvasEditor';
import { CanvasResult } from './pages/CanvasResult';
import { CanvasGallery } from './pages/CanvasGallery';
import { DiscussionPage } from './pages/DiscussionPage';
import { DiscussionDetailPage } from './pages/DiscussionDetailPage';
import { NewDiscussionPage } from './pages/NewDiscussionPage';
import { EditDiscussionPage } from './pages/EditDiscussionPage';
import { AIInterviewPage } from './pages/AIInterviewPage';
import { DataStructuresPage } from './pages/DataStructuresPage';
import { SketchpadPage } from './pages/SketchpadPage';

// Front Office Pages
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminProblems } from './pages/admin/AdminProblems';
import { AdminProblem, AdminProblemForm } from './pages/admin/AdminProblem';
import { AdminMonitoring } from './pages/admin/AdminMonitoring';
import { AdminSubmissions } from './pages/admin/AdminSubmissions';
import { AdminCanvasChallenges } from './pages/admin/AdminCanvasChallenges';
import { AdminHackathons } from './pages/admin/AdminHackathons';
import { AdminHackathonCreate } from './pages/admin/AdminHackathonCreate';
import { AdminHackathonDetail } from './pages/admin/AdminHackathonDetail';
import { AdminHackathonMonitoring } from './pages/admin/AdminHackathonMonitoring';
import { AdminHackathonClarifications } from './pages/admin/AdminHackathonClarifications';
import { AdminHackathonEdit } from './pages/admin/AdminHackathonEdit';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminAnticheat } from './pages/admin/AdminAnticheat';
import { AdminAISettings } from './pages/admin/AdminAISettings';
import { AdminFeatureFlags } from './pages/admin/AdminFeatureFlags';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';

// Error Pages
import { NotFound, PermissionDenied, LoadingPage, EmptyStatePage, ErrorPage } from './pages/ErrorPages';

// Company Portal Pages
import { CompanyOverview } from './pages/company/CompanyOverview';
import { CompanyCandidatesList } from './pages/company/CompanyCandidatesList';

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
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';
import { DuelResult } from './pages/DuelResult';

export const router = createBrowserRouter([
  // ─── Public Routes (no auth required) ─────────────
  {
    path: '/',
    Component: Landing,
    errorElement: <ErrorPage />,
  },
  {
    path: '/login',
    Component: UnifiedLogin,
  },
  {
    path: '/auth/callback',
    Component: AuthCallback,
  },
  {
    path: '/signup',
    Component: Signup,
  },

  // ─── User Routes (role: user only) ─────────────────
  {
    path: '/dashboard',
    element: <RoleRoute allowedRoles={['user']}><Dashboard /></RoleRoute>,
  },
  {
    path: '/profile',
    element: <RoleRoute allowedRoles={['user']}><Profile /></RoleRoute>,
  },
  {
    path: '/settings',
    element: <RoleRoute allowedRoles={['user']}><Settings /></RoleRoute>,
  },
  {
    path: '/problems',
    element: <RoleRoute allowedRoles={['user']}><Problems /></RoleRoute>,
  },
  {
    path: '/problem/:id',
    element: <RoleRoute allowedRoles={['user']}><Problem /></RoleRoute>,
  },
  {
    path: '/duel',
    element: <RoleRoute allowedRoles={['user']}><DuelMatchmaking /></RoleRoute>,
  },
  {
    path: '/duel/room/:id',
    element: <RoleRoute allowedRoles={['user']}><DuelRoom /></RoleRoute>,
  },
  {
    path: '/duel/matchmaking',
    element: <RoleRoute allowedRoles={['user']}><DuelMatchmaking /></RoleRoute>,
  },
  {
    path: '/duel/result',
    element: <RoleRoute allowedRoles={['user']}><DuelResult /></RoleRoute>,
  },
  {
    path: '/hackathon',
    element: <RoleRoute allowedRoles={['user']}><Hackathon /></RoleRoute>,
  },
  {
    path: '/hackathon/:id/scoreboard',
    element: <RoleRoute allowedRoles={['user']}><HackathonScoreboard /></RoleRoute>,
  },
  {
    path: '/hackathon/:id/lobby',
    element: <RoleRoute allowedRoles={['user']}><HackathonLobby /></RoleRoute>,
  },
  {
    path: '/hackathon/:id/workspace',
    element: <RoleRoute allowedRoles={['user']}><HackathonWorkspace /></RoleRoute>,
  },
  {
    path: '/hackathon/:id/results',
    element: <RoleRoute allowedRoles={['user']}><HackathonResults /></RoleRoute>,
  },
  {
    path: '/leaderboard',
    element: <RoleRoute allowedRoles={['user']}><Leaderboard /></RoleRoute>,
  },
  {
    path: '/themes',
    element: <RoleRoute allowedRoles={['user']}><Themes /></RoleRoute>,
  },
  {
    path: '/theme-showcase',
    element: <RoleRoute allowedRoles={['user']}><ThemeShowcase /></RoleRoute>,
  },
  {
    path: '/theme-components',
    element: <RoleRoute allowedRoles={['user']}><ThemeShowcaseComponents /></RoleRoute>,
  },
  {
    path: '/canvas',
    element: <RoleRoute allowedRoles={['user']}><CanvasCatalog /></RoleRoute>,
  },
  {
    path: '/canvas/:id/brief',
    element: <RoleRoute allowedRoles={['user']}><CanvasChallengeBrief /></RoleRoute>,
  },
  {
    path: '/canvas/:id/editor',
    element: <RoleRoute allowedRoles={['user']}><CanvasEditor /></RoleRoute>,
  },
  {
    path: '/canvas/:id/result',
    element: <RoleRoute allowedRoles={['user']}><CanvasResult /></RoleRoute>,
  },
  {
    path: '/canvas/gallery',
    element: <RoleRoute allowedRoles={['user']}><CanvasGallery /></RoleRoute>,
  },
  {
    path: '/discussion',
    element: <RoleRoute allowedRoles={['user']}><DiscussionPage /></RoleRoute>,
  },
  {
    path: '/discussion/new',
    element: <RoleRoute allowedRoles={['user']}><NewDiscussionPage /></RoleRoute>,
  },
  {
    path: '/discussion/edit/:id',
    element: <RoleRoute allowedRoles={['user']}><EditDiscussionPage /></RoleRoute>,
  },
  {
    path: '/discussion/:id',
    element: <RoleRoute allowedRoles={['user']}><DiscussionDetailPage /></RoleRoute>,
  },
  {
    path: '/interview',
    element: <RoleRoute allowedRoles={['user']}><AIInterviewPage /></RoleRoute>,
  },
  {
    path: '/data-structures',
    element: <RoleRoute allowedRoles={['user']}><DataStructuresPage /></RoleRoute>,
  },
  {
    path: '/sketchpad',
    element: <RoleRoute allowedRoles={['user']}><SketchpadPage /></RoleRoute>,
  },

  // ─── Admin Routes (role: admin only) ───────────────
  {
    path: '/admin',
    element: <RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute>,
  },
  {
    path: '/admin/dashboard',
    element: <RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute>,
  },
  {
    path: '/admin/users',
    element: <RoleRoute allowedRoles={['admin']}><AdminUsers /></RoleRoute>,
  },
  {
    path: '/admin/problems',
    element: <RoleRoute allowedRoles={['admin']}><AdminProblems /></RoleRoute>,
  },
  {
    path: '/admin/problems/new',
    element: <RoleRoute allowedRoles={['admin']}><AdminProblemForm /></RoleRoute>,
  },
  {
    path: '/admin/problem/:id',
    element: <RoleRoute allowedRoles={['admin']}><AdminProblem /></RoleRoute>,
  },
  {
    path: '/admin/problems/:id/edit',
    element: <RoleRoute allowedRoles={['admin']}><AdminProblemForm /></RoleRoute>,
  },
  {
    path: '/admin/canvas-challenges',
    element: <RoleRoute allowedRoles={['admin']}><AdminCanvasChallenges /></RoleRoute>,
  },
  {
    path: '/admin/submissions',
    element: <RoleRoute allowedRoles={['admin']}><AdminSubmissions /></RoleRoute>,
  },
  {
    path: '/admin/hackathons',
    element: <RoleRoute allowedRoles={['admin']}><AdminHackathons /></RoleRoute>,
  },
  {
    path: '/admin/hackathons/create',
    element: <RoleRoute allowedRoles={['admin']}><AdminHackathonCreate /></RoleRoute>,
  },
  {
    path: '/admin/hackathons/:id',
    element: <RoleRoute allowedRoles={['admin']}><AdminHackathonDetail /></RoleRoute>,
  },
  {
    path: '/admin/hackathons/:id/edit',
    element: <RoleRoute allowedRoles={['admin']}><AdminHackathonEdit /></RoleRoute>,
  },
  {
    path: '/admin/hackathons/:id/monitoring',
    element: <RoleRoute allowedRoles={['admin']}><AdminHackathonMonitoring /></RoleRoute>,
  },
  {
    path: '/admin/hackathons/:id/clarifications',
    element: <RoleRoute allowedRoles={['admin']}><AdminHackathonClarifications /></RoleRoute>,
  },
  {
    path: '/admin/reports',
    element: <RoleRoute allowedRoles={['admin']}><AdminReports /></RoleRoute>,
  },
  {
    path: '/admin/anticheat',
    element: <RoleRoute allowedRoles={['admin']}><AdminAnticheat /></RoleRoute>,
  },
  {
    path: '/admin/monitoring',
    element: <RoleRoute allowedRoles={['admin']}><AdminMonitoring /></RoleRoute>,
  },
  {
    path: '/admin/ai-settings',
    element: <RoleRoute allowedRoles={['admin']}><AdminAISettings /></RoleRoute>,
  },
  {
    path: '/admin/feature-flags',
    element: <RoleRoute allowedRoles={['admin']}><AdminFeatureFlags /></RoleRoute>,
  },
  {
    path: '/admin/audit-logs',
    element: <RoleRoute allowedRoles={['admin']}><AdminAuditLogs /></RoleRoute>,
  },

  // ─── Error Pages ──────────────────────────────────
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

  // ─── Company Portal (auth required, any role) ─────
  {
    path: '/company/overview',
    element: <ProtectedRoute><CompanyOverview /></ProtectedRoute>,
  },
  {
    path: '/company/candidates',
    element: <ProtectedRoute><CompanyCandidatesList /></ProtectedRoute>,
  },

  // ─── Under Construction Pages ─────────────────────
  {
    path: '/under-construction',
    Component: UnderConstruction,
  },
  {
    path: '/achievements',
    element: <RoleRoute allowedRoles={['user']}><AchievementsPlaceholder /></RoleRoute>,
  },
  {
    path: '/notifications',
    element: <ProtectedRoute><NotificationsPlaceholder /></ProtectedRoute>,
  },
  {
    path: '/ugc-moderation',
    element: <RoleRoute allowedRoles={['admin']}><UGCModerationPlaceholder /></RoleRoute>,
  },
  {
    path: '/billing',
    element: <ProtectedRoute><BillingPlaceholder /></ProtectedRoute>,
  },
  {
    path: '/settings-security',
    element: <RoleRoute allowedRoles={['user']}><SettingsSecurityPlaceholder /></RoleRoute>,
  },
]);