// This file only exports `router` (a non-component value).
// Kept separate from routes.tsx so that file only contains React components
// and stays compatible with Vite's Fast Refresh.
import { createBrowserRouter, Navigate } from 'react-router-dom';
import React, { lazy } from 'react';
import { AppShell, PrivateGuard, AdminGuard, PublicGuard, S, CompanyRoleGuard } from './routes';
import { UnifiedLogin as Login } from './pages/UnifiedLogin';
import { Signup } from './pages/Signup';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { AuthCallback } from './pages/AuthCallback';

// ─── Lazy Pages ───
const Landing              = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
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
const Settings             = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Profile              = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Themes               = lazy(() => import('./pages/Themes').then(m => ({ default: m.Themes })));
const SketchpadPage        = lazy(() => import('./pages/SketchpadPage').then(m => ({ default: m.SketchpadPage })));
const DataStructuresPage   = lazy(() => import('./pages/DataStructuresPage').then(m => ({ default: m.DataStructuresPage })));
const NotificationsPage    = lazy(() => import('./pages/NotificationsPage'));
const NotFound             = lazy(() => import('./pages/ErrorPages').then(m => ({ default: m.NotFound })));
const PublicProfile        = lazy(() => import('./pages/PublicProfile').then(m => ({ default: m.PublicProfile })));
const CompanyJoin          = lazy(() => import('./pages/company/CompanyJoin').then(m => ({ default: m.CompanyJoin })));
const CompanySpace         = lazy(() => import('./pages/company/CompanySpace').then(m => ({ default: m.CompanySpace })));
const CompanyOverview      = lazy(() => import('./pages/company/CompanyOverview').then(m => ({ default: m.CompanyOverview })));
const CompanyDashboard    = lazy(() => import('./pages/company/CompanyDashboard').then(m => ({ default: m.CompanyDashboard })));
const CompanyMembers       = lazy(() => import('./pages/company/CompanyMembers').then(m => ({ default: m.CompanyMembers })));
const CompanyRoadmaps      = lazy(() => import('./pages/company/CompanyRoadmaps').then(m => ({ default: m.CompanyRoadmaps })));
const CompanyCourses       = lazy(() => import('./pages/company/CompanyCourses').then(m => ({ default: m.CompanyCourses })));
const CompanyJobs          = lazy(() => import('./pages/company/CompanyJobs').then(m => ({ default: m.CompanyJobs })));
const CompanyHiring        = lazy(() => import('./pages/company/CompanyHiring').then(m => ({ default: m.CompanyHiring })));
const CompanyNotifications = lazy(() => import('./pages/company/CompanyNotifications').then(m => ({ default: m.CompanyNotifications })));
const CompanyVerify = lazy(() => import('./pages/company/CompanyVerify').then(m => ({ default: m.CompanyVerifyPage })));
const HelpVerification = lazy(() => import('./pages/HelpVerification').then(m => ({ default: m.HelpVerification })));

// ─── Admin pages ───
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminProblems         = lazy(() => import('./pages/admin/AdminProblems').then(m => ({ default: m.AdminProblems })));
const AdminProblem          = lazy(() => import('./pages/admin/AdminProblem').then(m => ({ default: m.AdminProblem })));
const AdminCanvasChallenges = lazy(() => import('./pages/admin/AdminCanvasChallenges').then(m => ({ default: m.AdminCanvasChallenges })));
const AdminSubmissions      = lazy(() => import('./pages/admin/AdminSubmissions').then(m => ({ default: m.AdminSubmissions })));
const AdminReports          = lazy(() => import('./pages/admin/AdminReports').then(m => ({ default: m.AdminReports })));
const AdminHackathons       = lazy(() => import('./pages/admin/AdminHackathons').then(m => ({ default: m.AdminHackathons })));
const AdminCompanies      = lazy(() => import('./pages/admin/AdminCompanies').then(m => ({ default: m.AdminCompanies })));
const CreateChallenge      = lazy(() => import('./pages/company/CreateChallenge').then(m => ({ default: m.CreateChallenge })));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [

      // ─── Public ───
      { index: true,         element: <S><Landing /></S> },
      { path: 'leaderboard', element: <S><Leaderboard /></S> },
      { path: 'u/:username', element: <S><PublicProfile /></S> },
      { path: 'auth/callback', element: <S><AuthCallback /></S> },

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
          { path: 'duel/matchmaking',                element: <S><DuelMatchmaking /></S> },
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

          // Company (join via code or create)
          { path: 'company-space', element: <S><CompanySpace /></S> },
          { path: 'company',             element: <S><CompanyOverview /></S> },
          { path: 'company/overview',    element: <S><CompanyOverview /></S> },
          {
            path: 'company/candidates',
            element: (
              <S>
                <CompanyRoleGuard allowedRoles={[ 'owner', 'recruiter' ]}>
                  <CompanyHiring />
                </CompanyRoleGuard>
              </S>
            ),
          },
         // { path: 'company/challenges',  element: <S><CompanyChallenges /></S> },
          { path: 'company/company-challenges', element: <S><CompanyRoadmaps /></S> },
          { path: 'company/roadmaps', element: <S><CompanyRoadmaps /></S> },
          {
            path: 'company/roadmaps/create',
            element: (
              <S>
                <CompanyRoleGuard allowedRoles={[ 'owner', 'recruiter' ]}>
                  <CompanyRoadmaps />
                </CompanyRoleGuard>
              </S>
            ),
          },
          { path: 'company/roadmaps/:roadmapId', element: <S><CompanyRoadmaps /></S> },
          {
            path: 'company/roadmaps/:roadmapId/build',
            element: (
              <S>
                <CompanyRoleGuard allowedRoles={[ 'owner', 'recruiter' ]}>
                  <CompanyRoadmaps />
                </CompanyRoleGuard>
              </S>
            ),
          },
          { path: 'company/members',     element: <S><CompanyMembers /></S> },
          {
            path: 'company/exports',
            element: (
              <S>
                <CompanyRoleGuard allowedRoles={[ 'owner', 'recruiter' ]}>
                  <CompanyOverview />
                </CompanyRoleGuard>
              </S>
            ),
          },
          {
            path: 'company/settings',
            element: (
              <S>
                <CompanyRoleGuard allowedRoles={[ 'owner' ]}>
                  <CompanyOverview />
                </CompanyRoleGuard>
              </S>
            ),
          },

          // Company Hub (accessible by all members)
          { path: 'companies/:companyId/dashboard', element: <S><CompanyDashboard /></S> },
          { path: 'companies/:companyId/members', element: <S><CompanyMembers /></S> },
          { path: 'companies/:companyId/roadmaps', element: <S><CompanyRoadmaps /></S> },
          {
            path: 'companies/:companyId/roadmaps/create',
            element: (
              <S>
                <CompanyRoleGuard allowedRoles={[ 'owner', 'recruiter' ]}>
                  <CompanyRoadmaps />
                </CompanyRoleGuard>
              </S>
            ),
          },
          { path: 'companies/:companyId/roadmaps/:roadmapId', element: <S><CompanyRoadmaps /></S> },
          {
            path: 'companies/:companyId/roadmaps/:roadmapId/build',
            element: (
              <S>
                <CompanyRoleGuard allowedRoles={[ 'owner', 'recruiter' ]}>
                  <CompanyRoadmaps />
                </CompanyRoleGuard>
              </S>
            ),
          },
          { path: 'companies/:companyId/courses', element: <S><CompanyCourses /></S> },
          { path: 'companies/:companyId/jobs', element: <S><CompanyJobs /></S> },
          {
            path: 'companies/:companyId/hiring',
            element: (
              <S>
                <CompanyRoleGuard allowedRoles={[ 'owner', 'recruiter' ]}>
                  <CompanyHiring />
                </CompanyRoleGuard>
              </S>
            ),
          },
          { path: 'companies/:companyId/notifications', element: <S><CompanyNotifications /></S> },
          { path: 'companies/:companyId/verify', element: <S><CompanyVerify /></S> },

          // Legacy routes with /company/ prefix (always visible)
          { path: 'company/dashboard',   element: <S><CompanyDashboard /></S> },
          { path: 'company/challenges',  element: <S><CompanyRoadmaps /></S> },
          {
            path: 'company/challenges/create',
            element: (
              <S>
                <CompanyRoleGuard allowedRoles={[ 'owner', 'recruiter' ]}>
                  <CreateChallenge />
                </CompanyRoleGuard>
              </S>
            ),
          },
          {
            path: 'company/candidates',
            element: (
              <S>
                <CompanyRoleGuard allowedRoles={[ 'owner', 'recruiter' ]}>
                  <CompanyHiring />
                </CompanyRoleGuard>
              </S>
            ),
          },
          { path: 'company/members',     element: <S><CompanyMembers /></S> },
          { path: 'company/teams',       element: <S><CompanyRoadmaps /></S> },
          { path: 'company/reports',     element: <S><CompanyDashboard /></S> },

          // Help
          { path: 'help/company-verification', element: <S><HelpVerification /></S> },
        ],
      },

      // ─── Admin ───
      {
        element: <AdminGuard />,
        children: [
          { path: 'admin',             element: <S><AdminDashboard /></S> },
          { path: 'admin/users',       element: <S><AdminUsers /></S> },
          { path: 'admin/problems',            element: <S><AdminProblems /></S> },
          { path: 'admin/problems/new',        element: <S><AdminProblem /></S> },
          { path: 'admin/problems/:id/edit',   element: <S><AdminProblem /></S> },
          { path: 'admin/canvas-challenges',   element: <S><AdminCanvasChallenges /></S> },
          { path: 'admin/submissions',         element: <S><AdminSubmissions /></S> },
          { path: 'admin/reports',             element: <S><AdminReports /></S> },
          { path: 'admin/hackathons',          element: <S><AdminHackathons /></S> },
          { path: 'admin/companies',        element: <S><AdminCompanies /></S> },
        ],
      },

      // ─── 404 ───
      { path: '*', element: <S><NotFound /></S> },
    ],
  },
]);
