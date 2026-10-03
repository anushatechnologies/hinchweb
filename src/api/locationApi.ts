import { apiClient } from '../services/apiClient';
import type { ServiceabilityResult } from '../types';

export const locationApi = {
  /**
   * Check delivery serviceability and lead time for a given pincode.
   * Endpoints:
   * GET /locations/pincode/{pincode}
   * GET /serviceability/check?pincode={pincode}
   */
  async checkServiceability(pincode: string): Promise<ServiceabilityResult> {
    const cleanPin = pincode.trim().replace(/\D/g, '').slice(0, 6);
    if (!cleanPin) {
      throw new Error('Valid 6-digit pincode is required');
    }

    try {
      const res = await apiClient.get(`/locations/pincode/${cleanPin}`);
      const data = res.data?.data || res.data;

      if (data) {
        return {
          success: res.data?.success ?? true,
          pincode: cleanPin,
          city: data.city || res.data?.city || 'Industrial Delivery Hub',
          state: data.state || res.data?.state || '',
          serviceable: Boolean(data.serviceable ?? res.data?.serviceable ?? true),
          estimatedDays: Number(data.estimatedDays ?? res.data?.estimatedDays ?? 2),
          isExpressAvailable: Boolean(data.isExpressAvailable ?? res.data?.isExpressAvailable ?? false),
          area: data.area || res.data?.area,
        };
      }
    } catch (err) {
      // Fallback to query param endpoint
      try {
        const fallbackRes = await apiClient.get('/serviceability/check', {
          params: { pincode: cleanPin },
        });
        const fbData = fallbackRes.data?.data || fallbackRes.data;
        if (fbData) {
          return {
            success: fallbackRes.data?.success ?? true,
            pincode: cleanPin,
            city: fbData.city || fallbackRes.data?.city || 'Industrial Delivery Hub',
            state: fbData.state || fallbackRes.data?.state || '',
            serviceable: Boolean(fbData.serviceable ?? fallbackRes.data?.serviceable ?? true),
            estimatedDays: Number(fbData.estimatedDays ?? fallbackRes.data?.estimatedDays ?? 2),
            isExpressAvailable: Boolean(fbData.isExpressAvailable ?? fallbackRes.data?.isExpressAvailable ?? false),
            area: fbData.area || fallbackRes.data?.area,
          };
        }
      } catch (fallbackErr) {
        console.warn(`Pincode serviceability check failed for ${cleanPin}:`, fallbackErr);
      }
    }

    return {
      pincode: cleanPin,
      city: 'Industrial Delivery Hub',
      state: 'India',
      serviceable: true,
      estimatedDays: 2,
      isExpressAvailable: false,
    };
  },
};
