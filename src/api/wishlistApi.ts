import { apiClient } from '../services/apiClient';
import { tokenStorage } from '../services/tokenStorage';
import type { WishlistItem } from '../types';

export interface BackendWishlistEntry {
  id: number;
  productId: number;
  createdAt: string;
  product?: {
    id?: number;
    productId?: number;
    title?: string;
    name?: string;
    slug?: string;
    sku?: string;
    description?: string;
    price?: number;
    sellingPrice?: number;
    mrp?: number;
    imageUrl?: string;
    images?: string[];
    brand?: string;
    brandName?: string;
    categoryId?: number;
    subcategoryId?: number;
    subcategoryName?: string;
    unit?: string;
    moq?: number;
    stockQty?: number;
    active?: boolean;
    rating?: number;
    reviewCount?: number;
  };
}

/**
 * Normalizes backend WishlistResponse / ProductResponse to frontend WishlistItem format
 */
export function normalizeWishlistItem(raw: any): WishlistItem {
  const p = raw.product || {};
  const productId = raw.productId || p.productId || p.id || raw.id;
  const title = p.title || p.name || raw.title || raw.name || 'Product';
  const price = Number(p.sellingPrice ?? p.price ?? raw.sellingPrice ?? raw.price ?? 0);
  const mrp = p.mrp ? Number(p.mrp) : raw.mrp ? Number(raw.mrp) : undefined;
  const imageUrl = p.imageUrl || p.images?.[0] || raw.imageUrl || raw.images?.[0] || '';
  const brand = p.brandName || p.brand || raw.brandName || raw.brand || '';
  const category = p.subcategoryName || p.category || raw.subcategoryName || raw.category || '';
  const unit = p.unit || raw.unit || 'unit';
  const inStock = p.active !== false && (p.stockQty !== undefined ? p.stockQty > 0 : true);

  return {
    productId,
    title,
    slug: p.slug || raw.slug,
    price,
    mrp,
    imageUrl,
    brand,
    category,
    unit,
    inStock,
    addedAt: raw.createdAt || raw.addedAt || new Date().toISOString(),
  };
}

export const wishlistApi = {
  /**
   * 1. Get User Wishlist
   * GET /api/wishlist
   * Headers: Authorization: Bearer <accessToken>
   */
  async getWishlist(): Promise<WishlistItem[]> {
    const token = tokenStorage.getAccessToken();
    if (!token) return [];

    try {
      const res = await apiClient.get('/wishlist');
      const list = res.data?.success && Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      return list.map(normalizeWishlistItem);
    } catch (err) {
      console.warn('Backend GET /wishlist error:', err);
      return [];
    }
  },

  /**
   * 2. Add Product to Wishlist
   * POST /api/wishlist/{productId}
   * Headers: Authorization: Bearer <accessToken>
   * Path Variable: productId
   * No Request Body
   */
  async addToWishlist(productId: number | string): Promise<WishlistItem> {
    const res = await apiClient.post(`/wishlist/${productId}`);
    if (res.data?.success && res.data?.data) {
      return normalizeWishlistItem(res.data.data);
    }
    if (res.data?.data) {
      return normalizeWishlistItem(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to add to wishlist');
  },

  /**
   * 3. Remove Product from Wishlist
   * DELETE /api/wishlist/{productId}
   * Headers: Authorization: Bearer <accessToken>
   * Path Variable: productId
   */
  async removeFromWishlist(productId: number | string): Promise<boolean> {
    const res = await apiClient.delete(`/wishlist/${productId}`);
    return res.data?.success ?? true;
  },
};
