import { apiClient } from '../services/apiClient';
import type { KYCDocument, SubmitKYCInput } from '../types';

export const kycApi = {
  // 8.1 Submit KYC Document
  async submitDocument(customerId: number | string = 101, payload: SubmitKYCInput): Promise<KYCDocument> {
    const res = await apiClient.post(`/customers/${customerId}/documents`, payload);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    if (res.data?.documentId || res.data?.id) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to upload document');
  },

  // 8.2 Get Customer KYC Documents
  async getDocuments(customerId: number | string = 101): Promise<KYCDocument[]> {
    try {
      const res = await apiClient.get(`/customers/${customerId}/documents`);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn(`Backend GET /customers/${customerId}/documents error:`, err);
    }
    return [];
  },

  // 8.3 Verify KYC Document (Admin)
  async verifyDocument(documentId: number | string): Promise<boolean> {
    const res = await apiClient.patch(`/documents/${documentId}/verify`);
    return res.data?.success ?? true;
  },

  // 8.4 Reject KYC Document (Admin)
  async rejectDocument(documentId: number | string, reason: string): Promise<boolean> {
    const res = await apiClient.patch(`/documents/${documentId}/reject`, { reason });
    return res.data?.success ?? true;
  },
};
