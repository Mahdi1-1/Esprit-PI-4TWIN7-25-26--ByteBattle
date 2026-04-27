import { useState, useEffect } from 'react';
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { BBLogo } from '../components/BBLogo';
import { useAuth } from '../context/AuthContext';

export function UnifiedLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const metaEnv = (import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }).env;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle OAuth errors from query params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        authentication_failed: 'Google sign-in failed. Please try again.',
        access_denied: 'You denied access to your Google account.',
        server_error: 'A server error occurred. Please try again.',
        invalid_credentials: 'Invalid credentials.',
      };
      setError(errorMessages[errorParam] || 'An error occurred while signing in.');

      // Clear the error query param from the URL after 5 seconds
      setTimeout(() => {
        setError('');
        navigate('/login', { replace: true });
      }, 5000);
    }
  }, [searchParams, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);

    try {
      // Use login method from AuthContext
      await login(email, password);

      // Redirect is handled in AuthContext, but we also guard by role here
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);

      // Handle different error types
      const errorMessage = err.response?.data?.message || err.message;

      if (errorMessage.includes('Google Sign-In')) {
        setError('This account uses Google Sign-In. Please sign in with Google.');
      } else if (errorMessage.includes('suspended')) {
        setError('Your account has been suspended. Contact support.');
      } else if (errorMessage.includes('banned')) {
        setError('Your account has been banned. Contact support.');
      } else {
        setError('Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✨ Fonction pour initier le login Google
  const handleGoogleSignIn = () => {
    setError('');

    // Récupérer l'URL du backend depuis les variables d'environnement
    const backendUrl = (metaEnv?.VITE_API_URL as string) || 'http://localhost:4001';

    // Rediriger vers l'endpoint OAuth du backend
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <BBLogo className="h-16 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">ByteBattle</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-500 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* OAuth Buttons en premier (meilleure UX) */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[var(--border-default)] rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Continuer avec Google</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-default)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[var(--surface-1)] text-[var(--text-muted)]">
                or with your email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--text-primary)]"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brand-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--text-primary)]"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brand-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-[var(--border-default)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                />
                <span className="text-[var(--text-secondary)]">Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="text-[var(--brand-primary)] hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="text-center text-sm text-[var(--text-secondary)]">
          Don't have an account?{' '}
          <a
            href="/signup"
            className="text-[var(--brand-primary)] hover:underline font-medium"
          >
            Create an account
          </a>
        </div>

        {/* Demo Accounts Info (development only) */}
        {Boolean(metaEnv?.DEV) && (
          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4">
            <p className="text-xs text-[var(--text-muted)] mb-2 font-medium">
              🔧 Test accounts (development)
            </p>
            <div className="space-y-1 text-xs text-[var(--text-secondary)]">
              <p>• user@bytebattle.dev / demo123 (User)</p>
              <p>• admin@bytebattle.dev / admin123 (Admin)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}