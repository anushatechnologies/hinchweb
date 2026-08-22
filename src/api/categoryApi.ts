import { apiClient } from '../services/apiClient';
import { mockDb } from './mockDb';
import type { Category, Brand } from '../types';

export function mapBackendCategory(raw: any): Category {
  return {
    id: String(raw.id),
    name: raw.name,
    slug: raw.slug || `category-${raw.id}`,
    iconName: 'Building',
    description: raw.description || `High grade ${raw.name} for construction & infrastructure.`,
    image:
      raw.imageUrl ||
      raw.image ||
      'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600',
    subcategories: Array.isArray(raw.subcategories)
      ? raw.subcategories.map((sub: any) => ({
          id: String(sub.id),
          name: sub.name,
          slug: sub.slug || `sub-${sub.id}`,
          itemCount: 15,
        }))
      : [],
  };
}

export const categoryApi = {
  async getCategories(): Promise<Category[]> {
    try {
      const res = await apiClient.get('/categories');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map(mapBackendCategory);
      }
    } catch (err) {
      console.warn('Backend /categories failed, using fallback categories:', err);
    }
    return mockDb.getCategories();
  },

  async getBrands(): Promise<Brand[]> {
    try {
      const res = await apiClient.get('/brands');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map((b: any) => ({
          id: String(b.id),
          name: b.name || b.brandName,
          logo: b.logoUrl || b.logo || b.imageUrl || '',
          category: b.category || 'Steel & Structural Materials',
          productCount: b.productCount || 40,
        }));
      }
    } catch {
      // fallback
    }
    return mockDb.getBrands();
  },
};
