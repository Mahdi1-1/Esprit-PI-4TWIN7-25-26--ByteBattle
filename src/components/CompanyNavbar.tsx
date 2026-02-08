import { Link, useNavigate } from 'react-router';
import { Building2, Users, FileText, Download, Settings, LogOut, Bell, Search } from 'lucide-react';
import { Button } from '../components/Button';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useState, useEffect, useRef } from 'react';

interface CompanyNavbarProps {
  companyName?: string;
  companyLogo?: string;
  userName?: string;
  userRole?: 'owner' | 'recruiter';
}

export function CompanyNavbar({ companyName = 'TechCorp Inc.', companyLogo, userName = 'John Doe', userRole = 'owner' }: CompanyNavbarProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-[var(--surface-1)] border-b border-[var(--border-default)] backdrop-blur-sm bg-opacity-95">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
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
            <Link
              to="/company/candidates"
              className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
            >
              Candidates
            </Link>
            <Link
              to="/company/members"
              className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
            >
              Team
            </Link>
            <Link
              to="/company/exports"
              className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
            >
              Reports
            </Link>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--brand-primary)] transition-colors">
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--brand-primary)] transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--state-error)] rounded-full"></span>
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-semibold text-sm">
                {userName.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{userName}</div>
                <div className="text-xs text-[var(--text-secondary)] capitalize">{userRole}</div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-lg py-2 z-50">
                <Link
                  to="/company/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span>Company Settings</span>
                </Link>
                <div className="h-px bg-[var(--border-default)] my-2" />
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[var(--state-error)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
