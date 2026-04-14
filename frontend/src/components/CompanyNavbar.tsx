import { Link } from 'react-router';
import { Building2 } from 'lucide-react';

interface CompanyNavbarProps {
  companyName?: string;
  companyLogo?: string;
  userName?: string;
  userRole?: 'admin' | 'member';
}

export function CompanyNavbar({ companyName = 'TechCorp Inc.', companyLogo, userName = 'John Doe', userRole = 'member' }: CompanyNavbarProps) {
  const isAdmin = userRole === 'admin';

  return (
    <nav className="sticky top-0 z-50 bg-[var(--surface-1)] border-b border-[var(--border-default)] backdrop-blur-sm bg-opacity-95">
      <div className="w-full px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Left: Logo + Company Name */}
        <div className="flex items-center gap-8">
          <Link to="/company/overview" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-[var(--text-primary)]">{companyName}</div>
              <div className="text-xs text-[var(--text-secondary)]">Company Portal</div>
            </div>
          </Link>

          {/* Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <Link
              to="/company/overview"
              className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
            >
              Overview
            </Link>
            <Link
              to="/company/challenges"
              className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
            >
              Challenges
            </Link>
            {isAdmin && (
              <Link
                to="/company/candidates"
                className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
              >
                Candidates
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/company/members"
                className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
              >
                Members
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/company/exports"
                className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
              >
                Exports
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <div className="text-sm font-semibold text-[var(--text-primary)]">{userName}</div>
            <div className="text-xs text-[var(--text-secondary)] capitalize">{userRole}</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
