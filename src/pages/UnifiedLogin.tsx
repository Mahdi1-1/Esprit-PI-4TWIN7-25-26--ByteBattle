import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Code2, Mail, Lock, Github, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../data/models';

export function UnifiedLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Mock login
    setTimeout(async () => {
      // Simulate role detection
      const isAdmin = email.includes('admin') || email.includes('mod') || email.includes('mentor') || email.includes('enterprise');
      
      if (password === 'demo123' || password === 'admin123') {
        // Use AuthContext login
        await login(email, password);
        
        // Redirect based on role
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('Invalid credentials. Use demo123 or admin123');
        setLoading(false);
      }
    }, 1000);
  };

  const handleQuickLogin = async (role: UserRole) => {
    setLoading(true);
    setTimeout(async () => {
      // Use AuthContext login with mock credentials
      await login('user@bytebattle.dev', 'demo123');
      
      if (role === 'USER') {
        navigate('/dashboard');
      } else {
        navigate('/admin');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-xl mb-4">
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">ByteBattle</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-500">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brand-primary)] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brand-primary)] transition-colors"
                />
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-[var(--text-secondary)]">Remember me</span>
              </label>
              <a href="#" className="text-[var(--brand-primary)] hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* OAuth Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-default)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[var(--surface-1)] text-[var(--text-muted)]">
                or continue with
              </span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled
              className="flex items-center justify-center gap-2 px-4 py-2 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Github className="w-4 h-4" />
              GitHub
            </button>
            <button
              disabled
              className="flex items-center justify-center gap-2 px-4 py-2 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>
        </div>

        {/* Quick Login (Prototype Only) */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="text-xs font-semibold text-blue-500 mb-3 uppercase tracking-wide">
            Quick Login (Prototype)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('USER')}
              disabled={loading}
              className="px-3 py-2 bg-[var(--brand-primary)] text-white rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Login as USER
            </button>
            <button
              onClick={() => handleQuickLogin('ADMIN')}
              disabled={loading}
              className="px-3 py-2 bg-purple-500 text-white rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Login as ADMIN
            </button>
          </div>
          <div className="mt-3 text-xs text-[var(--text-muted)]">
            <p className="mb-1">Or use credentials:</p>
            <p>User: user@bytebattle.dev / demo123</p>
            <p>Admin: admin@bytebattle.dev / admin123</p>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center text-sm text-[var(--text-secondary)]">
          Don't have an account?{' '}
          <a href="/signup" className="text-[var(--brand-primary)] hover:underline font-medium">
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}