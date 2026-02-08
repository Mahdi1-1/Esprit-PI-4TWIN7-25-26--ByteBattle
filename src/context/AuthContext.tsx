import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockUser } from '../data/mockData';

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  elo: number;
  level: number;
  currentXP: number;
  maxXP: number;
  skills: Record<string, number>;
  badges: Array<{
    name: string;
    description: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('bytebattle_auth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      setUser(mockUser);
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in production, this would call an API
    // For now, accept any email/password combination
    setIsAuthenticated(true);
    setUser(mockUser);
    localStorage.setItem('bytebattle_auth', 'true');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('bytebattle_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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
