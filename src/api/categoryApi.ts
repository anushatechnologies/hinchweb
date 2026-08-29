import { apiClient } from '../services/apiClient';
import type { Category, Subcategory, Brand, CreateCategoryInput, CreateSubcategoryInput } from '../types';

export function mapBackendSubcategory(raw: any): Subcategory {
  const id = String(raw.subcategoryId || raw.id || '');
  return {
    id,
    subcategoryId: Number(raw.subcategoryId || raw.id || 0),
    categoryId: raw.categoryId ? Number(raw.categoryId) : undefined,
    name: raw.name || '',
    slug: raw.slug || `subcategory-${id}`,
    imageUrl: raw.imageUrl || raw.image || '',
    active: raw.active ?? true,
    sortOrder: raw.sortOrder ?? 1,
    productCount: Number(raw.productCount ?? raw.itemCount ?? 0),
    itemCount: Number(raw.productCount ?? raw.itemCount ?? 0),
    createdAt: raw.createdAt,
  };
}

export function mapBackendCategory(raw: any): Category {
  const id = String(raw.categoryId || raw.id || '');
  return {
    id,
    categoryId: Number(raw.categoryId || raw.id || 0),
    name: raw.name || '',
    slug: raw.slug || `category-${id}`,
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
  // 1.1 Get All Categories (with Nested Subcategories)
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

  // 1.2 Get Category By Slug, Name, or ID
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

  // 1.3 Get Category By Numeric ID
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

  // 1.4 Create Category (Admin)
  async createCategory(payload: CreateCategoryInput): Promise<Category> {
    const res = await apiClient.post('/categories', payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendCategory(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to create category');
  },

  // 1.5 Update Category
  async updateCategory(id: number | string, payload: Partial<CreateCategoryInput>): Promise<Category> {
    const res = await apiClient.put(`/categories/${id}`, payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendCategory(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to update category');
  },

  // 1.6 Delete Category
  async deleteCategory(id: number | string): Promise<boolean> {
    const res = await apiClient.delete(`/categories/${id}`);
    return res.data?.success ?? true;
  },

  // 2.1 Get All Subcategories (optionally filtered by categoryId)
  async getSubcategories(params?: { categoryId?: number; active?: boolean }): Promise<Subcategory[]> {
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

  // 2.2 Get Subcategory By ID
  async getSubcategoryById(id: number | string): Promise<Subcategory> {
    const res = await apiClient.get(`/subcategories/${id}`);
    if (res.data?.success && res.data?.data) {
      return mapBackendSubcategory(res.data.data);
    }
    throw new Error(`Subcategory ${id} not found`);
  },

  // 2.3 Create Subcategory
  async createSubcategory(payload: CreateSubcategoryInput): Promise<Subcategory> {
    const res = await apiClient.post('/subcategories', payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendSubcategory(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to create subcategory');
  },

  // 2.4 Update Subcategory
  async updateSubcategory(id: number | string, payload: Partial<CreateSubcategoryInput>): Promise<Subcategory> {
    const res = await apiClient.put(`/subcategories/${id}`, payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendSubcategory(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to update subcategory');
  },

  // 2.5 Delete Subcategory
  async deleteSubcategory(id: number | string): Promise<boolean> {
    const res = await apiClient.delete(`/subcategories/${id}`);
    return res.data?.success ?? true;
  },

  // 3.1 Get Brands
  async getBrands(): Promise<Brand[]> {
    try {
      const res = await apiClient.get('/brands');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map((b: any) => ({
          id: String(b.brandId || b.id || b.name),
          name: b.name || '',
          logo: b.logo || b.imageUrl || '',
          category: b.category,
          productCount: Number(b.productCount || 0),
        }));
      }
    } catch {
      // /brands endpoint may not exist on backend; handled gracefully by extracting from products
    }
    return [];
  },
};
