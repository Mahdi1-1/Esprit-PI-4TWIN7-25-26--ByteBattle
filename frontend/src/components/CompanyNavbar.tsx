import { Link, useNavigate } from 'react-router';
import { Building2, Users, FileText, Download, Settings, LogOut, Bell, Search, UserPlus, Copy, Check, RefreshCw, X } from 'lucide-react';
import { Button } from '../components/Button';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { companyService } from '../services/companyService';
import { getCompanyPermissions, getVisibleCompanyNavLinks } from '../constants/companyPermissions';

interface CompanyNavbarProps {
  companyName?: string;
  companyId?: string;
  companyLogo?: string;
  userName?: string;
  userRole?: 'owner' | 'recruiter' | 'member';
}

export function CompanyNavbar({ companyName: initialName, companyId: initialCompanyId, companyLogo, userName = 'User', userRole = 'member' }: CompanyNavbarProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [companyName, setCompanyName] = useState(initialName || 'Company');
  const [companyId, setCompanyId] = useState(initialCompanyId || '');
  const [loading, setLoading] = useState(!initialName);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const permissions = getCompanyPermissions(userRole);
  const visibleNavLinks = getVisibleCompanyNavLinks(userRole);
  const canGenerateInviteCode = permissions.canGenerateInviteCode;

  const expiryLabel = inviteExpiresAt
    ? new Date(inviteExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const handleGenerateInviteCode = async () => {
    if (!companyId) {
      setInviteError('Company not found. Please refresh and try again.');
      return;
    }

    setInviteLoading(true);
    setInviteError(null);
    try {
      const data = await companyService.regenerateJoinCode(companyId);
      setInviteCode(data.joinCode);
      setInviteExpiresAt(data.expiresAt);
      setCopied(false);
    } catch (error: any) {
      setInviteError(error?.response?.data?.message || 'Failed to generate invite code');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setInviteError('Unable to copy. Please copy manually.');
    }
  };

  useEffect(() => {
    async function fetchMyCompany() {
      if (initialName) setCompanyName(initialName);
      if (initialCompanyId) {
        setCompanyId(initialCompanyId);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/companies/my-company');
        if (res.data) {
          setCompanyName(res.data.name || 'Company');
          setCompanyId(res.data.id || '');
        }
      } catch {
        // Not a member of any company
      } finally {
        setLoading(false);
      }
    }
    fetchMyCompany();
  }, [initialName, initialCompanyId]);

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

  if (loading) {
    return (
      <nav className="sticky top-20 sm:top-24 z-40 bg-[var(--surface-1)] border-b border-[var(--border-default)] h-16 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full" />
      </nav>
    );
  }

  return (
    <nav className="sticky top-20 sm:top-24 z-40 bg-[var(--surface-1)] border-b border-[var(--border-default)] backdrop-blur-sm bg-opacity-95">
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
            {visibleNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {canGenerateInviteCode && (
            <button
              onClick={() => {
                setShowInviteModal(true);
                if (!inviteCode) {
                  void handleGenerateInviteCode();
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          )}
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
                <div className="text-xs text-[var(--text-secondary)] capitalize">{userRole || 'member'}</div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-lg py-2 z-50">
                {permissions.canOpenSettings && (
                  <>
                    <Link
                      to="/company/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Company Settings</span>
                    </Link>
                    <div className="h-px bg-[var(--border-default)] my-2" />
                  </>
                )}
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

      {showInviteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowInviteModal(false)} />
          <div className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Invite Member</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Generate a join code valid for 10 minutes</p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Share this code with the new member. They can use it in the company join flow.
              </p>

              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2.5">
                <div className="text-xs text-[var(--text-muted)] mb-1">Join code</div>
                <div className="font-mono text-lg tracking-wider text-[var(--text-primary)] break-all">
                  {inviteLoading ? 'Generating...' : inviteCode || 'No code generated yet'}
                </div>
              </div>

              {inviteExpiresAt && (
                <div className="text-xs text-[var(--text-secondary)]">
                  Expires at {expiryLabel}
                </div>
              )}

              {inviteError && (
                <div className="text-xs text-[var(--state-error)]">{inviteError}</div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => void handleGenerateInviteCode()}
                  disabled={inviteLoading}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${inviteLoading ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>

                <button
                  onClick={() => void handleCopyCode()}
                  disabled={!inviteCode || inviteLoading}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
