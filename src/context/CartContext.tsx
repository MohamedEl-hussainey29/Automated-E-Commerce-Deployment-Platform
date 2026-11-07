import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import type { CartDto } from '../types/api';

interface CartContextValue {
  cart: CartDto | null;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearLocalCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isCustomer } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartDto | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || !isCustomer) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getCart();
      setCart(res.data || null);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isCustomer]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!isAuthenticated) {
      toast('Sign In Required', 'Please sign in with a Customer account to add items to your cart.', 'info');
      return;
    }
    setLoading(true);
    try {
      await api.addCartItem(productId, quantity);
      await refreshCart();
      toast('Added to Basket', 'Item added to your cart on AddressCartService');
    } catch (err: any) {
      toast('Failed to add to cart', err.message || 'Could not add item to cart', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(itemId);
    }
    setLoading(true);
    try {
      const res = await api.updateCartItemQuantity(itemId, quantity);
      if (res.data) setCart(res.data);
      toast('Cart Updated', `Quantity updated to ${quantity}`);
    } catch (err: any) {
      toast('Update failed', err.message || 'Could not update item quantity', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoading(true);
    try {
      const res = await api.removeCartItem(itemId);
      if (res.data) setCart(res.data);
      toast('Item Removed', 'Removed from your cart');
    } catch (err: any) {
      toast('Remove failed', err.message || 'Could not remove item from cart', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearLocalCart = () => {
    setCart(null);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearLocalCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
