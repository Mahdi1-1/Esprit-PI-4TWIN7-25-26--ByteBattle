import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { Input, PasswordInput } from '../components/Input';
import { Code2, Github } from 'lucide-react';
import { Layout } from '../components/Layout';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-[var(--radius-md)] flex items-center justify-center glow">
              <Code2 className="w-7 h-7 text-[var(--bg-primary)]" />
            </div>
            <span className="text-h2 font-semibold text-[var(--text-primary)]">
              ByteBattle
            </span>
          </Link>

          {/* Card */}
          <div className="p-8 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
            <div className="text-center mb-8">
              <h2 className="mb-2">Bienvenue</h2>
              <p className="text-[var(--text-secondary)]">
                Connectez-vous pour continuer
              </p>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <Button variant="secondary" size="lg" className="w-full">
                <Github className="w-5 h-5" />
                Continuer avec GitHub
              </Button>
              <Button variant="secondary" size="lg" className="w-full">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuer avec Google
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-default)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[var(--surface-1)] text-caption text-[var(--text-muted)]">
                  ou avec email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <PasswordInput
                label="Mot de passe"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="flex items-center justify-between text-caption">
                <label className="flex items-center gap-2 text-[var(--text-secondary)] cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  Se souvenir de moi
                </label>
                <a href="#" className="text-[var(--brand-primary)] hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={isLoading}
              >
                Se Connecter
              </Button>
            </form>
          </div>

          {/* Sign up link */}
          <p className="mt-6 text-center text-[var(--text-secondary)]">
            Pas encore de compte ?{' '}
            <Link to="/signup" className="text-[var(--brand-primary)] hover:underline font-medium">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}