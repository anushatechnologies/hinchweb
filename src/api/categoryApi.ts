import { apiClient } from '../services/apiClient';
import type { Category, Subcategory, Brand, CreateCategoryInput, CreateSubcategoryInput } from '../types';
import { brandApi } from './brandApi';

export function mapBackendSubcategory(raw: any): Subcategory {
  const subcategoryId = Number(raw.subcategoryId || raw.id || 0);
  const id = String(subcategoryId || '');
  return {
    id,
    subcategoryId,
    categoryId: Number(raw.categoryId || 0),
    categoryName: raw.categoryName || '',
    name: raw.name || '',
    slug: raw.slug || (raw.name ? raw.name.toLowerCase().replace(/\s+/g, '-') : `subcategory-${id}`),
    imageUrl: raw.imageUrl || raw.image || '',
    image: raw.imageUrl || raw.image || '',
    active: raw.active ?? true,
    sortOrder: raw.sortOrder ?? 1,
    productCount: Number(raw.productCount ?? raw.itemCount ?? 0),
    itemCount: Number(raw.productCount ?? raw.itemCount ?? 0),
    brands: Array.isArray(raw.brands) ? raw.brands : undefined,
    createdAt: raw.createdAt,
  };
}

export function mapBackendCategory(raw: any): Category {
  const categoryId = Number(raw.categoryId || raw.id || 0);
  const id = String(categoryId || '');
  return {
    id,
    categoryId,
    name: raw.name || '',
    slug: raw.slug || (raw.name ? raw.name.toLowerCase().replace(/\s+/g, '-') : `category-${id}`),
    iconName: raw.iconName || 'Building',
    description: raw.description || `Industrial ${raw.name} products for business procurement`,
    imageUrl: raw.imageUrl || raw.image || '',
    image: raw.imageUrl || raw.image || '',
    active: raw.active ?? true,
    sortOrder: raw.sortOrder ?? 1,
    productCount: Number(raw.productCount ?? 0),
    subcategories: Array.isArray(raw.subcategories)
      ? raw.subcategories.map(mapBackendSubcategory)
      : [],
    createdAt: raw.createdAt,
  };
}

export const categoryApi = {
  // Flow 1: Mega-Menu / Header Navigation (Load Full Tree: GET /api/categories?includeSubcategories=true)
  async getCategories(params: { active?: boolean; includeSubcategories?: boolean } = { includeSubcategories: true }): Promise<Category[]> {
    try {
      const res = await apiClient.get('/categories', {
        params: {
          active: params.active ?? true,
          includeSubcategories: params.includeSubcategories ?? true,
        },
      });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map(mapBackendCategory);
      }
      if (Array.isArray(res.data)) {
        return res.data.map(mapBackendCategory);
      }
    } catch (err) {
      console.warn('Backend GET /categories warning:', err);
    }
    return [];
  },

  // Get Category By Slug, Name, or ID
  async getCategoryBySlug(slugOrId: string): Promise<Category | null> {
    if (!slugOrId) return null;
    const categories = await this.getCategories({ includeSubcategories: true });
    const normalized = decodeURIComponent(slugOrId).toLowerCase().trim().replace(/-/g, ' ');

    const match = categories.find(
      (c) =>
        c.slug.toLowerCase() === slugOrId.toLowerCase() ||
        c.slug.toLowerCase().replace(/-/g, ' ') === normalized ||
        c.name.toLowerCase() === normalized ||
        c.name.toLowerCase().replace(/\s+/g, '-') === slugOrId.toLowerCase() ||
        String(c.categoryId) === slugOrId ||
        String(c.id) === slugOrId
    );

    if (match) {
      // If nested subcategories are empty, attempt to fetch /subcategories?categoryId=...
      if (!match.subcategories || match.subcategories.length === 0) {
        try {
          const subs = await this.getSubcategories({ categoryId: match.categoryId });
          if (subs.length > 0) {
            match.subcategories = subs;
          }
        } catch {
          // ignore
        }
      }
      return match;
    }

    if (/^\d+$/.test(slugOrId)) {
      try {
        return await this.getCategoryById(slugOrId);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Get Category By Numeric ID
  async getCategoryById(id: number | string): Promise<Category> {
    const res = await apiClient.get(`/categories/${id}`);
    if (res.data?.success && res.data?.data) {
      return mapBackendCategory(res.data.data);
    }
    if (res.data && !res.data.success && res.data.categoryId) {
      return mapBackendCategory(res.data);
    }
    throw new Error(`Category ${id} not found`);
  },

  // Create Category (Admin)
  async createCategory(payload: CreateCategoryInput): Promise<Category> {
    const res = await apiClient.post('/categories', payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendCategory(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to create category');
  },

  // Update Category
  async updateCategory(id: number | string, payload: Partial<CreateCategoryInput>): Promise<Category> {
    const res = await apiClient.put(`/categories/${id}`, payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendCategory(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to update category');
  },

  // Delete Category
  async deleteCategory(id: number | string): Promise<boolean> {
    const res = await apiClient.delete(`/categories/${id}`);
    return res.data?.success ?? true;
  },

  // Subcategories helper
  async getSubcategories(params?: { categoryId?: number | string; active?: boolean }): Promise<Subcategory[]> {
    try {
      const res = await apiClient.get('/subcategories', { params });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map(mapBackendSubcategory);
      }
      if (Array.isArray(res.data)) {
        return res.data.map(mapBackendSubcategory);
      }
    } catch (err) {
      console.warn('Backend GET /subcategories warning:', err);
    }
    return [];
  },

  async getSubcategoryById(id: number | string): Promise<Subcategory> {
    const res = await apiClient.get(`/subcategories/${id}`);
    if (res.data?.success && res.data?.data) {
      return mapBackendSubcategory(res.data.data);
    }
    throw new Error(`Subcategory ${id} not found`);
  },

  async createSubcategory(payload: CreateSubcategoryInput): Promise<Subcategory> {
    const res = await apiClient.post('/subcategories', payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendSubcategory(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to create subcategory');
  },

  async updateSubcategory(id: number | string, payload: Partial<CreateSubcategoryInput>): Promise<Subcategory> {
    const res = await apiClient.put(`/subcategories/${id}`, payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendSubcategory(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to update subcategory');
  },

  async deleteSubcategory(id: number | string): Promise<boolean> {
    const res = await apiClient.delete(`/subcategories/${id}`);
    return res.data?.success ?? true;
  },

  // Brands helper
  async getBrands(params?: { subcategoryId?: number | string; active?: boolean }): Promise<Brand[]> {
    return brandApi.getBrands(params);
  },
};
