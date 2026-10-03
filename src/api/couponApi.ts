import { apiClient } from '../services/apiClient';
import type { Coupon } from '../types';

export const couponApi = {
  /**
   * Get all active public coupons and bulk promotions
   * Endpoint: GET /coupons
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

  /**
   * Get applicable coupons for a specific cart order total
   * Endpoint: GET /coupons/eligible?cartTotal={cartTotal}
   */
  async getEligibleCoupons(cartTotal: number): Promise<Coupon[]> {
    try {
      const res = await apiClient.get('/coupons/eligible', {
        params: { cartTotal },
      });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend GET /coupons/eligible error:', err);
    }
    return [];
  },
};
