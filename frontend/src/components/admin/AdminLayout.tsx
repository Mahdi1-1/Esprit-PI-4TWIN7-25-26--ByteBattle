import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Users,
  Code2,
  PenTool,
  FileText,
  Upload,
  ListChecks,
  Swords,
  Trophy,
  Award,
  Flag,
  Shield,
  Activity,
  Brain,
  ToggleLeft,
  CreditCard,
  FileCheck,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: number;
  divider?: boolean;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin' },
  { id: 'users', label: 'Users', icon: Users, href: '/admin/users', divider: true },
  { id: 'problems', label: 'Problems', icon: Code2, href: '/admin/problems' },
  { id: 'canvas', label: 'Canvas Challenges', icon: PenTool, href: '/admin/canvas-challenges' },
  { id: 'testcases', label: 'Testcases & Assets', icon: Upload, href: '/admin/testcases', divider: true },
  { id: 'submissions', label: 'Submissions', icon: ListChecks, href: '/admin/submissions' },
  { id: 'duels', label: 'Duels / Rooms', icon: Swords, href: '/admin/duels' },
  { id: 'hackathons', label: 'Hackathons', icon: Trophy, href: '/admin/hackathons' },
  { id: 'leaderboard', label: 'Leaderboards', icon: Award, href: '/admin/leaderboards', divider: true },
  { id: 'reports', label: 'Reports', icon: Flag, href: '/admin/reports', badge: 3 },
  { id: 'anticheat', label: 'Anti-cheat', icon: Shield, href: '/admin/anticheat', divider: true },
  { id: 'monitoring', label: 'Monitoring', icon: Activity, href: '/admin/monitoring' },
  { id: 'ai', label: 'AI Settings', icon: Brain, href: '/admin/ai-settings' },
  { id: 'features', label: 'Feature Flags', icon: ToggleLeft, href: '/admin/feature-flags' },
  { id: 'billing', label: 'Billing', icon: CreditCard, href: '/admin/billing', divider: true },
  { id: 'audit', label: 'Audit Logs', icon: FileCheck, href: '/admin/audit-logs' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings' }
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Sidebar Desktop */}
      <aside
        className={`
          hidden lg:flex flex-col
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
          bg-[var(--surface-1)]
          border-r border-[var(--border-default)]
          transition-all duration-200
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border-default)]">
          {!sidebarCollapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded flex items-center justify-center">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-[var(--text-primary)]">Admin</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 hover:bg-[var(--surface-2)] rounded transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                {item.divider && (
                  <div className="h-px bg-[var(--border-default)] my-2 mx-4" />
                )}
                <Link
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative
                    ${isActive(item.href)
                      ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="text-[0.875rem] font-medium truncate">
                      {item.label}
                    </span>
                  )}
                  {!sidebarCollapsed && item.badge && (
                    <span className="absolute right-2 px-1.5 py-0.5 text-xs font-bold text-white bg-[var(--brand-primary)] rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">SA</span>
            </div>
            <div className="hidden lg:block">
              <div className="text-sm font-medium text-[var(--text-primary)]">SysAdmin</div>
              <div className="text-xs text-[var(--text-muted)]">Super Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-[var(--surface-1)] border-b border-[var(--border-default)] flex items-center justify-between px-4 lg:px-6">
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-[var(--surface-2)] rounded"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg min-w-[300px]">
              <Search className="w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search users, problems, submissions..."
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
              />
              <kbd className="px-1.5 py-0.5 text-xs bg-[var(--surface-1)] border border-[var(--border-default)] rounded">
                ⌘K
              </kbd>
            </div>
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded-lg"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleColorScheme}
              className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              {colorScheme === 'dark' ? (
                <Sun className="w-5 h-5 text-[var(--text-secondary)]" />
              ) : (
                <Moon className="w-5 h-5 text-[var(--text-secondary)]" />
              )}
            </button>

            {/* Admin Profile */}
            <div className="flex items-center gap-2 pl-3 border-l border-[var(--border-default)]">
              <div className="relative">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 hover:bg-[var(--surface-2)] px-2 py-1 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">SA</span>
                  </div>
                  <ChevronLeft 
                    className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${
                      isProfileMenuOpen ? '-rotate-90' : 'rotate-270'
                    }`} 
                  />
                </button>
                
                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg shadow-xl 
                                  animate-in fade-in zoom-in-95 duration-200 z-[100] transform origin-top-right">
                    
                    <div className="px-4 py-3 border-b border-[var(--border-default)]">
                      <div className="font-medium text-[var(--text-primary)] leading-none mb-1">SysAdmin</div>
                      <div className="text-xs text-[var(--text-muted)] truncate">admin@bytebattle.com</div>
                    </div>

                    <div className="py-1">
                      <Link 
                        to="/admin/settings" 
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsProfileMenuOpen(false);
                          console.log('Logging out..');
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--state-error)] hover:bg-[var(--state-error)]/10 text-left transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute top-0 bottom-0 left-0 w-64 bg-[var(--surface-1)] border-r border-[var(--border-default)] shadow-xl flex flex-col animate-in slide-in-from-left duration-200">
              <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border-default)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-[var(--text-primary)]">Admin</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 hover:bg-[var(--surface-2)] rounded transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>
              
              <nav className="flex-1 overflow-y-auto p-2">
                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <li key={item.id}>
                      {item.divider && (
                        <div className="h-px bg-[var(--border-default)] my-2 mx-4" />
                      )}
                      <Link
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative
                          ${isActive(item.href)
                            ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
                          }
                        `}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-[0.875rem] font-medium truncate">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="absolute right-2 px-1.5 py-0.5 text-xs font-bold text-white bg-[var(--brand-primary)] rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Logout Button */}
              <div className="p-4 border-t border-[var(--border-default)]">
                <button
                  onClick={() => {
                    console.log('Logging out form mobile menu..');
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[var(--state-error)] hover:bg-[var(--state-error)]/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="text-[0.875rem] font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
