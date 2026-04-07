import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { Input, PasswordInput } from '../components/Input';
import { Code2, Github, CheckCircle2 } from 'lucide-react';
import { BBLogo } from '../components/BBLogo';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name is required';
    }

    if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms of use';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await signup(formData.username, formData.email, formData.password, formData.firstName, formData.lastName);
      setIsLoading(false);
      navigate(`/login?verification=required&email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      setIsLoading(false);
      const status = error?.response?.status;
      const message: string = error?.response?.data?.message ?? '';

      if (status === 409) {
        // Determine which field(s) conflict
        const lowerMsg = message.toLowerCase();
        const newErrors: Record<string, string> = {};

        if (lowerMsg.includes('email')) {
          newErrors.email = 'This email is already in use.';
        } else if (lowerMsg.includes('username')) {
          newErrors.username = 'This username is already taken.';
        } else {
          // Both or unspecified — flag both fields
          newErrors.email = 'This email is already in use.';
          newErrors.username = 'This username is already taken.';
        }
        newErrors.submit = 'An account already exists with this information. Try signing in.';
        setErrors(newErrors);
      } else if (status === 400) {
        setErrors({ submit: 'Invalid data. Check your information and try again.' });
      } else {
        setErrors({ submit: 'An error occurred. Please try again.' });
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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
              <h2 className="mb-2">Create an account</h2>
              <p className="text-[var(--text-secondary)]">
                Join the ByteBattle community
              </p>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <Button variant="secondary" size="lg" className="w-full">
                <Github className="w-5 h-5" />
                Sign up with GitHub
              </Button>
              <Button variant="secondary" size="lg" className="w-full">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign up with Google
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
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  error={errors.firstName}
                  required
                />
                <Input
                  label="Last Name"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  error={errors.lastName}
                  required
                />
              </div>

              <Input
                label="Username"
                type="text"
                placeholder="johndoe"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                error={errors.username}
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="vous@exemple.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                required
              />

              <PasswordInput
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                hint="Minimum 8 characters"
                required
              />

              <PasswordInput
                label="Confirm password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                required
              />

              {/* Password Requirements */}
              <div className="p-3 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)]">
                <p className="text-caption font-medium text-[var(--text-secondary)] mb-2">
                  Your password must contain:
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-caption">
                    <CheckCircle2
                      className={`w-4 h-4 ${formData.password.length >= 8 ? 'text-[var(--status-success)]' : 'text-[var(--text-muted)]'}`}
                    />
                    <span className={formData.password.length >= 8 ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-caption">
                    <CheckCircle2
                      className={`w-4 h-4 ${/[A-Z]/.test(formData.password) ? 'text-[var(--status-success)]' : 'text-[var(--text-muted)]'}`}
                    />
                    <span className={/[A-Z]/.test(formData.password) ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-caption">
                    <CheckCircle2
                      className={`w-4 h-4 ${/[0-9]/.test(formData.password) ? 'text-[var(--status-success)]' : 'text-[var(--text-muted)]'}`}
                    />
                    <span className={/[0-9]/.test(formData.password) ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
                      One number
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <label className="flex items-start gap-3 text-caption cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (errors.terms) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.terms;
                        return newErrors;
                      });
                    }
                  }}
                />
                <span className="text-[var(--text-secondary)]">
                  I accept the{' '}
                  <a href="#" className="text-[var(--brand-primary)] hover:underline">
                    Terms of Use
                  </a>{' '}
                  and the{' '}
                  <a href="#" className="text-[var(--brand-primary)] hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.terms && (
                <p className="text-caption text-[var(--status-error)]">{errors.terms}</p>
              )}

              {errors.submit && (
                <div className="p-3 bg-[var(--status-error-bg)] border border-[var(--status-error)] rounded-[var(--radius-md)]">
                  <p className="text-caption text-[var(--status-error)]">{errors.submit}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={isLoading}
              >
                Create my account
              </Button>
            </form>
          </div>

          {/* Login link */}
          <p className="mt-6 text-center text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--brand-primary)] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
