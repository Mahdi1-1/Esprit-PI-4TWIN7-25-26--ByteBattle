import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/axios';
import { User } from '../data/models';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      if (token) {
        try {
          // Verify token validity
          console.log('Checking auth with token:', token.substring(0, 10) + '...');
          const response = await api.get('/auth/me');
          console.log('Auth check success:', response.data);
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          // Only remove token if it's an auth error (401), not network error
          if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
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
      const response = await api.post('/auth/register', { username, email, password, firstName, lastName });
      const { accessToken, access_token } = response.data;
      const token = accessToken || access_token;

      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      // Always fetch full profile after signup
      const profile = await api.get('/auth/me');
      setUser(profile.data);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthContext: logout called');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
      // Dispatch custom event for components listening to profile updates
      window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: data }));
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, signup, logout, updateUser, isLoading }}>
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
