import { apiClient } from '../services/apiClient';
import type { Quote, Order } from '../types';
import { mapBackendOrder } from './orderApi';

export function mapBackendQuote(raw: any, rfqId: string): Quote {
  const pricePerUnit = Number(raw.pricePerUnit || raw.unitPrice || 0);
  const qty = Number(raw.quantity || 1);
  const subtotal = Number(raw.totalPrice || raw.subtotal || pricePerUnit * qty);
  const gstAmount = Number(raw.gstAmount || Math.round(subtotal * 0.18));
  const deliveryCharge = Number(raw.deliveryCharge || 0);
  const landedCost = Number(raw.landedCost || (subtotal + gstAmount + deliveryCharge));

  return {
    id: String(raw.id || raw.quoteId || ''),
    rfqId,
    seller: {
      id: String(raw.sellerId || raw.vendorId || ''),
      name: raw.sellerCompanyName || raw.sellerName || raw.vendorName || 'Verified Supplier',
      city: raw.city || '',
      state: raw.state || '',
      isVerified: Boolean(raw.isVerified ?? true),
      rating: Number(raw.rating || 4.8),
      successfulOrders: Number(raw.successfulOrders || 0),
      gstinMasked: raw.gstinMasked || '',
    },
    pricePerUnit,
    quantity: qty,
    unit: raw.unit || 'Ton',
    subtotal,
    gstRate: Number(raw.gstRate || 18),
    gstAmount,
    deliveryCharge,
    landedCost,
    deliveryDays: Number(raw.leadTimeDays || raw.deliveryDays || 3),
    paymentTerms: raw.paymentTerms || '30 Days Net Credit',
    validUntil: raw.validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isAccepted: raw.status === 'ACCEPTED',
    createdAt: raw.createdAt || new Date().toISOString(),
    notes: raw.comments || raw.notes || '',
  };
}

export const quoteApi = {
  async getQuotesForRFQ(rfqId: string): Promise<Quote[]> {
    try {
      const res = await apiClient.get(`/rfqs/${rfqId}/quotes`);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map((q: any) => mapBackendQuote(q, rfqId));
      }
      if (Array.isArray(res.data)) {
        return res.data.map((q: any) => mapBackendQuote(q, rfqId));
      }
    } catch (err) {
      console.warn(`Backend GET /rfqs/${rfqId}/quotes error:`, err);
    }
    return [];
  },

  // 8a. Accept Quote
  async acceptQuote(quoteId: string | number): Promise<{ quote: Quote; order: Order }> {
    const res = await apiClient.post(`/rfqs/quotes/${quoteId}/accept`);
    if (res.data?.success && res.data?.data) {
      const quote = mapBackendQuote(res.data.data.quote || res.data.data, '');
      const order = mapBackendOrder(res.data.data.order || res.data.data);
      return { quote, order };
    }
    throw new Error(res.data?.message || 'Failed to accept quote');
  },

  // 8b. Reject Quote
  // Endpoint: POST /rfqs/quotes/{quoteId}/reject
  async rejectQuote(quoteId: string | number, reason: string): Promise<boolean> {
    const res = await apiClient.post(`/rfqs/quotes/${quoteId}/reject`, { reason });
    return res.data?.success ?? true;
  },

  // 8c. Counter Offer
  // Endpoint: POST /rfqs/quotes/{quoteId}/counter
  async counterQuote(
    quoteId: string | number,
    payload: { counterPrice: number; quantity?: number; notes?: string }
  ): Promise<{ quoteId: number | string; unitPrice: number; totalAmount: number; status: string }> {
    const res = await apiClient.post(`/rfqs/quotes/${quoteId}/counter`, payload);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    if (res.data?.quoteId || res.data?.unitPrice) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to submit counter offer');
  },
};

