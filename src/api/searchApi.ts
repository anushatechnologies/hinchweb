import { apiClient } from '../services/apiClient';
import type { SearchSuggestions, SearchSuggestionItem } from '../types';

export const searchApi = {
  async getSuggestions(query: string): Promise<SearchSuggestions> {
    if (!query || query.trim().length === 0) {
      return { suggestions: [], matchingCategories: [], matchingBrands: [], structuredSuggestions: [] };
    }

    const trimmed = query.trim();

    // 1. Try /products/search-suggestions (Flow 4)
    try {
      const res = await apiClient.get('/products/search-suggestions', {
        params: { query: trimmed },
      });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        const structured: SearchSuggestionItem[] = res.data.data.map((item: any) => ({
          type: item.type || 'PRODUCT',
          id: item.id || item.productId || item.brandId || item.categoryId || 0,
          title: item.title || item.name || '',
          subtitle: item.subtitle || '',
          link: item.link || (item.type === 'BRAND' ? `/catalog?brand=${encodeURIComponent(item.title)}` : `/product/${item.id}`),
        }));

        const matchingBrands = structured.filter((s) => s.type === 'BRAND').map((s) => s.title);
        const matchingCategories = structured.filter((s) => s.type === 'CATEGORY').map((s) => s.title);
        const suggestions = structured.filter((s) => s.type === 'PRODUCT').map((s) => s.title);

        return {
          suggestions: suggestions.length > 0 ? suggestions : [trimmed],
          matchingCategories,
          matchingBrands,
          structuredSuggestions: structured,
        };
      }
    } catch (err) {
      console.warn('Backend GET /products/search-suggestions warning:', err);
    }

    // 2. Fallback to /search/suggestions
    try {
      const res = await apiClient.get('/search/suggestions', {
        params: { q: trimmed },
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
      console.warn('Backend GET /search/suggestions fallback warning:', err);
    }

    return { suggestions: [], matchingCategories: [], matchingBrands: [] };
  },
};
