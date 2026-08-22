import { create } from 'zustand';
import type { Cart, CartItem, Product } from '../types';
import { cartApi } from '../api/cartApi';
import { calculateBulkPrice, calculateGst } from '../utils/tax';

interface CartState {
  cart: Cart;
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  fetchCart: () => Promise<void>;
  addItem: (product: Product, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const initialCart: Cart = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  totalBulkDiscount: 0,
  taxableAmount: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  totalGst: 0,
  estimatedFreight: 0,
  grandTotal: 0,
};

export const useCartStore = create<CartState>((set, get) => ({
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
      console.error('Failed to fetch cart', error);
      set({ isLoading: false });
    }
  },

  addItem: async (product: Product, quantity: number) => {
    set({ isLoading: true });
    try {
      const updatedCart = await cartApi.addToCart(product.id, quantity);
      set({ cart: updatedCart, isLoading: false, isOpen: true });
    } catch (error) {
      console.error('Failed to add item to cart', error);
      // Fallback local calculation
      const currentCart = get().cart;
      const existingItemIndex = currentCart.items.findIndex(
        (i) => i.product.id === product.id
      );

      let newItems: CartItem[];
      const qty = Math.max(product.moq, quantity);
      const pricing = calculateBulkPrice(product, qty);

      if (existingItemIndex > -1) {
        const newQty = currentCart.items[existingItemIndex].quantity + qty;
        const newPricing = calculateBulkPrice(product, newQty);
        newItems = [...currentCart.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newQty,
          selectedUnitPrice: newPricing.unitPrice,
          bulkSavings: newPricing.savings,
          totalPrice: newPricing.total,
        };
      } else {
        const newItem: CartItem = {
          id: `item_${Date.now()}`,
          product,
          quantity: qty,
          selectedUnitPrice: pricing.unitPrice,
          unit: product.unit,
          gstRate: product.gstRate,
          bulkSavings: pricing.savings,
          totalPrice: pricing.total,
        };
        newItems = [...currentCart.items, newItem];
      }

      let subtotal = 0;
      let totalBulkDiscount = 0;
      let taxableAmount = 0;
      let cgst = 0;
      let sgst = 0;
      let estimatedFreight = 0;

      newItems.forEach((item) => {
        subtotal += item.product.price * item.quantity;
        totalBulkDiscount += item.bulkSavings;
        taxableAmount += item.totalPrice;
        const tax = calculateGst(item.totalPrice, item.gstRate, false);
        cgst += tax.cgst;
        sgst += tax.sgst;
        estimatedFreight += item.product.deliveryCharge || 0;
      });

      const totalGst = cgst + sgst;
      const grandTotal = taxableAmount + totalGst + estimatedFreight;

      set({
        cart: {
          items: newItems,
          totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal,
          totalBulkDiscount,
          taxableAmount,
          cgst,
          sgst,
          igst: 0,
          totalGst,
          estimatedFreight,
          grandTotal,
        },
        isLoading: false,
        isOpen: true,
      });
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    set({ isLoading: true });
    try {
      const updatedCart = await cartApi.updateQuantity(itemId, quantity);
      set({ cart: updatedCart, isLoading: false });
    } catch (error) {
      console.error('Failed to update quantity', error);
      set({ isLoading: false });
    }
  },

  removeItem: async (itemId: string) => {
    set({ isLoading: true });
    try {
      const updatedCart = await cartApi.removeItem(itemId);
      set({ cart: updatedCart, isLoading: false });
    } catch (error) {
      console.error('Failed to remove item', error);
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    set({ isLoading: true });
    try {
      await cartApi.clearCart();
      set({ cart: initialCart, isLoading: false });
    } catch (error) {
      console.error('Failed to clear cart', error);
      set({ isLoading: false });
    }
  },
}));
