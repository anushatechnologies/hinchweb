import { create } from 'zustand';
import type { Cart, Product, StoreMismatchConflict } from '../types';
import { cartApi } from '../api/cartApi';

interface CartState {
  cart: Cart;
  isLoading: boolean;
  isOpen: boolean;
  storeMismatchConflict: StoreMismatchConflict | null;
  isStoreMismatchOpen: boolean;

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  fetchCart: () => Promise<void>;
  addItem: (product: Product, quantity: number) => Promise<void>;
  updateQuantity: (productId: string | number, quantity: number) => Promise<void>;
  removeItem: (productId: string | number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => Promise<void>;
  syncGuestCartWithBackend: () => Promise<void>;
  confirmSwitchStore: () => Promise<void>;
  closeStoreMismatch: () => void;
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

export const useCartStore = create<CartState>((set, get) => ({
  cart: initialCart,
  isLoading: false,
  isOpen: false,
  storeMismatchConflict: null,
  isStoreMismatchOpen: false,

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
      const updatedCart = await cartApi.addToCart(
        {
          productId: product.id,
          quantity: Math.max(product.moq || 1, quantity),
        },
        product
      );
      set({ cart: updatedCart, isLoading: false, isOpen: true });
    } catch (error: any) {
      if (
        error?.statusCode === 409 ||
        error?.status === 409 ||
        error?.error === 'STORE_MISMATCH' ||
        error?.data?.error === 'STORE_MISMATCH'
      ) {
        const conflictData: StoreMismatchConflict = {
          message:
            error?.message ||
            error?.data?.message ||
            'Your cart contains items from another store.',
          currentStore: error?.currentStore || error?.data?.currentStore || {
            id: get().cart.storeId || 1,
            name: get().cart.storeName || 'Current Store',
            slug: get().cart.storeSlug,
          },
          newStore: error?.newStore || error?.data?.newStore || {
            id: (product as any)?.storeId || 2,
            name: (product as any)?.storeName || (product as any)?.seller?.name || 'New Store',
            slug: (product as any)?.storeSlug,
          },
          pendingProductId: Number(String(product.id).replace(/\D/g, '')) || Number(product.id),
          pendingQuantity: Math.max(product.moq || 1, quantity),
        };
        set({
          isLoading: false,
          storeMismatchConflict: conflictData,
          isStoreMismatchOpen: true,
        });
        return;
      }
      console.warn('Failed to add item to backend cart:', error);
      set({ isLoading: false });
    }
  },

  updateQuantity: async (productId: string | number, quantity: number) => {
    if (quantity <= 0) {
      await get().removeItem(productId);
      return;
    }

    // Instant optimistic update for immediate, fluid UI response
    set((state) => {
      const items = state.cart.items.map((it) => {
        if (
          String(it.productId) === String(productId) ||
          String(it.cartItemId) === String(productId) ||
          String(it.id) === String(productId)
        ) {
          const unitPrice = it.selectedUnitPrice || it.unitPrice || it.price || 0;
          return {
            ...it,
            quantity,
            totalPrice: unitPrice * quantity,
            lineTotal: unitPrice * quantity,
          };
        }
        return it;
      });
      const subtotal = items.reduce((s, it) => s + (it.lineTotal || it.totalPrice || 0), 0);
      const gstTotal = Math.round(subtotal * 0.18);
      const deliveryTotal = state.cart.deliveryTotal || state.cart.estimatedFreight || 0;
      return {
        cart: {
          ...state.cart,
          items,
          subtotal,
          taxableAmount: subtotal,
          gstTotal,
          totalGst: gstTotal,
          grandTotal: subtotal + gstTotal + deliveryTotal,
        },
      };
    });

    try {
      const updatedCart = await cartApi.updateQuantity(productId, quantity);
      set({ cart: updatedCart, isLoading: false });
    } catch (error) {
      console.warn('Failed to update cart item quantity:', error);
      set({ isLoading: false });
    }
  },

  removeItem: async (productId: string | number) => {
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

  removeCoupon: async () => {
    set({ isLoading: true });
    try {
      const cart = await cartApi.removeCoupon();
      set({ cart, isLoading: false });
    } catch (error) {
      console.warn('Failed to remove coupon:', error);
      set({ isLoading: false });
    }
  },

  syncGuestCartWithBackend: async () => {
    try {
      const rawGuest = localStorage.getItem('hinchmart_guest_cart');
      if (rawGuest) {
        const parsed = JSON.parse(rawGuest);
        if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
          const syncItems = parsed.items.map((it: any) => ({
            productId: Number(String(it.productId || it.id).replace(/\D/g, '')) || Number(it.productId),
            quantity: Number(it.quantity || 1),
          }));
          const targetStoreId = parsed.storeId ? Number(parsed.storeId) : undefined;
          const mergedCart = await cartApi.syncCart({
            targetStoreId,
            items: syncItems,
          });
          localStorage.removeItem('hinchmart_guest_cart');
          set({ cart: mergedCart });
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to sync guest cart with backend:', err);
    }
    await get().fetchCart();
  },

  confirmSwitchStore: async () => {
    const conflict = get().storeMismatchConflict;
    if (!conflict) return;

    set({ isLoading: true });
    try {
      const updatedCart = await cartApi.switchStore({
        storeId: conflict.newStore.id,
        storeSlug: conflict.newStore.slug,
        pendingProductId: conflict.pendingProductId,
        pendingQuantity: conflict.pendingQuantity,
      });
      set({
        cart: updatedCart,
        isLoading: false,
        storeMismatchConflict: null,
        isStoreMismatchOpen: false,
        isOpen: true,
      });
    } catch (err) {
      console.error('Failed to switch store cart:', err);
      set({ isLoading: false });
    }
  },

  closeStoreMismatch: () => {
    set({ isStoreMismatchOpen: false, storeMismatchConflict: null });
  },
}));

