import { apiClient, getCurrentUserId } from '../services/apiClient';
import { mockDb } from './mockDb';
import type { RFQ, ProductUnit } from '../types';

export interface CreateRFQInput {
  productName: string;
  category: string;
  brandPreference: string;
  quantity: number;
  unit: ProductUnit;
  deliveryLocation: string;
  deliveryPincode: string;
  requiredByDate: string;
  targetPrice?: string;
  specifications?: string;
  attachmentName?: string;
  notes?: string;
}

export function mapBackendRfq(raw: any): RFQ {
  return {
    id: String(raw.id),
    rfqNumber: raw.rfqNumber || `RFQ-2026-0820-${raw.id}`,
    productName: raw.title || raw.productName || 'Bulk Structural Material Procurement',
    category: raw.categoryName || raw.category || 'Steel Rods & Rebars',
    brandPreference: raw.brandPreference || 'Tata Tiscon / Jindal Panther',
    quantity: Number(raw.quantity || 50),
    unit: raw.unit || 'Ton',
    deliveryLocation: raw.deliveryLocation || 'Hinjewadi Phase 2, Pune',
    deliveryPincode: raw.deliveryPincode || '411057',
    requiredByDate: raw.requiredByDate || '2026-09-10',
    targetPrice: raw.targetPrice ? Number(raw.targetPrice) : 59000,
    specifications: raw.specifications || 'Conforming to IS 1786:2008 with Mill Test Certificates.',
    notes: raw.notes || 'Priority construction procurement request.',
    status: (raw.status || 'Quotes Received') as any,
    quotesCount: Number(raw.quotesCount || 3),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export const rfqApi = {
  async getRFQs(): Promise<RFQ[]> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.get('/buyer/rfqs', { params: { userId } });
      if (res.data?.success && res.data?.data) {
        const rawList = Array.isArray(res.data.data) ? res.data.data : res.data.data.content || [];
        return rawList.map(mapBackendRfq);
      }
    } catch {
      // fallback
    }
    return mockDb.getRFQs();
  },

  async getRFQById(id: string): Promise<RFQ> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.get(`/buyer/rfqs/${id}`, { params: { userId } });
      if (res.data?.success && res.data?.data) {
        return mapBackendRfq(res.data.data);
      }
    } catch {}
    const rfq = await mockDb.getRFQById(id);
    if (!rfq) throw new Error('RFQ not found');
    return rfq;
  },

  async createRFQ(payload: CreateRFQInput): Promise<RFQ> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.post(`/rfq?userId=${userId}`, {
        title: payload.productName,
        categoryId: 1,
        quantity: payload.quantity,
        unit: payload.unit,
        targetPrice: payload.targetPrice ? Number(payload.targetPrice) : 59000,
        deliveryLocation: `${payload.deliveryLocation}, ${payload.deliveryPincode}`,
        requiredByDate: payload.requiredByDate || '2026-09-10',
      });

      if (res.data?.success && res.data?.data) {
        return mapBackendRfq({
          ...res.data.data,
          title: payload.productName,
          category: payload.category,
          brandPreference: payload.brandPreference,
          quantity: payload.quantity,
          unit: payload.unit,
          targetPrice: payload.targetPrice,
          deliveryLocation: payload.deliveryLocation,
          deliveryPincode: payload.deliveryPincode,
          specifications: payload.specifications,
        });
      }
    } catch (err) {
      console.warn('Backend create RFQ failed, broadcasting locally:', err);
    }

    return mockDb.createRFQ({
      productName: payload.productName,
      category: payload.category,
      brandPreference: payload.brandPreference,
      quantity: payload.quantity,
      unit: payload.unit,
      deliveryLocation: payload.deliveryLocation,
      deliveryPincode: payload.deliveryPincode,
      requiredByDate: payload.requiredByDate,
      targetPrice: payload.targetPrice ? Number(payload.targetPrice) : undefined,
      specifications: payload.specifications || '',
      attachmentName: payload.attachmentName,
      notes: payload.notes,
    });
  },
};
