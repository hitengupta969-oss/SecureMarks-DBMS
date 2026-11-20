import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  isAdmin: boolean;
  isFaculty: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('securemarks_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('securemarks_token');
      const storedUser = localStorage.getItem('securemarks_user');
      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Refresh user profile from backend
          const me = await api.getMe();
          setUser(me);
          localStorage.setItem('securemarks_user', JSON.stringify(me));
        } catch {
          // Token invalid
          localStorage.removeItem('securemarks_token');
          localStorage.removeItem('securemarks_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('securemarks_token', res.access_token);
    localStorage.setItem('securemarks_user', JSON.stringify(res.user));
  };

  const logout = () => {
    localStorage.removeItem('securemarks_token');
    localStorage.removeItem('securemarks_user');
    setUser(null);
    setToken(null);
  };

  const switchRole = async (role: UserRole) => {
    let email = 'admin@securemarks.edu';
    let password = 'Admin@123';
    if (role === 'faculty') {
      email = 'faculty.sharma@securemarks.edu';
      password = 'Faculty@123';
    } else if (role === 'student') {
      email = 'aarav.patel@student.securemarks.edu';
      password = 'Student@123';
    }
    await login(email, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        switchRole,
        isAdmin: user?.role === 'admin',
        isFaculty: user?.role === 'faculty',
        isStudent: user?.role === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
