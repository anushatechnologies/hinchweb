import { apiClient } from '../services/apiClient';
import type { ProductReview, CreateReviewInput } from '../types';

export const reviewApi = {
  /**
   * Get verified buyer reviews for a product
   * Endpoint: GET /reviews/product/{productId}
   */
  async getProductReviews(
    productId: number | string,
    page: number = 1,
    limit: number = 20
  ): Promise<ProductReview[]> {
    try {
      const res = await apiClient.get(`/reviews/product/${productId}`, {
        params: { page, limit },
      });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn(`Backend GET /reviews/product/${productId} warning:`, err);
    }
    return [];
  },

  /**
   * Submit verified buyer review
   * Endpoint: POST /reviews
   */
  async submitReview(input: CreateReviewInput): Promise<ProductReview> {
    const res = await apiClient.post('/reviews', input);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    if (res.data?.reviewId) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to submit review');
  },
};
