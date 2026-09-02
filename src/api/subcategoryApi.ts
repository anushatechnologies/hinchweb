import { apiClient } from '../services/apiClient';
import type { Subcategory, CreateSubcategoryInput } from '../types';
import { mapBackendSubcategory } from './categoryApi';

export const subcategoryApi = {
  // Flow 1 & 2: Get all subcategories (optionally filtered by categoryId)
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

  // Get Subcategory By ID
  async getSubcategoryById(id: number | string): Promise<Subcategory> {
    const res = await apiClient.get(`/subcategories/${id}`);
    if (res.data?.success && res.data?.data) {
      return mapBackendSubcategory(res.data.data);
    }
    if (res.data && (res.data.subcategoryId || res.data.id)) {
      return mapBackendSubcategory(res.data);
    }
    throw new Error(`Subcategory ${id} not found`);
  },

  // Get Subcategory by Slug
  async getSubcategoryBySlug(slug: string, categoryId?: number | string): Promise<Subcategory | null> {
    if (!slug) return null;
    const subs = await this.getSubcategories({ categoryId, active: true });
    const normalized = decodeURIComponent(slug).toLowerCase().trim().replace(/-/g, ' ');

    const match = subs.find(
      (s) =>
        s.slug.toLowerCase() === slug.toLowerCase() ||
        s.slug.toLowerCase().replace(/-/g, ' ') === normalized ||
        s.name.toLowerCase() === normalized ||
        s.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase() ||
        String(s.subcategoryId) === slug
    );

    if (match) return match;

    if (/^\d+$/.test(slug)) {
      try {
        return await this.getSubcategoryById(slug);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Create Subcategory
  async createSubcategory(payload: CreateSubcategoryInput): Promise<Subcategory> {
    const res = await apiClient.post('/subcategories', payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendSubcategory(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to create subcategory');
  },

  // Update Subcategory
  async updateSubcategory(id: number | string, payload: Partial<CreateSubcategoryInput>): Promise<Subcategory> {
    const res = await apiClient.put(`/subcategories/${id}`, payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendSubcategory(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to update subcategory');
  },

  // Delete Subcategory
  async deleteSubcategory(id: number | string): Promise<boolean> {
    const res = await apiClient.delete(`/subcategories/${id}`);
    return res.data?.success ?? true;
  },
};
