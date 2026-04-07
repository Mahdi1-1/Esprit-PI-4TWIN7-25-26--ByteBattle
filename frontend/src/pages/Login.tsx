import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/Button';
import { Input, PasswordInput } from '../components/Input';
import { Github, AlertCircle } from 'lucide-react';
import { Layout } from '../components/Layout';
import { BBLogo } from '../components/BBLogo';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, resendVerificationEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationInfo, setVerificationInfo] = useState<string | null>(null);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const verificationParam = searchParams.get('verification');
    const emailParam = searchParams.get('email');

    if (verificationParam === 'required') {
      setError('Your account was created. Please verify your email before logging in.');
      setShowVerificationPrompt(true);

      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setVerificationInfo(null);
    setShowVerificationPrompt(false);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const rawMessage = err?.response?.data?.message || err?.message || 'Email or password is incorrect.';
      const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : String(rawMessage);
      const normalized = message.toLowerCase();

      if (
        normalized.includes('verify your email') ||
        normalized.includes('verification link') ||
        normalized.includes('not verified')
      ) {
        setError('Please verify your email before logging in. Check your inbox for the verification link.');
        setShowVerificationPrompt(true);
      } else if (normalized.includes('google sign-in')) {
        setError('This account uses Google Sign-In. Please sign in with Google.');
      } else if (normalized.includes('suspended')) {
        setError('Your account has been suspended. Contact support.');
      } else if (normalized.includes('banned')) {
        setError('Your account has been banned. Contact support.');
      } else {
        setError('Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError('Enter your email to resend the verification link.');
      return;
    }

    setResendLoading(true);
    setVerificationInfo(null);

    try {
      await resendVerificationEmail(email.trim());
      setVerificationInfo('If an account exists and is not yet verified, a new verification email has been sent.');
    } catch {
      setVerificationInfo('Something went wrong. Please try again in a moment.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <BBLogo className="h-14 w-auto" />
            <span className="text-h2 font-semibold text-[var(--text-primary)]">
              ByteBattle
            </span>
          </Link>

          {/* Card */}
          <div className="p-8 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
            <div className="text-center mb-8">
                <h2 className="mb-2">Welcome</h2>
              <p className="text-[var(--text-secondary)]">
                  Sign in to continue
              </p>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <Button variant="secondary" size="lg" className="w-full">
                <Github className="w-5 h-5" />
                Continue with GitHub
              </Button>
              <Button variant="secondary" size="lg" className="w-full">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-default)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[var(--surface-1)] text-caption text-[var(--text-muted)]">
                  or with email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <PasswordInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="flex items-center justify-between text-caption">
                <label className="flex items-center gap-2 text-[var(--text-secondary)] cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  Remember me
                </label>
                <a href="/forgot-password" className="text-[var(--brand-primary)] hover:underline">
                  Forgot password?
                </a>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-sm)] px-3 py-2">
                  <span className="inline-flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </span>
                </p>
              )}

              {showVerificationPrompt && (
                <div className="space-y-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-sky-100">Need a new verification email?</p>
                    <p className="text-sm text-sky-100/80">
                      Resend the link to your inbox and verify your account before logging in.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading || isLoading}
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold border border-sky-300/40 text-sky-50 bg-sky-400/10 hover:bg-sky-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? 'Sending...' : 'Resend verification email'}
                  </button>
                  {verificationInfo && (
                    <p className="text-xs text-sky-100/85">{verificationInfo}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={isLoading}
              >
                Sign In
              </Button>
            </form>
          </div>

          {/* Sign up link */}
          <p className="mt-6 text-center text-[var(--text-secondary)]">
            Don\'t have an account?{' '}
            <Link to="/signup" className="text-[var(--brand-primary)] hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}