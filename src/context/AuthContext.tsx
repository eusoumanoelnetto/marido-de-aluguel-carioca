import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, SignUpData } from '../types';
import * as api from '../../services/apiService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  signUp: (data: SignUpData) => Promise<boolean>;
  logout: () => void;
  updateUser: (u: User) => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  signUp: async () => false,
  logout: () => {},
  updateUser: async () => null,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('mdac_user');
      return raw ? JSON.parse(raw) as User : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      localStorage.setItem('mdac_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mdac_user');
    }
  }, [user]);

  // Listen for global logout events (emitted by the API wrapper on 401 or expiry)
  useEffect(() => {
    const handler = () => {
      console.log('AuthContext: received global logout event');
      logout();
    };
    window.addEventListener('mdac:logout', handler as EventListener);
    return () => window.removeEventListener('mdac:logout', handler as EventListener);
  }, []);

  const login = async (email: string, password?: string) => {
    const u = await api.login(email, password);
    if (u) {
      setUser(u);
      return true;
    }
    return false;
  };

  const signUp = async (data: SignUpData) => {
    try {
      const u = await api.signUp(data);
      setUser(u);
      return true;
    } catch (err) {
      console.error('SignUp failed', err);
      return false;
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  const updateUser = async (u: User) => {
    try {
      const saved = await api.updateUser(u);
      setUser(saved);
      return saved;
    } catch (err) {
      console.error('updateUser failed', err);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signUp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
