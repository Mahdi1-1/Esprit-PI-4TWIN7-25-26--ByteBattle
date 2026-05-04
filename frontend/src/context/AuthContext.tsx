import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/axios';
import { User } from '../data/models';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  authStatus: 'checking' | 'authenticated' | 'anonymous';
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isLoading: boolean;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'anonymous'>(() =>
    localStorage.getItem('token') ? 'checking' : 'anonymous'
  );
  const isLoading = authStatus === 'checking';

  // Global event listener for profile updates (like avatar creation)
  useEffect(() => {
    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && user) {
        setUser({
          ...user,
          // Replace or merge updated fields from detail
          ...customEvent.detail
        });
      }
    };

    // Listen for custom event 'user-profile-updated'
    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate);
  }, [user]);

  // Check token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setAuthStatus('anonymous');
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
        setIsAuthenticated(true);
        setAuthStatus('authenticated');
      } catch (error: any) {
        console.error('Auth check failed:', error);
        // Keep auth state deterministic in production.
        // Invalid/expired token is cleared, network errors fall back to anonymous.
        if (error?.response?.status === 401) {
          localStorage.removeItem('token');
        }
        setIsAuthenticated(false);
        setUser(null);
        setAuthStatus('anonymous');
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, access_token } = response.data;
      const token = accessToken || access_token;

      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      setAuthStatus('authenticated');
      // Always fetch full profile so profileImage and all fields are present
      const profile = await api.get('/auth/me');
      setUser(profile.data);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (username: string, email: string, password: string, firstName: string, lastName: string) => {
    try {
      await api.post('/auth/register', { username, email, password, firstName, lastName });
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      setAuthStatus('anonymous');
    } catch (error: any) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthContext: logout called');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setAuthStatus('anonymous');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
      // Dispatch custom event for components listening to profile updates
      window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: data }));
    }
  };

  const verifyEmail = async (token: string) => {
    const response = await api.post('/auth/verify-email', { token });
    console.log('Email verified:', response.data);
  };

  const resendVerificationEmail = async (email: string) => {
    const response = await api.post('/auth/resend-verification', { email });
    console.log('Verification email resent:', response.data);
  };

  const forgotPassword = async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    console.log('Password reset email sent:', response.data);
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    console.log('Password reset successful:', response.data);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, authStatus, login, signup, logout, updateUser, isLoading, verifyEmail, resendVerificationEmail, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
