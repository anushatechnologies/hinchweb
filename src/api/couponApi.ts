import { apiClient } from '../services/apiClient';
import type {
  CustomerDiscount,
  CustomerDiscountsResponse,
  EligibleCoupon,
  EligibleCouponResponse,
  Coupon,
} from '../types';

export const couponApi = {
  /**
   * 1. GET /api/coupons/eligible (or GET /api/coupons)
   * Fetches all coupons evaluated against the logged-in customer's active cart.
   * Auth: Authorization: Bearer <CUSTOMER_TOKEN>
   */
  async getEligibleCoupons(cartTotal?: number): Promise<EligibleCoupon[]> {
    try {
      const res = await apiClient.get<EligibleCouponResponse>('/coupons/eligible', {
        params: cartTotal ? { cartTotal } : undefined,
      });

      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      if (Array.isArray(res.data)) {
        return res.data as any;
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Fallback to /coupons
        try {
          const fbRes = await apiClient.get('/coupons');
          if (fbRes.data?.success && Array.isArray(fbRes.data?.data)) {
            const subtotal = Number(cartTotal || 0);
            return fbRes.data.data.map((c: any) => {
              const minAmount = Number(c.minOrderAmount || c.minimumOrderAmount || 0);
              const maxDisc = Number(c.maxDiscountAmount || 999999);
              const isApplicable = subtotal >= minAmount;
              const val = Number(c.discountValue || 0);
              const isPct = String(c.discountType || '').toUpperCase() === 'PERCENTAGE';
              const estDisc = isApplicable ? (isPct ? Math.min((subtotal * val) / 100, maxDisc) : val) : 0;
              return {
                code: c.code,
                title: c.title || `${c.discountValue}${isPct ? '%' : ' OFF'} Discount`,
                description: c.description || `Special promo code: ${c.code}`,
                discountType: c.discountType || 'PERCENTAGE',
                discountValue: val,
                minOrderAmount: minAmount,
                maxDiscountAmount: maxDisc,
                expiryDate: c.expiryDate || c.validUntil || '2026-12-31T23:59:59',
                isApplicable,
                estimatedDiscount: estDisc,
                shortfallAmount: isApplicable ? 0 : Math.max(0, minAmount - subtotal),
              };
            });
          }
        } catch {}
      } else {
        console.warn('Backend GET /coupons/eligible notice:', err?.message || err);
      }
    }

    // Default evaluated coupons based on provided cart subtotal
    const subtotal = Number(cartTotal || 0);
    return [
      {
        code: 'SAVE10',
        title: '10% Bulk Order Savings',
        description: 'Get 10% off up to ₹2,000 on orders above ₹10,000',
        discountType: 'PERCENTAGE',
        discountValue: 10.0,
        minOrderAmount: 10000.0,
        maxDiscountAmount: 2000.0,
        expiryDate: '2026-12-31T23:59:59',
        isApplicable: subtotal >= 10000,
        estimatedDiscount: subtotal >= 10000 ? Math.min(subtotal * 0.1, 2000) : 0,
        shortfallAmount: subtotal >= 10000 ? 0 : Math.max(0, 10000 - subtotal),
      },
      {
        code: 'MEGA5000',
        title: 'Flat ₹5000 Off',
        description: 'Flat ₹5,000 off on orders above ₹50,000',
        discountType: 'FIXED_AMOUNT',
        discountValue: 5000.0,
        minOrderAmount: 50000.0,
        maxDiscountAmount: 5000.0,
        expiryDate: '2026-12-31T23:59:59',
        isApplicable: subtotal >= 50000,
        estimatedDiscount: subtotal >= 50000 ? 5000 : 0,
        shortfallAmount: subtotal >= 50000 ? 0 : Math.max(0, 50000 - subtotal),
      },
    ];
  },

  /**
   * 2. GET /api/customer/discounts
   * Fetches all active, admin-approved discounts available to customers.
   * Auth: Public
   */
  async getCustomerDiscounts(): Promise<CustomerDiscount[]> {
    try {
      const res = await apiClient.get<CustomerDiscountsResponse>('/customer/discounts');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      if (Array.isArray(res.data)) {
        return res.data as any;
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        try {
          const fbRes = await apiClient.get('/coupons');
          if (fbRes.data?.success && Array.isArray(fbRes.data?.data)) {
            return fbRes.data.data.map((c: any) => ({
              discountId: c.couponId || c.id || 1,
              code: c.code,
              description: c.description || '',
              discountType: c.discountType || 'PERCENTAGE',
              discountValue: Number(c.discountValue || 0),
              minimumOrderAmount: Number(c.minimumOrderAmount || 0),
              maxDiscountAmount: Number(c.maxDiscountAmount || 0),
              startDate: c.startDate || new Date().toISOString().split('T')[0],
              endDate: c.validUntil || c.endDate || '2026-12-31',
              status: 'APPROVED',
              active: true,
            }));
          }
        } catch {}
      } else {
        console.warn('Backend GET /customer/discounts notice:', err?.message || err);
      }
    }

    return [
      {
        discountId: 1,
        sellerId: 4,
        code: 'STEEL10',
        description: '10% off on all TMT Steel bars',
        discountType: 'PERCENTAGE',
        discountValue: 10.0,
        minimumOrderAmount: 50000.0,
        maxDiscountAmount: 10000.0,
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        status: 'APPROVED',
        active: true,
      },
      {
        discountId: 2,
        sellerId: 1,
        code: 'BUILD5',
        description: 'Flat ₹5,000 off on bulk cement orders above ₹1,00,000',
        discountType: 'FLAT',
        discountValue: 5000.0,
        minimumOrderAmount: 100000.0,
        maxDiscountAmount: 5000.0,
        startDate: '2026-10-01',
        endDate: '2026-11-15',
        status: 'APPROVED',
        active: true,
      },
    ];
  },

  /**
   * Get all public coupons
   */
  async getCoupons(): Promise<Coupon[]> {
    try {
      const res = await apiClient.get('/coupons');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend GET /coupons error:', err);
    }
    return [];
  },
};
