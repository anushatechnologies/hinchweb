import { create } from 'zustand';
import type { Cart, Product } from '../types';
import { cartApi } from '../api/cartApi';

interface CartState {
  cart: Cart;
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  fetchCart: () => Promise<void>;
  addItem: (product: Product, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
}

const initialCart: Cart = {
  id: 'cart_current',
  items: [],
  subtotal: 0,
  gstTotal: 0,
  deliveryTotal: 0,
  discountTotal: 0,
  grandTotal: 0,
  estimatedDeliveryDays: 2,
};

export const useCartStore = create<CartState>((set) => ({
  cart: initialCart,
  isLoading: false,
  isOpen: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await cartApi.getCart();
      set({ cart, isLoading: false });
    } catch (error) {
      console.warn('Failed to fetch cart:', error);
      set({ isLoading: false });
    }
  },

  addItem: async (product: Product, quantity: number) => {
    set({ isLoading: true });
    try {
      const updatedCart = await cartApi.addToCart({
        productId: product.id,
        quantity: Math.max(product.moq || 1, quantity),
      });
      set({ cart: updatedCart, isLoading: false, isOpen: true });
    } catch (error) {
      console.warn('Failed to add item to backend cart:', error);
      set({ isLoading: false });
    }
  },

  updateQuantity: async (productId: string, quantity: number) => {
    set({ isLoading: true });
    try {
      const updatedCart = await cartApi.addToCart({
        productId,
        quantity,
      });
      set({ cart: updatedCart, isLoading: false });
    } catch (error) {
      console.warn('Failed to update cart item quantity:', error);
      set({ isLoading: false });
    }
  },

  removeItem: async (productId: string) => {
    set({ isLoading: true });
    try {
      const updatedCart = await cartApi.removeItem(productId);
      set({ cart: updatedCart, isLoading: false });
    } catch (error) {
      console.warn('Failed to remove item from backend cart:', error);
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    set({ isLoading: true });
    try {
      const emptyCart = await cartApi.clearCart();
      set({ cart: emptyCart, isLoading: false });
    } catch (error) {
      console.warn('Failed to clear backend cart:', error);
      set({ cart: initialCart, isLoading: false });
    }
  },

  applyCoupon: async (couponCode: string) => {
    set({ isLoading: true });
    try {
      const res = await cartApi.applyCoupon(couponCode);
      if (res.success) {
        const cart = await cartApi.getCart();
        set({ cart, isLoading: false });
        return { success: true, message: res.message };
      }
      set({ isLoading: false });
      return { success: false, message: res.message };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, message: err.message || 'Failed to apply coupon' };
    }
  },
}));
