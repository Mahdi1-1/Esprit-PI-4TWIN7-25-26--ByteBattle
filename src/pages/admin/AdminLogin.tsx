import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Code2, Mail, Lock, AlertCircle } from 'lucide-react';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Mock login
    setTimeout(() => {
      if (email === 'admin@bytebattle.dev' && password === 'admin123') {
        navigate('/admin');
      } else {
        setError('Invalid credentials. Try admin@bytebattle.dev / admin123');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-xl mb-4">
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">ByteBattle Admin</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Sign in to access the admin panel
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
                  placeholder="admin@bytebattle.dev"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* SSO Option */}
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

          <button
            disabled
            className="w-full px-4 py-2 border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SSO Login (Coming Soon)
          </button>
        </div>

        {/* Demo Credentials */}
        <div className="text-center text-xs text-[var(--text-muted)]">
          <p>Demo: admin@bytebattle.dev / admin123</p>
        </div>
      </div>
    </div>
  );
}
