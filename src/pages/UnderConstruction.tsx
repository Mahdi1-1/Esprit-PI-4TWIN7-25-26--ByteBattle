import { Link } from 'react-router';
import { Construction, Home, ArrowLeft } from 'lucide-react';

interface UnderConstructionProps {
  feature?: string;
  context?: 'fo' | 'bo';
}

export function UnderConstruction({ feature = 'This feature', context = 'fo' }: UnderConstructionProps) {
  const backLink = context === 'bo' ? '/admin' : '/dashboard';
  const backLabel = context === 'bo' ? 'Back to Admin' : 'Back to Dashboard';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 mb-4">
            <Construction className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Under Construction</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            {feature} is currently being developed. Check back soon for updates!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={backLink}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-1)] transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Placeholder variants for specific features
export function DuelRoomPlaceholder() {
  return <UnderConstruction feature="Real-time Duel Room" context="fo" />;
}

export function DesignDuelPlaceholder() {
  return <UnderConstruction feature="Design Duel Mode" context="fo" />;
}

export function UGCModerationPlaceholder() {
  return <UnderConstruction feature="UGC Moderation" context="bo" />;
}

export function FocusLogsPlaceholder() {
  return <UnderConstruction feature="Focus Tracking Logs" context="bo" />;
}

export function ServicesStatusPlaceholder() {
  return <UnderConstruction feature="Detailed Services Status" context="bo" />;
}

export function EnterpriseChallengesPlaceholder() {
  return <UnderConstruction feature="Enterprise Private Challenges" context="bo" />;
}

export function BillingPlaceholder() {
  return <UnderConstruction feature="Billing & Subscriptions" context="bo" />;
}

export function SettingsSecurityPlaceholder() {
  return <UnderConstruction feature="Advanced Security Settings" context="bo" />;
}

export function AchievementsPlaceholder() {
  return <UnderConstruction feature="Achievements Gallery" context="fo" />;
}

export function NotificationsPlaceholder() {
  return <UnderConstruction feature="Notifications Center" context="fo" />;
}
