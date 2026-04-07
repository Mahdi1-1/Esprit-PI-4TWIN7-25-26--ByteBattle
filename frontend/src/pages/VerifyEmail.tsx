import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { BBLogo } from '../components/BBLogo';
import { useAuth } from '../context/AuthContext';

export function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const runVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing verification token.');
        return;
      }

      try {
        await verifyEmail(token);
        setStatus('success');
        setMessage('Your email has been verified successfully. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } catch {
        setStatus('error');
        setMessage('Verification failed. The token may be expired or invalid.');
      }
    };

    runVerification();
  }, [token, navigate, verifyEmail]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <BBLogo className="h-14 w-auto" />
            <span className="text-h2 font-semibold text-[var(--text-primary)]">ByteBattle</span>
          </Link>

          <div className="p-8 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] text-center space-y-4">
            <h2 className="mb-2">Email verification</h2>
            <p className={status === 'success' ? 'text-green-500' : status === 'error' ? 'text-red-500' : 'text-[var(--text-secondary)]'}>
              {message}
            </p>

            {status === 'error' && (
              <Button type="button" variant="primary" size="lg" className="w-full" onClick={() => navigate('/login')}>
                Back to login
              </Button>
            )}

            {status !== 'error' && (
              <Link to="/login" className="text-[var(--brand-primary)] hover:underline font-medium">
                Go to login
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
