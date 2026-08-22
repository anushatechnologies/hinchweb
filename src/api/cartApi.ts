import { apiClient, getCurrentUserId } from '../services/apiClient';
import { mockDb } from './mockDb';
import { mapBackendProductToFrontend } from './productApi';
import type { Cart, CartItem } from '../types';

export function mapBackendCart(data: any): Cart {
  if (!data) {
    return {
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
  }

  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items: CartItem[] = rawItems.map((item: any) => {
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unitPrice || item.regularPrice || item.price || 0);
    const regularPrice = Number(item.regularPrice || unitPrice);
    const subtotal = Number(item.subtotal || unitPrice * qty);
    const gstRate = Number(item.gstPercentage || item.gstRate || 18);
    const gstAmount = Number(item.gstAmount || subtotal * (gstRate / 100));
    const totalPrice = Number(item.total || subtotal + gstAmount);
    const unitSavings = Math.max(0, regularPrice - unitPrice);
    const bulkSavings = unitSavings * qty;

    const product = item.product
      ? mapBackendProductToFrontend(item.product)
      : mapBackendProductToFrontend({
          id: item.productId || item.id,
          productName: item.productName || 'Industrial Material',
          slug: item.productSlug || `product-${item.productId || item.id}`,
          sellingPrice: unitPrice,
          mrp: regularPrice,
          unit: item.unit || 'Ton',
          moq: item.moq || 1,
          gstRate,
          primaryImageUrl: item.primaryImageUrl || item.imageUrl,
          stock: item.availableStock || 500,
        });

    return {
      id: String(item.id),
      product,
      quantity: qty,
      selectedUnitPrice: unitPrice,
      unit: product.unit,
      gstRate,
      bulkSavings,
      totalPrice,
    };
  });

  const subtotal = Number(data.subtotal || items.reduce((acc, i) => acc + i.selectedUnitPrice * i.quantity, 0));
  const totalGst = Number(data.gstTotal || items.reduce((acc, i) => acc + (i.selectedUnitPrice * i.quantity * (i.gstRate / 100)), 0));
  const estimatedFreight = Number(data.deliveryCharge || (subtotal > 0 ? 2500 : 0));
  const grandTotal = Number(data.grandTotal || subtotal + totalGst + estimatedFreight);
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalBulkDiscount = items.reduce((acc, i) => acc + i.bulkSavings, 0);

  return {
    items,
    totalItems,
    subtotal,
    totalBulkDiscount,
    taxableAmount: subtotal,
    cgst: Math.round(totalGst / 2),
    sgst: Math.round(totalGst / 2),
    igst: 0,
    totalGst,
    estimatedFreight,
    grandTotal,
  };
}

export const cartApi = {
  async getCart(): Promise<Cart> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.get('/cart', { params: { userId } });
      if (res.data?.success && res.data?.data) {
        return mapBackendCart(res.data.data);
      }
    } catch (err) {
      console.warn('Backend /cart failed, using local cart storage:', err);
    }
    return mockDb.getCart();
  },

  async addToCart(productId: string, quantity: number): Promise<Cart> {
    const userId = getCurrentUserId();
    try {
      const numProductId = Number(productId.replace(/\D/g, '')) || 1;
      const res = await apiClient.post(
        `/cart/items?userId=${userId}`,
        {
          productId: numProductId,
          quantity,
        }
      );
      if (res.data?.success && res.data?.data) {
        return mapBackendCart(res.data.data);
      }
    } catch (err) {
      console.warn('Backend addToCart failed, using local cart:', err);
    }
    return mockDb.addToCart(productId, quantity);
  },

  async updateQuantity(itemId: string, quantity: number): Promise<Cart> {
    const userId = getCurrentUserId();
    try {
      const numItemId = Number(itemId.replace(/\D/g, '')) || 1;
      const res = await apiClient.put(
        `/cart/items/${numItemId}?userId=${userId}`,
        { quantity }
      );
      if (res.data?.success && res.data?.data) {
        return mapBackendCart(res.data.data);
      }
    } catch (err) {
      console.warn('Backend updateQuantity failed, using local cart:', err);
    }
    return mockDb.updateCartItem(itemId, quantity);
  },

  async removeItem(itemId: string): Promise<Cart> {
    const userId = getCurrentUserId();
    try {
      const numItemId = Number(itemId.replace(/\D/g, '')) || 1;
      const res = await apiClient.delete(`/cart/items/${numItemId}?userId=${userId}`);
      if (res.data?.success && res.data?.data) {
        return mapBackendCart(res.data.data);
      }
    } catch (err) {
      console.warn('Backend removeItem failed, using local cart:', err);
    }
    return mockDb.removeFromCart(itemId);
  },

  async clearCart(): Promise<Cart> {
    const userId = getCurrentUserId();
    try {
      await apiClient.delete(`/cart/clear?userId=${userId}`);
    } catch (err) {
      console.warn('Backend clearCart failed:', err);
    }
    mockDb.clearCart();
    return this.getCart();
  },
};
