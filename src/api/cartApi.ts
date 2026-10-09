import { apiClient } from '../services/apiClient';
import type { Cart, CartItem, AddToCartInput, ApplyCouponResult, CartSyncRequest, SwitchStoreRequest } from '../types';

let lastFetchedCart: Cart | null = null;

/**
 * Normalizes backend CartResponse & CartItemResponse into the frontend Cart contract
 */
export function mapBackendCart(raw: any): Cart {
  if (!raw) {
    const empty: Cart = {
      id: 'cart_current',
      items: [],
      subtotal: 0,
      gstTotal: 0,
      totalGst: 0,
      deliveryTotal: 0,
      deliveryCharge: 0,
      discountTotal: 0,
      couponDiscount: 0,
      grandTotal: 0,
      estimatedDeliveryDays: 2,
    };
    lastFetchedCart = empty;
    return empty;
  }

  const items: CartItem[] = Array.isArray(raw.items)
    ? raw.items.map((it: any) => {
        const unitPrice = Number(it.unitPrice ?? it.pricePerUnit ?? it.price ?? 0);
        const originalPrice = it.originalPrice ? Number(it.originalPrice) : undefined;
        const qty = Number(it.quantity || 1);
        const lineTotal = Number(it.lineTotal ?? it.totalPrice ?? unitPrice * qty);
        const gstRate = Number(it.gstRate || 18);
        const lineGst = Number(it.lineGst ?? Math.round((lineTotal * gstRate) / 100));

        return {
          id: String(it.cartItemId || it.id || it.productId || ''),
          cartItemId: it.cartItemId ? Number(it.cartItemId) : undefined,
          productId: String(it.productId || it.id || ''),
          title: it.title || it.productName || it.product?.title || '',
          productTitle: it.title || it.productName || it.product?.title || '',
          brand: it.brand || it.product?.brand || '',
          category: it.category || it.product?.category || '',
          price: unitPrice,
          unitPrice,
          originalPrice,
          appliedTier: it.appliedTier,
          selectedUnitPrice: unitPrice,
          effectiveUnitPrice: unitPrice,
          totalPrice: lineTotal,
          lineTotal,
          lineGst,
          unit: it.unit || 'Piece',
          quantity: qty,
          gstRate,
          hsnCode: it.hsnCode || '',
          imageUrl: it.imageUrl || it.product?.imageUrl || '',
          moq: Number(it.moq || 1),
          stock: Number(it.stockQty || it.stock || 1000),
          is24HourDelivery: Boolean(it.is24HourDelivery),
          deliveryCharge: Number(it.deliveryCharge || 0),
          seller: {
            id: String(it.vendorId || it.seller?.id || ''),
            name: it.vendorName || it.seller?.name || raw.storeName || 'Apex Infra Supplies',
            isVerified: true,
            rating: 4.8,
            city: '',
            state: '',
            successfulOrders: 0,
            gstinMasked: '',
          },
        };
      })
    : [];

  const computedSubtotal = items.reduce((sum, it) => sum + (it.lineTotal || it.totalPrice || 0), 0);
  const computedGst = items.reduce(
    (sum, it) => sum + (it.lineGst || Math.round(((it.unitPrice || 0) * it.quantity * (it.gstRate || 18)) / 100)),
    0
  );
  const computedDelivery = items.reduce((sum, it) => sum + (it.deliveryCharge || 0), 0);

  const subtotal = Number(raw.subtotal ?? raw.taxableAmount ?? computedSubtotal);
  const couponDiscount = Number(raw.couponDiscount ?? raw.discountTotal ?? raw.discountAmount ?? 0);
  const totalGst = Number(raw.totalGst ?? raw.gstTotal ?? raw.taxAmount ?? raw.taxTotal ?? computedGst);
  const deliveryCharge = Number(
    raw.deliveryCharge ?? raw.deliveryTotal ?? raw.estimatedFreight ?? raw.shippingTotal ?? computedDelivery
  );
  const grandTotal = Number(
    raw.grandTotal ?? raw.total ?? subtotal - couponDiscount + totalGst + deliveryCharge
  );

  const result: Cart = {
    id: String(raw.cartId || raw.id || 'cart_current'),
    cartId: raw.cartId ? Number(raw.cartId) : undefined,
    storeId: raw.storeId ? Number(raw.storeId) : undefined,
    storeName: raw.storeName || undefined,
    storeSlug: raw.storeSlug || undefined,
    items,
    totalItems: items.reduce((sum, it) => sum + it.quantity, 0),
    subtotal,
    taxableAmount: subtotal,
    couponDiscount,
    discountTotal: couponDiscount,
    totalGst,
    gstTotal: totalGst,
    deliveryCharge,
    deliveryTotal: deliveryCharge,
    estimatedFreight: deliveryCharge,
    grandTotal,
    appliedCoupon: raw.appliedCoupon || (raw.couponCode ? { code: raw.couponCode } : null),
    estimatedDeliveryDays: Number(raw.estimatedDeliveryDays || 2),
    weightEstimateKg: raw.weightEstimateKg,
  };

  lastFetchedCart = result;
  return result;
}

export function getGuestCart(): Cart {
  try {
    const raw = localStorage.getItem('hinchmart_guest_cart');
    if (raw) return mapBackendCart(JSON.parse(raw));
  } catch {}
  return mapBackendCart(null);
}

export function saveGuestCart(cart: Cart): void {
  try {
    localStorage.setItem('hinchmart_guest_cart', JSON.stringify(cart));
  } catch {}
}

export const cartApi = {
  // 1. Get Current User Cart (GET /api/cart)
  async getCart(): Promise<Cart> {
    const token = localStorage.getItem('hinchmart_auth_token');
    if (!token) {
      return getGuestCart();
    }

    try {
      const res = await apiClient.get('/cart');
      if (res.data?.success && res.data?.data) {
        return mapBackendCart(res.data.data);
      }
      if (res.data?.items) {
        return mapBackendCart(res.data);
      }
    } catch (err: any) {
      if (err?.statusCode === 401) {
        return getGuestCart();
      }
      console.warn('Backend GET /cart error:', err);
    }
    return mapBackendCart(null);
  },

  // 2. Add or Increment Item in Cart (POST /api/cart/items)
  async addToCart(payload: AddToCartInput, productDetails?: any): Promise<Cart> {
    const token = localStorage.getItem('hinchmart_auth_token');
    if (!token) {
      const current = getGuestCart();
      const existingIdx = current.items.findIndex(
        (it) => String(it.productId) === String(payload.productId) || String(it.id) === String(payload.productId)
      );

      if (existingIdx >= 0) {
        const item = current.items[existingIdx];
        item.quantity += payload.quantity;
        const itemPrice = Number(item.price || item.unitPrice || 0);
        item.totalPrice = itemPrice * item.quantity;
        item.lineTotal = item.totalPrice;
      } else if (productDetails) {
        const price = Number(productDetails.price || 0);
        const qty = payload.quantity;
        current.items.push({
          productId: String(payload.productId),
          title: productDetails.title || '',
          productTitle: productDetails.title || '',
          brand: productDetails.brand || '',
          category: productDetails.category || '',
          price,
          unitPrice: price,
          effectiveUnitPrice: price,
          totalPrice: price * qty,
          lineTotal: price * qty,
          unit: productDetails.unit || 'Piece',
          quantity: qty,
          gstRate: productDetails.gstRate || 18,
          hsnCode: productDetails.hsnCode || '',
          imageUrl: productDetails.imageUrl || productDetails.images?.[0] || '',
          moq: productDetails.moq || 1,
          stock: productDetails.stock || 100,
          is24HourDelivery: Boolean(productDetails.is24HourDelivery),
          deliveryCharge: 0,
        });
      }

      current.subtotal = current.items.reduce((s, it) => s + (it.lineTotal || it.totalPrice || 0), 0);
      current.taxableAmount = current.subtotal;
      current.gstTotal = Math.round(current.subtotal * 0.18);
      current.totalGst = current.gstTotal;
      current.deliveryTotal = current.deliveryTotal || 0;
      current.deliveryCharge = current.deliveryTotal;
      current.grandTotal = current.subtotal + current.gstTotal + current.deliveryTotal;
      saveGuestCart(current);
      return current;
    }

    try {
      const numericProductId = Number(String(payload.productId).replace(/\D/g, '')) || payload.productId;
      const res = await apiClient.post('/cart/items', {
        productId: numericProductId,
        quantity: Number(payload.quantity),
      });

      if (res.data?.success && res.data?.data) {
        return mapBackendCart(res.data.data);
      }
      if (res.data?.items) {
        return mapBackendCart(res.data);
      }
    } catch (err: any) {
      if (err?.statusCode === 401) {
        return getGuestCart();
      }
      // Re-throw so callers / store can intercept 409 StoreMismatchException
      throw err;
    }
    return this.getCart();
  },

  // 3. Update Item Quantity (PUT /api/cart/items/{cartItemId})
  async updateQuantity(identifier: number | string, quantity: number): Promise<Cart> {
    if (quantity <= 0) {
      return this.removeItem(identifier);
    }

    const token = localStorage.getItem('hinchmart_auth_token');
    if (!token) {
      const current = getGuestCart();
      const existingIdx = current.items.findIndex(
        (it) => String(it.productId) === String(identifier) || String(it.id) === String(identifier)
      );

      if (existingIdx >= 0) {
        const item = current.items[existingIdx];
        item.quantity = quantity;
        const itemPrice = Number(item.price || item.unitPrice || 0);
        item.totalPrice = itemPrice * quantity;
        item.lineTotal = item.totalPrice;

        current.subtotal = current.items.reduce((s, it) => s + (it.lineTotal || it.totalPrice || 0), 0);
        current.taxableAmount = current.subtotal;
        current.gstTotal = Math.round(current.subtotal * 0.18);
        current.totalGst = current.gstTotal;
        current.deliveryTotal = current.deliveryTotal || 0;
        current.deliveryCharge = current.deliveryTotal;
        current.grandTotal = current.subtotal + current.gstTotal + current.deliveryTotal;
        saveGuestCart(current);
      }
      return current;
    }

    // Resolve cartItemId from lastFetchedCart if available
    const item = (lastFetchedCart?.items || []).find(
      (it) =>
        String(it.cartItemId) === String(identifier) ||
        String(it.productId) === String(identifier) ||
        String(it.id) === String(identifier)
    );
    const resolvedCartItemId = item?.cartItemId ?? (Number(String(identifier).replace(/\D/g, '')) || identifier);

    try {
      const res = await apiClient.put(`/cart/items/${resolvedCartItemId}`, { quantity: Number(quantity) });
      if (res.data?.success && res.data?.data) {
        return mapBackendCart(res.data.data);
      }
      if (res.data?.items) {
        return mapBackendCart(res.data);
      }
    } catch {
      try {
        const fallbackRes = await apiClient.put(`/cart/items/${identifier}`, { quantity: Number(quantity) });
        if (fallbackRes.data?.success && fallbackRes.data?.data) {
          return mapBackendCart(fallbackRes.data.data);
        }
      } catch {
        // Fallback to local guest cart update so user flow never breaks
        const current = getGuestCart();
        const existingIdx = current.items.findIndex(
          (it) => String(it.productId) === String(identifier) || String(it.id) === String(identifier)
        );
        if (existingIdx >= 0) {
          const it = current.items[existingIdx];
          it.quantity = quantity;
          const itemPrice = Number(it.price || it.unitPrice || 0);
          it.totalPrice = itemPrice * quantity;
          it.lineTotal = it.totalPrice;

          current.subtotal = current.items.reduce((s, x) => s + (x.lineTotal || x.totalPrice || 0), 0);
          current.taxableAmount = current.subtotal;
          current.gstTotal = Math.round(current.subtotal * 0.18);
          current.totalGst = current.gstTotal;
          current.deliveryTotal = current.deliveryTotal || 0;
          current.deliveryCharge = current.deliveryTotal;
          current.grandTotal = current.subtotal + current.gstTotal + current.deliveryTotal;
          saveGuestCart(current);
          return current;
        }
      }
    }

    return this.getCart();
  },

  // 4. Sync Guest Cart to User Cart (POST /api/cart/sync)
  async syncCart(payload: CartSyncRequest): Promise<Cart> {
    try {
      const body: Record<string, any> = {
        items: payload.items.map((it) => ({
          productId: Number(String(it.productId).replace(/\D/g, '')) || it.productId,
          quantity: Number(it.quantity),
        })),
      };
      if (payload.targetStoreId) {
        body.targetStoreId = Number(payload.targetStoreId);
      }

      const res = await apiClient.post('/cart/sync', body);
      if (res.data?.success && res.data?.data) {
        return mapBackendCart(res.data.data);
      }
      if (res.data?.items) {
        return mapBackendCart(res.data);
      }
    } catch (err) {
      console.warn('Backend POST /cart/sync error:', err);
    }
    return this.getCart();
  },

  // 5. Switch Store Cart (POST /api/cart/switch-store or POST /api/cart/switch)
  async switchStore(payload: SwitchStoreRequest): Promise<Cart> {
    const body: Record<string, any> = {
      storeId: Number(payload.storeId),
    };
    if (payload.storeSlug) body.storeSlug = payload.storeSlug;
    if (payload.pendingProductId) {
      body.pendingProductId = Number(String(payload.pendingProductId).replace(/\D/g, '')) || payload.pendingProductId;
    }
    if (payload.pendingQuantity) {
      body.pendingQuantity = Number(payload.pendingQuantity);
    }

    try {
      const res = await apiClient.post('/cart/switch-store', body);
      if (res.data?.success && res.data?.data) {
        return mapBackendCart(res.data.data);
      }
      if (res.data?.items) {
        return mapBackendCart(res.data);
      }
    } catch (err: any) {
      try {
        const fallbackRes = await apiClient.post('/cart/switch', body);
        if (fallbackRes.data?.success && fallbackRes.data?.data) {
          return mapBackendCart(fallbackRes.data.data);
        }
        if (fallbackRes.data?.items) {
          return mapBackendCart(fallbackRes.data);
        }
      } catch (fallbackErr) {
        console.warn('Backend POST /cart/switch-store failed:', fallbackErr);
        throw err;
      }
    }
    return this.getCart();
  },

  // 6. Apply Coupon Code (POST /api/cart/coupon)
  async applyCoupon(couponCode: string): Promise<ApplyCouponResult> {
    try {
      const cleanCode = couponCode.trim().toUpperCase();
      const res = await apiClient.post('/cart/coupon', {
        code: cleanCode,
      });

      if (res.data?.success && res.data?.data) {
        return {
          success: true,
          message: res.data.message || `Coupon ${cleanCode} applied successfully`,
          discountAmount: Number(res.data.data.discountAmount || 0),
          coupon: {
            code: res.data.data.couponCode || cleanCode,
            discountAmount: Number(res.data.data.discountAmount || 0),
          },
        };
      }
      return {
        success: false,
        message: res.data?.message || 'Invalid coupon code',
        discountAmount: 0,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to apply coupon',
        discountAmount: 0,
      };
    }
  },

  // 7. Remove Coupon (DELETE /api/cart/coupon)
  async removeCoupon(): Promise<Cart> {
    try {
      const res = await apiClient.delete('/cart/coupon');
      if (res.data?.success && res.data?.data) {
        return mapBackendCart(res.data.data);
      }
    } catch (err) {
      console.warn('Backend DELETE /cart/coupon error:', err);
    }
    return this.getCart();
  },

  // 8. Remove Single Item (DELETE /api/cart/items/{cartItemId})
  async removeItem(identifier: number | string): Promise<Cart> {
    const token = localStorage.getItem('hinchmart_auth_token');
    if (!token) {
      const current = getGuestCart();
      current.items = current.items.filter(
        (it) => String(it.productId) !== String(identifier) && String(it.id) !== String(identifier)
      );
      current.subtotal = current.items.reduce((s, it) => s + (it.lineTotal || it.totalPrice || 0), 0);
      current.taxableAmount = current.subtotal;
      current.gstTotal = Math.round(current.subtotal * 0.18);
      current.totalGst = current.gstTotal;
      current.deliveryTotal = current.deliveryTotal || 0;
      current.deliveryCharge = current.deliveryTotal;
      current.grandTotal = current.subtotal + current.gstTotal + current.deliveryTotal;
      saveGuestCart(current);
      return current;
    }

    const item = (lastFetchedCart?.items || []).find(
      (it) =>
        String(it.cartItemId) === String(identifier) ||
        String(it.productId) === String(identifier) ||
        String(it.id) === String(identifier)
    );
    const resolvedCartItemId = item?.cartItemId ?? (Number(String(identifier).replace(/\D/g, '')) || identifier);

    try {
      const res = await apiClient.delete(`/cart/items/${resolvedCartItemId}`);
      if (res.data?.success && res.data?.data) {
        return mapBackendCart(res.data.data);
      }
    } catch {
      try {
        const fallbackRes = await apiClient.delete(`/cart/items/${identifier}`);
        if (fallbackRes.data?.success && fallbackRes.data?.data) {
          return mapBackendCart(fallbackRes.data.data);
        }
      } catch {
        const current = getGuestCart();
        current.items = current.items.filter(
          (it) => String(it.productId) !== String(identifier) && String(it.id) !== String(identifier)
        );
        current.subtotal = current.items.reduce((s, it) => s + (it.lineTotal || it.totalPrice || 0), 0);
        current.taxableAmount = current.subtotal;
        current.gstTotal = Math.round(current.subtotal * 0.18);
        current.totalGst = current.gstTotal;
        current.deliveryTotal = current.deliveryTotal || 0;
        current.deliveryCharge = current.deliveryTotal;
        current.grandTotal = current.subtotal + current.gstTotal + current.deliveryTotal;
        saveGuestCart(current);
        return current;
      }
    }
    return this.getCart();
  },

  // 9. Clear Entire Cart (DELETE /api/cart)
  async clearCart(): Promise<Cart> {
    const token = localStorage.getItem('hinchmart_auth_token');
    if (!token) {
      localStorage.removeItem('hinchmart_guest_cart');
      return mapBackendCart(null);
    }

    try {
      const res = await apiClient.delete('/cart');
      if (res.data?.success) {
        return mapBackendCart(res.data.data);
      }
    } catch (err) {
      console.warn('Backend DELETE /cart warning:', err);
    }
    return mapBackendCart(null);
  },
};

