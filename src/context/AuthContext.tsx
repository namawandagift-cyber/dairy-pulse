import React, { createContext, useContext, useEffect, useState } from 'react';
import { Farm, User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  farm: Farm | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    farmName: string;
    farmLocation: string;
    farmPhone?: string;
    farmDescription?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshFarm: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Validate session on mount
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const existingToken = api.getToken();
      if (!existingToken) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const res = await api.validateSession();
        if (mounted) {
          setUser(res.user);
          setFarm(res.farm);
          setToken(existingToken);
        }
      } catch (err: any) {
        // If session is invalid or expired, clear it
        api.clearToken();
        if (mounted) {
          setUser(null);
          setFarm(null);
          setToken(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      setFarm(res.farm);
      setToken(res.token);
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    farmName: string;
    farmLocation: string;
    farmPhone?: string;
    farmDescription?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.register(data);
      setUser(res.user);
      setFarm(res.farm);
      setToken(res.token);
    } catch (err: any) {
      const msg = err.message || 'Account creation failed. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } finally {
      setUser(null);
      setFarm(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  const refreshFarm = async () => {
    try {
      const updatedFarm = await api.getFarmDetails();
      setFarm(updatedFarm);
    } catch (err) {
      // Non-fatal
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        farm,
        token,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshFarm,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
