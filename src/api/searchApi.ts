import { apiClient } from '../services/apiClient';
import type { SearchSuggestions } from '../types';

export const searchApi = {
  async getSuggestions(query: string): Promise<SearchSuggestions> {
    if (!query || query.trim().length === 0) {
      return { suggestions: [], matchingCategories: [], matchingBrands: [] };
    }

    try {
      const res = await apiClient.get('/search/suggestions', {
        params: { q: query.trim() },
      });
      if (res.data?.success && res.data?.data) {
        return {
          suggestions: res.data.data.suggestions || [],
          matchingCategories: res.data.data.matchingCategories || [],
          matchingBrands: res.data.data.matchingBrands || [],
        };
      }
      if (res.data?.suggestions) {
        return {
          suggestions: res.data.suggestions || [],
          matchingCategories: res.data.matchingCategories || [],
          matchingBrands: res.data.matchingBrands || [],
        };
      }
    } catch (err) {
      console.warn('Backend GET /search/suggestions error:', err);
    }

    return { suggestions: [], matchingCategories: [], matchingBrands: [] };
  },
};
