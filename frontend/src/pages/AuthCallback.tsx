// frontend/src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      // Force full reload so AuthProvider re-runs token bootstrap (/auth/me).
      window.location.replace('/dashboard');
    } else {
      navigate('/login?error=authentication_failed');
    }
  }, [searchParams, navigate]);

  return <div className="p-6 text-center">Signing in with Google...</div>;
}