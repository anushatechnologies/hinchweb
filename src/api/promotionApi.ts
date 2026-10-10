import { apiClient } from '../services/apiClient';
import type { ActiveVideoBanner } from '../types';

export const promotionApi = {
  /**
   * Fetches the currently active promotional video banner for the website hero.
   * Public endpoint: GET /api/promotions/video/active
   */
  async getActiveVideo(): Promise<ActiveVideoBanner | null> {
    try {
      const res = await apiClient.get('/promotions/video/active');
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      console.warn('Backend GET /promotions/video/active error:', err);
      return null;
    }
  },
};
