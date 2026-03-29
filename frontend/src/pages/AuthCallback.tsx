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
      // Optionnel : fetch /auth/me pour stocker l'utilisateur
      navigate('/dashboard');
    } else {
      navigate('/login?error=authentication_failed');
    }
  }, [searchParams, navigate]);

  return <div>Connexion en cours...</div>;
}