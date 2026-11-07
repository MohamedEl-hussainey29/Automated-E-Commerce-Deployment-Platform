import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import type { AuthUserDto } from '../types/api';

interface AuthContextValue {
  user: AuthUserDto | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  isCustomer: boolean;
  selectedStoreId: string | null;
  setSelectedStoreId: (storeId: string | null) => void;
  gatewayOnline: boolean | null;
  checkGatewayHealth: () => Promise<void>;
  setSession: (user: AuthUserDto, accessToken: string, refreshToken?: string | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUserDto | null>(() => {
    const saved = localStorage.getItem('flora_user');
    const token = localStorage.getItem('flora_access_token');
    if (saved && token) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [selectedStoreId, setSelectedStoreIdState] = useState<string | null>(() => {
    return localStorage.getItem('flora_selected_store') || null;
  });

  const [gatewayOnline, setGatewayOnline] = useState<boolean | null>(null);

  const setSelectedStoreId = (storeId: string | null) => {
    setSelectedStoreIdState(storeId);
    if (storeId) {
      localStorage.setItem('flora_selected_store', storeId);
    } else {
      localStorage.removeItem('flora_selected_store');
    }
  };

  const checkGatewayHealth = async () => {
    try {
      const res = await fetch(`${api.getBaseUrl()}/api/catalog/categories?page=1&pageSize=1`, {
        method: 'GET',
      });
      setGatewayOnline(res.ok || res.status === 401 || res.status === 429);
    } catch {
      setGatewayOnline(false);
    }
  };

  useEffect(() => {
    checkGatewayHealth();
  }, []);

  const setSession = (u: AuthUserDto, accessToken: string, refreshToken?: string | null) => {
    api.setTokens(accessToken, refreshToken);
    localStorage.setItem('flora_user', JSON.stringify(u));
    setUser(u);
  };

  const logout = async () => {
    const rt = api.getRefreshToken();
    if (rt) {
      try {
        await api.logout(rt);
      } catch {
        // Ignore error if token already expired
      }
    }
    api.clearTokens();
    setUser(null);
  };

  const roles = (user?.roles || []).map((r) => r.toUpperCase());
  const isAdmin = roles.includes('ADMIN');
  const isDriver = roles.includes('DRIVER');
  const isCustomer = roles.includes('CUSTOMER');

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!api.getToken(),
        isAdmin,
        isDriver,
        isCustomer,
        selectedStoreId,
        setSelectedStoreId,
        gatewayOnline,
        checkGatewayHealth,
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
