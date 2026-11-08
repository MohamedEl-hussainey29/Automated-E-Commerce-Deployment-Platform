import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { AuthUserDto, AddressDto } from '../types/api';

interface AuthContextValue {
  user: AuthUserDto | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  isCustomer: boolean;
  selectedStoreId: string | null;
  setSelectedStoreId: (storeId: string | null) => void;
  selectedAddress: AddressDto | null;
  setSelectedAddress: (addr: AddressDto | null) => void;
  userAddresses: AddressDto[];
  refreshAddresses: () => Promise<AddressDto[]>;
  selectAddress: (addr: AddressDto | null) => Promise<void>;
  isAddressModalOpen: boolean;
  setIsAddressModalOpen: (open: boolean) => void;
  openAddressModal: () => void;
  closeAddressModal: () => void;
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

  const [selectedAddress, setSelectedAddressState] = useState<AddressDto | null>(() => {
    const saved = localStorage.getItem('flora_selected_address');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [userAddresses, setUserAddresses] = useState<AddressDto[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [gatewayOnline, setGatewayOnline] = useState<boolean | null>(null);

  const openAddressModal = () => setIsAddressModalOpen(true);
  const closeAddressModal = () => setIsAddressModalOpen(false);

  const setSelectedStoreId = (storeId: string | null) => {
    setSelectedStoreIdState(storeId);
    if (storeId) {
      localStorage.setItem('flora_selected_store', storeId);
    } else {
      localStorage.removeItem('flora_selected_store');
    }
  };

  const setSelectedAddress = (addr: AddressDto | null) => {
    setSelectedAddressState(addr);
    if (addr) {
      localStorage.setItem('flora_selected_address', JSON.stringify(addr));
    } else {
      localStorage.removeItem('flora_selected_address');
    }
  };

  const selectAddress = async (addr: AddressDto | null) => {
    setSelectedAddress(addr);
    if (!addr) {
      setSelectedStoreId(null);
      return;
    }
    if (addr.storeId) {
      setSelectedStoreId(addr.storeId);
      return;
    }
    try {
      const res = await api.resolveStore({ addressId: addr.id });
      if (res.data?.isServiceable && res.data.storeId) {
        setSelectedStoreId(res.data.storeId);
      }
    } catch {
      // Keep store or fallback
    }
  };

  const refreshAddresses = useCallback(async (): Promise<AddressDto[]> => {
    if (!api.getToken()) {
      setUserAddresses([]);
      return [];
    }
    try {
      const res = await api.getAddresses();
      const list = res.data || [];
      setUserAddresses(list);

      setSelectedAddressState((prev) => {
        if (prev) {
          const match = list.find((a: AddressDto) => a.id === prev.id);
          if (match) {
            localStorage.setItem('flora_selected_address', JSON.stringify(match));
            return match;
          }
        }
        const defaultOne = list.find((a: AddressDto) => a.isDefault) || list[0] || null;
        if (defaultOne) {
          localStorage.setItem('flora_selected_address', JSON.stringify(defaultOne));
        } else {
          localStorage.removeItem('flora_selected_address');
        }
        return defaultOne;
      });

      return list;
    } catch {
      return [];
    }
  }, []);

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

  const roles = (user?.roles || []).map((r) => r.toUpperCase());
  const isAdmin = roles.includes('ADMIN');
  const isDriver = roles.includes('DRIVER');
  const isCustomer = roles.includes('CUSTOMER');

  useEffect(() => {
    if (user && isCustomer) {
      refreshAddresses();
    } else {
      setUserAddresses([]);
    }
  }, [user, isCustomer, refreshAddresses]);

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
    setSelectedAddress(null);
    setUserAddresses([]);
    setUser(null);
  };

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
        selectedAddress,
        setSelectedAddress,
        userAddresses,
        refreshAddresses,
        selectAddress,
        isAddressModalOpen,
        setIsAddressModalOpen,
        openAddressModal,
        closeAddressModal,
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
