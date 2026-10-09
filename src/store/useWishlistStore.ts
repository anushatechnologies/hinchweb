import { create } from 'zustand';
import type { WishlistItem, Product } from '../types';
import { wishlistApi } from '../api/wishlistApi';

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  addItem: (product: Product | WishlistItem) => Promise<boolean>;
  removeItem: (productId: number | string) => Promise<boolean>;
  toggleWishlist: (product: Product | WishlistItem) => Promise<boolean>;
  isInWishlist: (productId: number | string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchWishlist: async () => {
    set({ isLoading: true });
    try {
      const items = await wishlistApi.getWishlist();
      set({ items: Array.isArray(items) ? items : [], isLoading: false });
    } catch (err) {
      console.warn('Failed to fetch wishlist:', err);
      set({ isLoading: false });
    }
  },

  addItem: async (product: Product | WishlistItem) => {
    const productId = 'productId' in product ? product.productId : (product as any).id;
    try {
      const added = await wishlistApi.addToWishlist(productId);
      const itemToAdd: WishlistItem = added?.productId ? added : {
        productId,
        title: product.title,
        price: product.price,
        mrp: 'mrp' in product ? product.mrp : undefined,
        imageUrl: ('imageUrl' in product && product.imageUrl) || ('images' in product && product.images?.[0]) || '',
        brand: product.brand,
        category: 'category' in product ? product.category : undefined,
        inStock: true,
        addedAt: new Date().toISOString(),
      };
      set((state) => ({
        items: state.items.some((i) => String(i.productId) === String(productId))
          ? state.items
          : [itemToAdd, ...state.items],
      }));
      return true;
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      // Optimistic fallback for buyer UI experience
      const fallbackItem: WishlistItem = {
        productId,
        title: product.title,
        price: product.price,
        mrp: 'mrp' in product ? product.mrp : undefined,
        imageUrl: ('imageUrl' in product && product.imageUrl) || ('images' in product && product.images?.[0]) || '',
        brand: product.brand,
        category: 'category' in product ? product.category : undefined,
        inStock: true,
        addedAt: new Date().toISOString(),
      };
      set((state) => ({
        items: state.items.some((i) => String(i.productId) === String(productId))
          ? state.items
          : [fallbackItem, ...state.items],
      }));
      return true;
    }
  },

  removeItem: async (productId: number | string) => {
    // Optimistic removal
    const previous = get().items;
    set((state) => ({
      items: state.items.filter((i) => String(i.productId) !== String(productId)),
    }));
    try {
      const success = await wishlistApi.removeFromWishlist(productId);
      if (!success) {
        set({ items: previous });
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      return false;
    }
  },

  toggleWishlist: async (product: Product | WishlistItem) => {
    const productId = 'productId' in product ? product.productId : (product as any).id;
    const exists = get().isInWishlist(productId);
    if (exists) {
      return get().removeItem(productId);
    } else {
      return get().addItem(product);
    }
  },

  isInWishlist: (productId: number | string) => {
    return get().items.some((i) => String(i.productId) === String(productId));
  },
}));
