import { apiClient } from '../services/apiClient';
import type { RFQ, CreateRFQInput } from '../types';

export function mapBackendRFQ(raw: any): RFQ {
  const id = String(raw.rfqId || raw.id || '');
  return {
    id,
    rfqId: raw.rfqId,
    rfqNumber: raw.rfqNumber || `RFQ-${id}`,
    title: raw.title || raw.productName || 'Material Requirement',
    productName: raw.productName || raw.title || 'Material Requirement',
    category: raw.category || 'Industrial Materials',
    brandPreference: raw.brandPreference || 'Any Verified Primary Brand',
    quantity: Number(raw.quantity || 1),
    unit: raw.unit || 'Ton',
    targetPrice: raw.targetPrice ? Number(raw.targetPrice) : undefined,
    targetBudget: raw.targetBudget ? Number(raw.targetBudget) : undefined,
    deliveryLocation: raw.deliveryLocation || '',
    requiredByDate: raw.requiredByDate || new Date().toISOString().split('T')[0],
    specifications: raw.specifications || '',
    notes: raw.notes,
    attachmentName: raw.attachmentName,
    attachmentUrl: raw.attachmentUrl,
    status: raw.status || 'OPEN',
    quotesCount: Number(raw.quotesCount || (raw.quotes ? raw.quotes.length : 0)),
    quotes: raw.quotes || [],
    createdAt: raw.createdAt || new Date().toISOString(),
    expiresAt: raw.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    technicalGrade: raw.technicalGrade,
    mtcRequired: Boolean(raw.mtcRequired ?? true),
    paymentTerms: raw.paymentTerms,
    siteAccess: raw.siteAccess,
  };
}

export const rfqApi = {
  // 12.1 Submit B2B Bulk RFQ
  async createRFQ(payload: CreateRFQInput): Promise<RFQ> {
    const res = await apiClient.post('/rfqs', payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendRFQ(res.data.data);
    }
    if (res.data?.rfqNumber || res.data?.id) {
      return mapBackendRFQ(res.data);
    }
    throw new Error(res.data?.message || 'Failed to submit RFQ');
  },

  // 12.2 Get User RFQs
  async getRFQs(): Promise<RFQ[]> {
    try {
      const res = await apiClient.get('/rfqs');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map(mapBackendRFQ);
      }
      if (Array.isArray(res.data)) {
        return res.data.map(mapBackendRFQ);
      }
    } catch (err) {
      console.warn('Backend GET /rfqs error:', err);
    }
    return [];
  },

  // 12.3 Get RFQ Details By ID
  async getRFQById(id: number | string): Promise<RFQ> {
    const res = await apiClient.get(`/rfqs/${id}`);
    if (res.data?.success && res.data?.data) {
      return mapBackendRFQ(res.data.data);
    }
    if (res.data?.rfqNumber || res.data?.id) {
      return mapBackendRFQ(res.data);
    }
    throw new Error(`RFQ ${id} not found`);
  },
};
