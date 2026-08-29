import { apiClient } from '../services/apiClient';
import type { Banner, CreateBannerInput } from '../types';

export const bannerApi = {
  async getBanners(active: boolean = true): Promise<Banner[]> {
    try {
      const res = await apiClient.get('/banners', { params: { active } });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map((b: any) => ({
          bannerId: b.bannerId || b.id,
          id: String(b.bannerId || b.id),
          title: b.title || '',
          subtitle: b.subtitle || '',
          imageUrl: b.imageUrl || '',
          targetUrl: b.targetUrl || '/catalog',
          active: b.active ?? true,
          sortOrder: b.sortOrder ?? 1,
        }));
      }
      if (Array.isArray(res.data)) {
        return res.data.map((b: any) => ({
          bannerId: b.bannerId || b.id,
          id: String(b.bannerId || b.id),
          title: b.title || '',
          subtitle: b.subtitle || '',
          imageUrl: b.imageUrl || '',
          targetUrl: b.targetUrl || '/catalog',
          active: b.active ?? true,
          sortOrder: b.sortOrder ?? 1,
        }));
      }
    } catch (err) {
      console.warn('Backend GET /banners error:', err);
    }
    return [];
  },

  async createBanner(payload: CreateBannerInput): Promise<Banner> {
    const res = await apiClient.post('/banners', payload);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to create banner');
  },

  async uploadBannerImage(bannerId: number | string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post(`/banners/${bannerId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data?.imageUrl || res.data?.imageUrl || '';
  },
};
