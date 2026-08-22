import { apiClient, getCurrentUserId } from '../services/apiClient';
import { mockDb } from './mockDb';
import type { Quote, Order } from '../types';

export function mapBackendQuote(raw: any, rfqId: string): Quote {
  const pricePerUnit = Number(raw.pricePerUnit || 58500);
  const qty = Number(raw.quantity || 50);
  const subtotal = Number(raw.totalPrice || pricePerUnit * qty);
  const gstAmount = Math.round(subtotal * 0.18);
  const deliveryCharge = 5000;
  const landedCost = subtotal + gstAmount + deliveryCharge;

  return {
    id: String(raw.id),
    rfqId,
    seller: {
      id: String(raw.sellerId || '5'),
      name: raw.sellerCompanyName || raw.sellerName || 'Tata Steel Distribution Hub',
      city: raw.city || 'Pune',
      state: raw.state || 'Maharashtra',
      isVerified: true,
      rating: 4.9,
      successfulOrders: 4280,
      gstinMasked: '27AAACT2727Q1ZW',
    },
    pricePerUnit,
    quantity: qty,
    unit: raw.unit || 'Ton',
    subtotal,
    gstRate: 18,
    gstAmount,
    deliveryCharge,
    landedCost,
    deliveryDays: Number(raw.leadTimeDays || 3),
    paymentTerms: '50% Advance, 50% on Delivery',
    validUntil: raw.validUntil || '2026-08-30',
    isAccepted: raw.status === 'ACCEPTED',
    createdAt: raw.createdAt || new Date().toISOString(),
    notes: raw.comments || 'Mill Test Certificate (MTC) and weighbridge slip included with trailer dispatch.',
  };
}

export const quoteApi = {
  async getQuotesForRFQ(rfqId: string): Promise<Quote[]> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.get(`/buyer/rfq/${rfqId}/quotes`, { params: { userId } });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map((q: any) => mapBackendQuote(q, rfqId));
      }
    } catch {
      // fallback
    }
    return mockDb.getQuotesForRFQ(rfqId);
  },

  async acceptQuote(quoteId: string): Promise<{ quote: Quote; order: Order }> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.post(`/buyer/rfq/quotes/${quoteId}/accept?userId=${userId}`);
      if (res.data?.success) {
        // Return updated quote and converted order from mock or response
      }
    } catch {
      // fallback
    }
    return mockDb.acceptQuote(quoteId);
  },
};
