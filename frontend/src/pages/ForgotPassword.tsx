import React, { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Layout } from '../components/Layout';
import { BBLogo } from '../components/BBLogo';
import { useAuth } from '../context/AuthContext';

export function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email is required.');
      setMessage(null);
      setError(null);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      setMessage(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setError(null);
    setEmailError(null);

    try {
      await forgotPassword(trimmedEmail);
      setMessage('If an account exists, a password reset link has been sent to your email.');
    } catch {
      setError('Something went wrong. Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <BBLogo className="h-14 w-auto" />
            <span className="text-h2 font-semibold text-[var(--text-primary)]">ByteBattle</span>
          </Link>

          <div className="p-8 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
            <div className="text-center mb-8">
              <h2 className="mb-2">Forgot your password?</h2>
              <p className="text-[var(--text-secondary)]">
                Enter your email and we will send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                error={emailError ?? undefined}
              />

              {message && (
                <p className="text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-[var(--radius-sm)] px-3 py-2">
                  {message}
                </p>
              )}

              {error && (
                <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-sm)] px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full" loading={isLoading}>
                Send reset link
              </Button>
            </form>

            <p className="mt-6 text-center text-[var(--text-secondary)]">
              Back to login?{' '}
              <Link to="/login" className="text-[var(--brand-primary)] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
