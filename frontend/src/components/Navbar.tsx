import { Link, useNavigate } from 'react-router';
import {
  Menu,
  Moon,
  Sun,
  Swords,
  Trophy,
  Code2,
  Users,
  Palette,
  PenTool,
  Pencil,
  Type,
  LogOut,
  Settings as SettingsIcon,
  User as UserIcon,
  MessageSquare,
  Bot,
  Layers,
  Shield,
  X,
  ChevronDown,
  Flag,
  Building2,
} from 'lucide-react';
import { BBLogo } from './BBLogo';
import { useTheme } from '../context/ThemeContext';
import { useFontSize } from '../context/FontSizeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './Button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useState, useEffect, useRef, useCallback } from 'react';
import { avatarService } from '../services/avatarService';
import { profileService } from '../services/profileService';
import { NotificationBell } from './NotificationBell';
import { UserSearchBar } from './UserSearchBar';
import { useNotifications } from '../context/NotificationContext';
import { Bell } from 'lucide-react';
import { companiesService, CompanyMembership } from '../services/companiesService';
import { JoinCompanyModal } from './company/JoinCompanyModal';

interface NavbarProps {
  isLoggedIn?: boolean;
  userAvatar?: string;
  username?: string;
}

// ─── Types pour les liens de navigation ───
interface NavLink {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export function Navbar({ isLoggedIn, userAvatar, username }: NavbarProps) {
  const { colorScheme, toggleColorScheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFontSizePanel, setShowFontSizePanel] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeCompanyMembership, setActiveCompanyMembership] = useState<CompanyMembership | null>(null);
  const [showJoinCompanyModal, setShowJoinCompanyModal] = useState(false);

  const fontSizePanelRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // ─── Derived State ───
  const loggedIn = isAuthenticated || isLoggedIn;
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isUser = userRole === 'user';

  const displayAvatar = user?.profileImage
    ? profileService.getPhotoUrl(user.profileImage, user?.username || username || 'default')
    : (user as any)?.avatar?.thumbnailUrl
      ? avatarService.getFullUrl((user as any).avatar.thumbnailUrl)
      : profileService.getPhotoUrl(userAvatar, user?.username || username || 'default');

  const displayUsername = user?.username || username;

  // ─── Notifications ───
  const { unreadCount } = useNotifications();

  // ─── Navigation Links ───
  const userLinks: NavLink[] = [
    { to: '/problems', icon: <Code2 className="w-10 h-7" />, label: t('nav.problems') },
    { to: '/canvas', icon: <PenTool className="w-10 h-7" />, label: t('nav.canvas') },
    { to: '/sketchpad', icon: <Pencil className="w-10 h-7" />, label: t('nav.drawing') },
    { to: '/forum', icon: <MessageSquare className="w-10 h-7" />, label: t('nav.discussion') },
    { to: '/data-structures', icon: <Layers className="w-10 h-7" />, label: t('nav.dataStructures') },
    { to: '/interview', icon: <Bot className="w-10 h-7" />, label: t('nav.interview') },
    { to: '/duel', icon: <Swords className="w-10 h-7" />, label: t('nav.duel') },
    { to: '/hackathon', icon: <Flag className="w-10 h-7" />, label: t('nav.hackathon') },
        {to: '/company/overview', icon: <Building2 className="w-10 h-7" />, label: 'Join Company' },
    { to: '/teams', icon: <Users className="w-10 h-7" />, label: t('nav.teams') },
    { to: '/leaderboard', icon: <Trophy className="w-10 h-7" />, label: t('nav.leaderboard') },
    { to: '/themes', icon: <Palette className="w-10 h-7" />, label: t('nav.themes') },
  ];

  const adminLinks: NavLink[] = [
    { to: '/admin', icon: <Shield className="w-10 h-7" />, label: 'Dashboard' },
    { to: '/admin/users', icon: <Users className="w-10 h-7" />, label: 'Users' },
    { to: '/admin/problems', icon: <Code2 className="w-10 h-7" />, label: 'Problems' },
    { to: '/admin/submissions', icon: <Layers className="w-10 h-7" />, label: 'Submissions' },
    { to: '/admin/reports', icon: <MessageSquare className="w-10 h-7" />, label: 'Reports' },
  ];

  const activeLinks = isAdmin ? adminLinks : isUser ? userLinks : [];

  // ─── Close all menus ───
  const closeAllMenus = useCallback(() => {
    setShowFontSizePanel(false);
    setShowUserMenu(false);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // ─── Click outside handler ───
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fontSizePanelRef.current && !fontSizePanelRef.current.contains(event.target as Node)) {
        setShowFontSizePanel(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Load active company membership (member/recruiter/admin of a company) ───
  useEffect(() => {
    const loadMembership = async () => {
      if (!loggedIn || !isUser) {
        setActiveCompanyMembership(null);
        return;
      }

      try {
        const memberships = await companiesService.getMyCompanies();
        const activeMembership = (memberships || []).find((m) => m.status === 'active') || null;
        setActiveCompanyMembership(activeMembership);
      } catch {
        setActiveCompanyMembership(null);
      }
    };

    loadMembership();
  }, [loggedIn, isUser]);

  // ─── Lock body scroll when mobile menu is open ───
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // ─── Close mobile menu on resize to desktop ───
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Close mobile menu on Escape ───
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        closeAllMenus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeAllMenus]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  // ─── Reusable Desktop Nav Link ───
  const DesktopNavLink = ({ to, icon, label, onClick }: NavLink) => {
    const [hovered, setHovered] = useState(false);
    const content = (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="
          relative
          flex items-center justify-center
          w-9 h-9
          rounded-[var(--radius-md)]
          transition-colors duration-150
          cursor-pointer
        "
        style={{
          color: hovered ? 'var(--brand-primary)' : 'var(--text-secondary)',
          background: hovered ? 'var(--surface-2)' : 'transparent',
        }}
        aria-label={label}
      >
        {/* Icon */}
        {icon}

        {/* Tooltip */}
        <span
          className="
            pointer-events-none
            absolute top-full left-1/2 -translate-x-1/2 mt-2
            px-2.5 py-1
            text-xs font-semibold whitespace-nowrap
            rounded-[var(--radius-sm)]
            shadow-lg
            z-[9999]
            transition-all duration-150
          "
          style={{
            background: 'var(--surface-1)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            opacity: hovered ? 1 : 0,
            transform: hovered
              ? 'translateX(-50%) translateY(0)'
              : 'translateX(-50%) translateY(-4px)',
          }}
        >
          {/* Arrow */}
          <span
            className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45"
            style={{
              background: 'var(--surface-1)',
              borderLeft: '1px solid var(--border-default)',
              borderTop: '1px solid var(--border-default)',
            }}
          />
          {label}
        </span>
      </div>
    );

    if (onClick) {
      return <div onClick={onClick}>{content}</div>;
    }

    return <Link to={to}>{content}</Link>;
  };

  // ─── Reusable Mobile Nav Link ───
  const MobileNavLink = ({ to, icon, label, onClick }: NavLink) => {
    if (onClick) {
      return (
        <div
          onClick={() => { onClick(); setMobileMenuOpen(false); }}
          className="
            flex items-center gap-3
            px-4 py-3
            text-[var(--text-primary)]
            hover:bg-[var(--surface-2)]
            active:bg-[var(--surface-3)]
            rounded-[var(--radius-md)]
            transition-colors duration-150
            cursor-pointer
          "
        >
          {icon}
          <span className="font-medium">{label}</span>
        </div>
      );
    }

    return (
      <Link
        to={to}
        onClick={closeMobileMenu}
        className="
          flex items-center gap-3
          px-4 py-3
          text-[var(--text-primary)]
          hover:bg-[var(--surface-2)]
          active:bg-[var(--surface-3)]
          rounded-[var(--radius-md)]
          transition-colors duration-150
        "
      >
        <span className="text-[var(--text-secondary)]">{icon}</span>
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  // ─── Icon Button ───
  const IconButton = ({
    onClick,
    active,
    label,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    label: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`
        w-9 h-9 sm:w-10 sm:h-10
        flex items-center justify-center
        rounded-[var(--radius-md)]
        text-[var(--text-secondary)]
        hover:bg-[var(--surface-2)]
        hover:text-[var(--brand-primary)]
        transition-[opacity,transform,box-shadow] duration-200
        ${active ? 'bg-[var(--surface-2)] text-[var(--brand-primary)]' : ''}
      `}
      aria-label={label}
    >
      {children}
    </button>
  );

  return (
    <>
      <JoinCompanyModal
        isOpen={showJoinCompanyModal}
        onClose={() => setShowJoinCompanyModal(false)}
      />
      <nav className="sticky top-0 z-50 bg-[var(--surface-1)] border-b border-[var(--border-default)]">
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-10">
          <div className="flex items-center justify-between h-20 sm:h-24">

            {/* ═══ Logo + Join Company Button ═══ */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 group"
              >
                <BBLogo className="h-16 sm:h-20 lg:h-24 w-auto" />
                <span className="
                  hidden sm:inline
                  font-semibold
                  text-[var(--text-primary)]
                  group-hover:text-[var(--brand-primary)]
                  transition-colors
                  font-title
                  text-sm lg:text-base
                ">
                  ByteBattle
                </span>
              </Link>

              {/* Join Company Button — desktop only, logged-in users without company */}
              {loggedIn && isUser && !user?.companyRole && (
                <button
                  onClick={() => setShowJoinCompanyModal(true)}
                  className="
                    flex items-center gap-1.5
                    px-3 py-1.5
                    text-xs font-semibold
                    rounded-[var(--radius-md)]
                    border border-[var(--brand-primary)]/40
                    text-[var(--brand-primary)]
                    hover:bg-[var(--brand-primary)]/10
                    transition-colors duration-150
                  "
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Join Company
                </button>
              )}
            </div>

            {/* ═══ Desktop Navigation (lg+) ═══ */}
            {loggedIn && activeLinks.length > 0 && (
              <div className="hidden lg:flex items-center gap-1 mx-4">
                {activeLinks.map((link) => (
                  <DesktopNavLink key={link.onClick ? 'join-company' : link.to} {...link} />
                ))}
              </div>
            )}

            {/* ═══ Right Actions ═══ */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">

              {activeCompanyMembership?.company?.name && (
                <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-semibold">
                  <Building2 className="w-3.5 h-3.5" />
                  Member of {activeCompanyMembership.company.name}
                </div>
              )}

              {/* Language Switcher - hidden on very small screens */}
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>

              {/* Font Size Toggle */}
              <div className="relative hidden sm:block" ref={fontSizePanelRef}>
                <IconButton
                  onClick={() => {
                    setShowFontSizePanel(!showFontSizePanel);
                    setShowUserMenu(false);
                  }}
                  active={showFontSizePanel}
                  label="Adjust font size"
                >
                  <Type className="w-10 h-7 sm:w-6 sm:h-6" />
                </IconButton>

                {/* Font Size Dropdown */}
                {showFontSizePanel && (
                  <div className="
                    absolute top-full right-0 mt-2
                    w-56 sm:w-64
                    bg-[var(--surface-1)]
                    border border-[var(--border-default)]
                    rounded-[var(--radius-lg)]
                    shadow-xl
                    p-3 sm:p-4
                    space-y-3
                    z-50
                    animate-in fade-in slide-in-from-top-2 duration-200
                  ">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        Font Size
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
                        {fontSize}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--text-muted)]">A</span>
                      <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full relative">
                        <div
                          className="h-full bg-[var(--brand-primary)] rounded-full transition-all duration-200"
                          style={{ width: `${((fontSize - 75) / 75) * 100}%` }}
                        />
                      </div>
                      <span className="text-base font-medium text-[var(--text-primary)]">A</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-default)]">
                      <button
                        onClick={() => setFontSize(fontSize - 5)}
                        disabled={fontSize <= 75}
                        className="
                          flex-1 px-3 py-2
                          text-sm font-medium
                          bg-[var(--surface-2)]
                          hover:bg-[var(--surface-3)]
                          disabled:opacity-40 disabled:cursor-not-allowed
                          rounded-[var(--radius-md)]
                          text-[var(--text-primary)]
                          transition-colors
                          active:scale-95
                        "
                      >
                        −
                      </button>
                      <button
                        onClick={() => setFontSize(100)}
                        className="
                          flex-1 px-3 py-2
                          text-xs font-medium
                          bg-[var(--surface-2)]
                          hover:bg-[var(--surface-3)]
                          rounded-[var(--radius-md)]
                          text-[var(--text-primary)]
                          transition-colors
                          active:scale-95
                        "
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setFontSize(fontSize + 5)}
                        disabled={fontSize >= 150}
                        className="
                          flex-1 px-3 py-2
                          text-sm font-medium
                          bg-[var(--surface-2)]
                          hover:bg-[var(--surface-3)]
                          disabled:opacity-40 disabled:cursor-not-allowed
                          rounded-[var(--radius-md)]
                          text-[var(--text-primary)]
                          transition-colors
                          active:scale-95
                        "
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Search */}
              <div className="hidden sm:block">
                <UserSearchBar />
              </div>

              {/* Theme Toggle */}
              <IconButton onClick={toggleColorScheme} label="Toggle theme">
                {colorScheme === 'dark' ? (
                  <Sun className="w-10 h-7 sm:w-6 sm:h-6" />
                ) : (
                  <Moon className="w-10 h-7 sm:w-6 sm:h-6" />
                )}
              </IconButton>

              {/* Notification Bell — only when logged in */}
              {loggedIn && <NotificationBell />}

              {/* User Menu / Auth Buttons */}
              {loggedIn ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowFontSizePanel(false);
                    }}
                    className="
                      flex items-center gap-2
                      p-1 rounded-full
                      hover:ring-2 hover:ring-[var(--brand-primary)]/50
                      transition-all duration-200
                    "
                  >
                    <img
                      src={displayAvatar}
                      alt={displayUsername}
                      referrerPolicy="no-referrer"
                      className="
                        w-8 h-8 sm:w-9 sm:h-9
                        rounded-full
                        border-2 border-[var(--brand-primary)]
                        object-cover
                        bg-[var(--surface-2)]
                      "
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUsername}`;
                      }}
                    />
                    <span className="hidden xl:block text-sm text-[var(--text-primary)] font-medium max-w-[100px] truncate">
                      {displayUsername}
                    </span>
                    <ChevronDown className={`
                      hidden xl:block w-3 h-3 text-[var(--text-muted)]
                      transition-transform duration-200
                      ${showUserMenu ? 'rotate-180' : ''}
                    `} />
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="
                      absolute top-full right-0 mt-2
                      w-56
                      bg-[var(--surface-1)]
                      border border-[var(--border-default)]
                      rounded-[var(--radius-lg)]
                      shadow-xl
                      py-2
                      z-50
                      animate-in fade-in slide-in-from-top-2 duration-200
                    ">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-[var(--border-default)]">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {displayUsername}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] capitalize">
                          {userRole}
                        </p>
                      </div>

                      {isUser && (
                        <>
                          <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <UserIcon className="w-10 h-7 text-[var(--text-secondary)]" />
                            <span>{t('nav.dashboard')}</span>
                          </Link>
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <UserIcon className="w-10 h-7 text-[var(--text-secondary)]" />
                            <span>{t('nav.profile')}</span>
                          </Link>
                          <Link
                            to="/settings"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <SettingsIcon className="w-10 h-7 text-[var(--text-secondary)]" />
                            <span>{t('nav.settings')}</span>
                          </Link>
                        </>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Shield className="w-10 h-7 text-[var(--text-secondary)]" />
                          <span>Admin Panel</span>
                        </Link>
                      )}

                      <div className="h-px bg-[var(--border-default)] my-1" />

                      <button
                        onClick={handleLogout}
                        className="
                          w-full flex items-center gap-3
                          px-4 py-2.5
                          text-sm text-[var(--state-error)]
                          hover:bg-[var(--state-error)]/10
                          transition-colors
                        "
                      >
                        <LogOut className="w-10 h-7" />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="md" className="text-xs sm:text-sm px-2 sm:px-4">
                      {t('nav.login')}
                    </Button>
                  </Link>
                  <Link to="/signup" className="hidden sm:block">
                    <Button variant="primary" size="md" className="text-xs sm:text-sm">
                      {t('nav.signup')}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button (visible < lg) */}
              {loggedIn && (
                <IconButton
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  <div className="lg:hidden">
                    {mobileMenuOpen ? (
                      <X className="w-10 h-7" />
                    ) : (
                      <Menu className="w-10 h-7" />
                    )}
                  </div>
                </IconButton>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ Mobile Menu Overlay ═══ */}
      {mobileMenuOpen && loggedIn && (
        <>
          {/* Backdrop */}
          <div
            className="
              fixed inset-0 z-40
              bg-black/50 backdrop-blur-sm
              lg:hidden
              animate-in fade-in duration-200
            "
            onClick={closeMobileMenu}
          />

          {/* Slide-in Panel */}
          <div
            ref={mobileMenuRef}
            className="
              fixed top-14 sm:top-16 right-0 bottom-0 z-50
              w-full sm:w-80
              bg-[var(--surface-1)]
              border-l border-[var(--border-default)]
              lg:hidden
              overflow-y-auto
              animate-in slide-in-from-right duration-300
            "
          >
            <div className="p-4 space-y-1">

              {/* Mobile-only: Language & Font Size */}
              <div className="sm:hidden flex items-center justify-between px-4 py-3 mb-2 bg-[var(--surface-2)] rounded-[var(--radius-lg)]">
                <LanguageSwitcher />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSize(fontSize - 5)}
                    disabled={fontSize <= 75}
                    className="
                      w-8 h-8
                      flex items-center justify-center
                      bg-[var(--surface-3)]
                      rounded-[var(--radius-md)]
                      text-[var(--text-primary)]
                      disabled:opacity-40
                      text-sm font-medium
                    "
                  >
                    −
                  </button>
                  <span className="text-xs text-[var(--text-secondary)] min-w-[36px] text-center">
                    {fontSize}%
                  </span>
                  <button
                    onClick={() => setFontSize(fontSize + 5)}
                    disabled={fontSize >= 150}
                    className="
                      w-8 h-8
                      flex items-center justify-center
                      bg-[var(--surface-3)]
                      rounded-[var(--radius-md)]
                      text-[var(--text-primary)]
                      disabled:opacity-40
                      text-sm font-medium
                    "
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Mobile search */}
              <div className="px-4 py-2">
                <UserSearchBar />
              </div>

              {/* Section Label */}
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {isAdmin ? 'Administration' : 'Navigation'}
                </p>
              </div>

              {/* Nav Links */}
              {activeLinks.map((link) => (
                <MobileNavLink key={link.onClick ? 'join-company' : link.to} {...link} />
              ))}

              {/* User Section */}
              {isUser && (
                <>
                  <div className="h-px bg-[var(--border-default)] my-3" />

                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Account
                    </p>
                  </div>

                  <MobileNavLink
                    to="/dashboard"
                    icon={<UserIcon className="w-10 h-7" />}
                    label={t('nav.dashboard')}
                  />
                  <MobileNavLink
                    to="/profile"
                    icon={<UserIcon className="w-10 h-7" />}
                    label={t('nav.profile')}
                  />
                  <MobileNavLink
                    to="/settings"
                    icon={<SettingsIcon className="w-10 h-7" />}
                    label={t('nav.settings')}
                  />
                  <MobileNavLink
                    to="/notifications"
                    icon={
                      <div className="relative">
                        <Bell className="w-10 h-7" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1rem] h-4 px-0.5 text-[10px] font-bold text-white bg-[var(--state-error)] rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    }
                    label="Notifications"
                  />

                  {/* Join Company — mobile (only if no company) */}
                  {!user?.companyRole && (
                    <MobileNavLink
                      to="/companies"
                      icon={<Building2 className="w-10 h-7" />}
                      label="Join Company"
                      onClick={() => setShowJoinCompanyModal(true)}
                    />
                  )}
                </>
              )}

              {/* Logout */}
              <div className="h-px bg-[var(--border-default)] my-3" />

              <button
                onClick={handleLogout}
                className="
                  w-full flex items-center gap-3
                  px-4 py-3
                  text-[var(--state-error)]
                  hover:bg-[var(--state-error)]/10
                  active:bg-[var(--state-error)]/20
                  rounded-[var(--radius-md)]
                  transition-colors
                "
              >
                <LogOut className="w-10 h-7" />
                <span className="font-medium">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}