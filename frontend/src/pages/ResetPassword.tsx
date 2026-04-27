import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/Button';
import { PasswordInput } from '../components/Input';
import { Layout } from '../components/Layout';
import { BBLogo } from '../components/BBLogo';
import { useAuth } from '../context/AuthContext';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    if (!token) {
      setError('Invalid or missing reset token.');
      setIsLoading(false);
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Both password fields are required.');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(token, newPassword);
      setMessage('Your password has been reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
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
              <h2 className="mb-2">Reset your password</h2>
              <p className="text-[var(--text-secondary)]">
                Choose a new password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <PasswordInput
                label="New password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <PasswordInput
                label="Confirm new password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
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
                Reset password
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
