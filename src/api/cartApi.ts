import { apiClient } from '../services/apiClient';
import type { Cart, CartItem, AddToCartInput, ApplyCouponResult } from '../types';

export function mapBackendCart(raw: any): Cart {
  if (!raw) {
    return {
      id: 'cart_current',
      items: [],
      subtotal: 0,
      gstTotal: 0,
      deliveryTotal: 0,
      discountTotal: 0,
      grandTotal: 0,
      estimatedDeliveryDays: 2,
    };
  }

  const items: CartItem[] = Array.isArray(raw.items)
    ? raw.items.map((it: any) => ({
        productId: String(it.productId || it.id || ''),
        title: it.title || it.productName || it.product?.title || '',
        brand: it.brand || it.product?.brand || '',
        category: it.category || it.product?.category || '',
        price: Number(it.pricePerUnit || it.unitPrice || it.price || 0),
        unitPrice: Number(it.pricePerUnit || it.unitPrice || it.price || 0),
        effectiveUnitPrice: Number(it.effectivePrice || it.pricePerUnit || it.unitPrice || it.price || 0),
        totalPrice: Number(it.totalPrice || (it.price || 0) * (it.quantity || 1)),
        unit: it.unit || 'Piece',
        quantity: Number(it.quantity || 1),
        gstRate: Number(it.gstRate || 18),
        hsnCode: it.hsnCode || '',
        imageUrl: it.imageUrl || it.product?.imageUrl || '',
        moq: Number(it.moq || 1),
        stock: Number(it.stockQty || it.stock || 1000),
        is24HourDelivery: Boolean(it.is24HourDelivery),
        deliveryCharge: Number(it.deliveryCharge || 0),
        seller: {
          id: String(it.vendorId || it.seller?.id || ''),
          name: it.vendorName || it.seller?.name || 'Verified Vendor',
          isVerified: true,
          rating: 4.8,
          city: '',
          state: '',
          successfulOrders: 0,
          gstinMasked: '',
        },
      }))
    : [];

  return {
    id: String(raw.cartId || raw.id || 'cart_current'),
    cartId: raw.cartId,
    items,
    subtotal: Number(raw.subtotal || 0),
    gstTotal: Number(raw.gstTotal || raw.taxTotal || 0),
    deliveryTotal: Number(raw.deliveryTotal || raw.shippingTotal || 0),
    discountTotal: Number(raw.discountTotal || 0),
    grandTotal: Number(raw.grandTotal || raw.total || 0),
    appliedCoupon: raw.appliedCoupon,
    estimatedDeliveryDays: Number(raw.estimatedDeliveryDays || 2),
    weightEstimateKg: raw.weightEstimateKg,
  };
}

export const cartApi = {
  // 9.1 Get Current User Cart
  async getCart(): Promise<Cart> {
    try {
      const res = await apiClient.get('/cart');
      if (res.data?.success && res.data?.data) {
        return mapBackendCart(res.data.data);
      }
      if (res.data?.items) {
        return mapBackendCart(res.data);
      }
    } catch (err) {
      console.warn('Backend GET /cart error:', err);
    }
    return mapBackendCart(null);
  },

  // 9.2 Add / Update Item in Cart
  async addToCart(payload: AddToCartInput): Promise<Cart> {
    const res = await apiClient.post('/cart/items', payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendCart(res.data.data);
    }
    if (res.data?.items) {
      return mapBackendCart(res.data);
    }
    return this.getCart();
  },

  // 9.3 Remove Item from Cart
  async removeItem(productId: number | string): Promise<Cart> {
    const res = await apiClient.delete(`/cart/items/${productId}`);
    if (res.data?.success && res.data?.data) {
      return mapBackendCart(res.data.data);
    }
    return this.getCart();
  },

  // 9.4 Clear Entire Cart
  async clearCart(): Promise<Cart> {
    const res = await apiClient.delete('/cart');
    if (res.data?.success && res.data?.data) {
      return mapBackendCart(res.data.data);
    }
    return mapBackendCart(null);
  },

  // 9.5 Apply Coupon
  async applyCoupon(couponCode: string): Promise<ApplyCouponResult> {
    const res = await apiClient.post('/cart/coupon', { couponCode });
    if (res.data?.success && res.data?.data) {
      return {
        success: true,
        message: res.data.message || 'Coupon applied successfully',
        discountAmount: res.data.data.discountAmount || 0,
        coupon: res.data.data.appliedCoupon || { code: couponCode, discountPercentage: 5, description: '' },
      };
    }
    return {
      success: false,
      message: res.data?.message || 'Invalid coupon code',
      discountAmount: 0,
    };
  },
};
