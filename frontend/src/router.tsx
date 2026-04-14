// This file only exports `router` (a non-component value).
// Kept separate from routes.tsx so that file only contains React components
// and stays compatible with Vite's Fast Refresh.
import { createBrowserRouter, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { AppShell, PrivateGuard, AdminGuard, PublicGuard, S } from './routes';

// ─── Lazy Pages ───
const Landing              = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Login                = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Signup               = lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })));
const VerifyEmail          = lazy(() => import('./pages/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const ForgotPassword       = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword        = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Dashboard            = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Problems             = lazy(() => import('./pages/Problems').then(m => ({ default: m.Problems })));
const Problem              = lazy(() => import('./pages/Problem').then(m => ({ default: m.Problem })));
const CanvasCatalog        = lazy(() => import('./pages/CanvasCatalog').then(m => ({ default: m.CanvasCatalog })));
const CanvasChallengeBrief = lazy(() => import('./pages/CanvasChallengeBrief').then(m => ({ default: m.CanvasChallengeBrief })));
const CanvasEditor         = lazy(() => import('./pages/CanvasEditor').then(m => ({ default: m.CanvasEditor })));
const CanvasResult         = lazy(() => import('./pages/CanvasResult').then(m => ({ default: m.CanvasResult })));
const CanvasGallery        = lazy(() => import('./pages/CanvasGallery').then(m => ({ default: m.CanvasGallery })));
const DuelMatchmaking      = lazy(() => import('./pages/DuelMatchmaking').then(m => ({ default: m.DuelMatchmaking })));
const DuelRoom             = lazy(() => import('./pages/DuelRoom').then(m => ({ default: m.DuelRoom })));
const DuelResult           = lazy(() => import('./pages/DuelResult').then(m => ({ default: m.DuelResult })));
const Leaderboard          = lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })));
const AIInterviewPage      = lazy(() => import('./pages/AIInterviewPage').then(m => ({ default: m.AIInterviewPage })));
const Hackathon            = lazy(() => import('./pages/Hackathon').then(m => ({ default: m.Hackathon })));
const Teams                = lazy(() => import('./pages/Teams').then(m => ({ default: m.Teams })));
const HackathonWorkspace   = lazy(() => import('./pages/HackathonWorkspace').then(m => ({ default: m.HackathonWorkspace })));
const HackathonResults     = lazy(() => import('./pages/HackathonResults').then(m => ({ default: m.HackathonResults })));
const HackathonScoreboard  = lazy(() => import('./pages/HackathonScoreboard').then(m => ({ default: m.HackathonScoreboard })));
const DiscussionPage       = lazy(() => import('./pages/DiscussionPage').then(m => ({ default: m.DiscussionPage })));
const ForumPage            = lazy(() => import('./pages/ForumPage').then(m => ({ default: m.ForumPage })));
const DiscussionDetailPage = lazy(() => import('./pages/DiscussionDetailPage').then(m => ({ default: m.DiscussionDetailPage })));
const NewDiscussionPage    = lazy(() => import('./pages/NewDiscussionPage').then(m => ({ default: m.NewDiscussionPage })));
const EditDiscussionPage   = lazy(() => import('./pages/EditDiscussionPage').then(m => ({ default: m.EditDiscussionPage })));
const CompanyJoin          = lazy(() => import('./pages/company/CompanyJoin').then(m => ({ default: m.CompanyJoin })));
const CompanyOverview      = lazy(() => import('./pages/company/CompanyOverview').then(m => ({ default: m.CompanyOverview })));
const CompanyCandidatesList = lazy(() => import('./pages/company/CompanyCandidates').then(m => ({ default: m.CompanyCandidates })));
const CompanyChallenges = lazy(() => import('./pages/company/CompanyChallenges').then(m => ({ default: m.CompanyChallenges })));
const CompanyChallengeCreate = lazy(() => import('./pages/company/CompanyChallengeCreate').then(m => ({ default: m.CompanyChallengeCreate })));
const CompanyChallengeDetails = lazy(() => import('./pages/company/CompanyChallengeDetails').then(m => ({ default: m.CompanyChallengeDetails })));
const CompanyChallengeResults = lazy(() => import('./pages/company/CompanyChallengeResults').then(m => ({ default: m.CompanyChallengeResults })));
const CompanyCandidateDetails = lazy(() => import('./pages/company/CompanyCandidateDetails').then(m => ({ default: m.CompanyCandidateDetails })));
const CompanyMembers = lazy(() => import('./pages/company/CompanyMembers').then(m => ({ default: m.CompanyMembers })));
const CompanyExports = lazy(() => import('./pages/company/CompanyExports').then(m => ({ default: m.CompanyExports })));
const CompanySettings = lazy(() => import('./pages/company/CompanySettings').then(m => ({ default: m.CompanySettings })));
const Settings             = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Profile              = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Themes               = lazy(() => import('./pages/Themes').then(m => ({ default: m.Themes })));
const SketchpadPage        = lazy(() => import('./pages/SketchpadPage').then(m => ({ default: m.SketchpadPage })));
const DataStructuresPage   = lazy(() => import('./pages/DataStructuresPage').then(m => ({ default: m.DataStructuresPage })));
const NotificationsPage    = lazy(() => import('./pages/NotificationsPage'));
const NotFound             = lazy(() => import('./pages/ErrorPages').then(m => ({ default: m.NotFound })));
const PublicProfile        = lazy(() => import('./pages/PublicProfile').then(m => ({ default: m.PublicProfile })));

// ─── Admin pages ───
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminProblems     = lazy(() => import('./pages/admin/AdminProblems').then(m => ({ default: m.AdminProblems })));
const AdminProblem      = lazy(() => import('./pages/admin/AdminProblem').then(m => ({ default: m.AdminProblem })));
const AdminSubmissions  = lazy(() => import('./pages/admin/AdminSubmissions').then(m => ({ default: m.AdminSubmissions })));
const AdminReports      = lazy(() => import('./pages/admin/AdminReports').then(m => ({ default: m.AdminReports })));
const AdminHackathons   = lazy(() => import('./pages/admin/AdminHackathons').then(m => ({ default: m.AdminHackathons })));
const AdminCompanies    = lazy(() => import('./pages/admin/AdminCompanies').then(m => ({ default: m.AdminCompanies })));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [

      // ─── Public ───
      { index: true,         element: <S><Landing /></S> },
      { path: 'companies',   element: <S><CompanyJoin /></S> },
      { path: 'leaderboard', element: <S><Leaderboard /></S> },
      { path: 'u/:username', element: <S><PublicProfile /></S> },

      // ─── Public only ───
      {
        element: <PublicGuard />,
        children: [
          { path: 'login',  element: <S><Login /></S> },
          { path: 'signup', element: <S><Signup /></S> },
          { path: 'verify-email', element: <S><VerifyEmail /></S> },
          { path: 'forgot-password', element: <S><ForgotPassword /></S> },
          { path: 'reset-password', element: <S><ResetPassword /></S> },
        ],
      },

      // ─── Authenticated ───
      {
        element: <PrivateGuard />,
        children: [
          { path: 'company-space',         element: <Navigate to="/company/overview" replace /> },
          { path: 'company/overview',      element: <S><CompanyOverview /></S> },
          { path: 'company/candidates',    element: <S><CompanyCandidatesList /></S> },
          { path: 'company/candidates/:id', element: <S><CompanyCandidateDetails /></S> },
          { path: 'company/members',       element: <S><CompanyMembers /></S> },
          { path: 'company/exports',       element: <S><CompanyExports /></S> },
          { path: 'company/settings',      element: <S><CompanySettings /></S> },
          { path: 'company/challenges',    element: <S><CompanyChallenges /></S> },
          { path: 'company/challenges/create', element: <S><CompanyChallengeCreate /></S> },
          { path: 'company/challenges/:id', element: <S><CompanyChallengeDetails /></S> },
          { path: 'company/challenges/:id/results', element: <S><CompanyChallengeResults /></S> },
          { path: 'company/challenges/:id/candidates', element: <S><CompanyCandidatesList /></S> },

          { path: 'dashboard',           element: <S><Dashboard /></S> },
          { path: 'problems',            element: <S><Problems /></S> },
          { path: 'problems/:id',        element: <S><Problem /></S> },
          { path: 'problem/:id',         element: <S><Problem /></S> },

          // Canvas
          { path: 'canvas',              element: <S><CanvasCatalog /></S> },
          { path: 'canvas/gallery',      element: <S><CanvasGallery /></S> },
          { path: 'canvas/:id/brief',    element: <S><CanvasChallengeBrief /></S> },
          { path: 'canvas/:id/editor',   element: <S><CanvasEditor /></S> },
          { path: 'canvas/:id/result',   element: <S><CanvasResult /></S> },

          // Duel
          { path: 'duel',                element: <S><DuelMatchmaking /></S> },
          { path: 'duel/room/:id',       element: <S><DuelRoom /></S> },
          { path: 'duel/:id/result',     element: <S><DuelResult /></S> },

          // Interview
          { path: 'interview',           element: <S><AIInterviewPage /></S> },

          // Hackathon
          { path: 'hackathon',                    element: <S><Hackathon /></S> },
          { path: 'teams',                        element: <S><Teams /></S> },
          { path: 'hackathon/:id/lobby',          element: <Navigate to="/teams" replace /> },
          { path: 'hackathon/:id/workspace',      element: <S><HackathonWorkspace /></S> },
          { path: 'hackathon/:id/results',        element: <S><HackathonResults /></S> },
          { path: 'hackathon/:id/scoreboard',     element: <S><HackathonScoreboard /></S> },

          // Forum hub + Discussion list
          { path: 'forum',               element: <S><ForumPage /></S> },
          { path: 'discussion',          element: <S><DiscussionPage /></S> },
          { path: 'discussion/new',      element: <S><NewDiscussionPage /></S> },
          { path: 'discussion/:id',      element: <S><DiscussionDetailPage /></S> },
          { path: 'discussion/:id/edit', element: <S><EditDiscussionPage /></S> },

          // User
          { path: 'settings',            element: <S><Settings /></S> },
          { path: 'profile/',            element: <S><Profile /></S> },
          { path: 'themes',              element: <S><Themes /></S> },
          { path: 'sketchpad',           element: <S><SketchpadPage /></S> },
          { path: 'data-structures',     element: <S><DataStructuresPage /></S> },
          { path: 'notifications',       element: <S><NotificationsPage /></S> },
        ],
      },

      // ─── Admin ───
      {
        element: <AdminGuard />,
        children: [
          { path: 'admin',             element: <S><AdminDashboard /></S> },
          { path: 'admin/users',       element: <S><AdminUsers /></S> },
          { path: 'admin/problems',    element: <S><AdminProblems /></S> },
          { path: 'admin/problems/new', element: <S><AdminProblem /></S> },
          { path: 'admin/problems/:id/edit', element: <S><AdminProblem /></S> },
          { path: 'admin/submissions', element: <S><AdminSubmissions /></S> },
          { path: 'admin/reports',     element: <S><AdminReports /></S> },
          { path: 'admin/hackathons',  element: <S><AdminHackathons /></S> },
          { path: 'admin/companies',   element: <S><AdminCompanies /></S> },
        ],
      },

      // ─── 404 ───
      { path: '*', element: <S><NotFound /></S> },
    ],
  },
]);
