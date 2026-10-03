import { apiClient } from '../services/apiClient';
import type {
  CreditApplicationInput,
  CreditApplicationResult,
  CreditLedger,
} from '../types';

export const creditApi = {
  /**
   * Apply for B2B procurement credit line (e.g. 30/60 days credit)
   * Endpoint: POST /credit/apply
   */
  async applyForCredit(payload: CreditApplicationInput): Promise<CreditApplicationResult> {
    const res = await apiClient.post('/credit/apply', payload);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    if (res.data?.applicationId) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to submit credit application');
  },

  /**
   * Get buyer credit ledger, available limits, and statements
   * Endpoint: GET /credit/ledger
   */
  async getCreditLedger(): Promise<CreditLedger> {
    try {
      const res = await apiClient.get('/credit/ledger');
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      if (res.data?.creditLimit !== undefined) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend GET /credit/ledger warning:', err);
    }

    return {
      creditLimit: 0,
      availableLimit: 0,
      utilizedLimit: 0,
      dueAmount: 0,
      dueDate: '',
      status: 'INACTIVE',
      currency: 'INR',
      transactions: [],
    };
  },
};
