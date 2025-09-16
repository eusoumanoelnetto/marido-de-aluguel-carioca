import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, SignUpData } from '../../types';
import * as api from '../../services/apiService';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  // now returns the user on success, null on failure
  login: (email: string, password?: string) => Promise<User | null>;
  signUp: (data: SignUpData) => Promise<User | null>;
  logout: () => void;
  updateUser: (u: User) => Promise<User | null>;
}

export const AuthContext = createContext(null as any);

export const AuthProvider = ({ children }: { children: any }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('mdac_user');
      return raw ? JSON.parse(raw) as User : null;
    } catch {
      return null;
    }
  });

  const [authError, setAuthError] = useState(null as string | null);
  const isAuthenticated = !!user;
  const navigate = useNavigate();

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

  useEffect(() => {
    if (authError === 'Usuário não existe mais.' || authError === 'Conta excluída. Entre em contato com o suporte.') {
      window.location.href = '/conta-excluida.html';
    }
  }, [authError]);

  const login = async (email: string, password?: string) => {
    const u = await api.login(email, password);
    if (u) {
      setUser(u);
      return u;
    }
    return null;
  };

  const signUp = async (data: SignUpData) => {
    try {
      const u = await api.signUp(data);
      setUser(u);
      return u;
    } catch (err: any) {
      // Re-lança erro para camada superior poder mostrar mensagem específica (ex: 409 e-mail já cadastrado)
      throw err;
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
