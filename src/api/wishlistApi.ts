import { apiClient } from '../services/apiClient';
import type { WishlistItem } from '../types';

export const wishlistApi = {
  // 10.1 Get Wishlist
  async getWishlist(): Promise<WishlistItem[]> {
    try {
      const res = await apiClient.get('/wishlist');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend GET /wishlist error:', err);
    }
    return [];
  },

  // 10.2 Add Product to Wishlist
  async addToWishlist(productId: number | string): Promise<WishlistItem> {
    const res = await apiClient.post(`/wishlist/${productId}`);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to add to wishlist');
  },

  // 10.3 Remove Product from Wishlist
  async removeFromWishlist(productId: number | string): Promise<boolean> {
    const res = await apiClient.delete(`/wishlist/${productId}`);
    return res.data?.success ?? true;
  },
};
