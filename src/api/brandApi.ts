import { apiClient } from '../services/apiClient';
import type { Brand } from '../types';

export function mapBackendBrand(raw: any): Brand {
  const brandId = Number(raw.brandId || raw.id || 0);
  return {
    id: String(brandId || raw.name || ''),
    brandId,
    subcategoryId: raw.subcategoryId ? Number(raw.subcategoryId) : undefined,
    subcategoryName: raw.subcategoryName || '',
    categoryId: raw.categoryId ? Number(raw.categoryId) : undefined,
    categoryName: raw.categoryName || '',
    name: raw.name || '',
    slug: raw.slug || (raw.name ? raw.name.toLowerCase().replace(/\s+/g, '-') : `brand-${brandId}`),
    imageUrl: raw.imageUrl || raw.logo || '',
    logo: raw.logo || raw.imageUrl || '',
    sortOrder: raw.sortOrder ?? 1,
    productCount: Number(raw.productCount ?? 0),
    active: raw.active ?? true,
    createdAt: raw.createdAt,
  };
}

export const brandApi = {
  // Flow 2: Get Brands (optionally filtered by subcategoryId or categoryId)
  async getBrands(params?: {
    subcategoryId?: number | string;
    categoryId?: number | string;
    active?: boolean;
  }): Promise<Brand[]> {
    try {
      const queryParams: Record<string, any> = {};
      if (params?.subcategoryId) queryParams.subcategoryId = params.subcategoryId;
      if (params?.categoryId) queryParams.categoryId = params.categoryId;
      if (params?.active !== undefined) queryParams.active = params.active;

      const res = await apiClient.get('/brands', { params: queryParams });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map(mapBackendBrand);
      }
      if (Array.isArray(res.data)) {
        return res.data.map(mapBackendBrand);
      }
    } catch (err) {
      console.warn('Backend GET /brands warning:', err);
    }
    return [];
  },

  // Get Brand by ID
  async getBrandById(id: number | string): Promise<Brand> {
    const res = await apiClient.get(`/brands/${id}`);
    if (res.data?.success && res.data?.data) {
      return mapBackendBrand(res.data.data);
    }
    if (res.data && !res.data.success && (res.data.brandId || res.data.id)) {
      return mapBackendBrand(res.data);
    }
    throw new Error(`Brand ${id} not found`);
  },

  // Get Brand by Slug or Name
  async getBrandBySlug(slug: string): Promise<Brand | null> {
    if (!slug) return null;
    const brands = await this.getBrands();
    const normalized = decodeURIComponent(slug).toLowerCase().trim().replace(/-/g, ' ');

    const match = brands.find(
      (b) =>
        b.slug.toLowerCase() === slug.toLowerCase() ||
        b.slug.toLowerCase().replace(/-/g, ' ') === normalized ||
        b.name.toLowerCase() === normalized ||
        b.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase() ||
        String(b.brandId) === slug
    );

    if (match) return match;

    if (/^\d+$/.test(slug)) {
      try {
        return await this.getBrandById(slug);
      } catch {
        return null;
      }
    }
    return null;
  },
};
