import { apiClient, getCurrentUserId } from '../services/apiClient';
import { mockDb } from './mockDb';
import type { TaxInvoice } from '../types';

export function mapBackendInvoice(raw: any): TaxInvoice {
  const taxableTotal = Number(raw.taxableValue || raw.taxableTotal || 304000);
  const cgstTotal = Number(raw.cgstAmount || raw.cgstTotal || 27360);
  const sgstTotal = Number(raw.sgstAmount || raw.sgstTotal || 27360);
  const igstTotal = Number(raw.igstAmount || raw.igstTotal || 0);
  const grandTotal = Number(raw.grandTotal || taxableTotal + cgstTotal + sgstTotal + igstTotal);

  return {
    id: String(raw.id || raw.invoiceNumber || 'INV-2026-000115'),
    invoiceNumber: raw.invoiceNumber || 'INV-2026-000115',
    orderId: String(raw.orderId || '115'),
    orderNumber: raw.orderNumber || 'ORD-2026-0820-015',
    invoiceDate: raw.invoiceDate || '2026-08-20',
    seller: {
      companyName: raw.sellerCompanyName || 'Tata Steel Distribution Hub Pvt Ltd',
      gstin: raw.sellerGstin || '27AAACT2727Q1ZW',
      pan: 'AAACT2727Q',
      address: 'Plot 12, Industrial Logistics Zone, Chakan',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '410501',
    },
    buyer: {
      companyName: raw.buyerCompanyName || 'Apex Infra Projects Pvt Ltd',
      contactPerson: raw.buyerName || 'Rajesh Sharma',
      gstin: raw.buyerGstin || '27AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      address: raw.billingAddress || raw.shippingAddress || 'Plot 45, MIDC Industrial Area, Phase 2',
      city: raw.city || 'Pune',
      state: raw.state || 'Maharashtra',
      pincode: raw.pincode || '411057',
    },
    hinchmart: {
      platformName: 'HinchMart B2B Marketplace (HinchMart Technologies Pvt Ltd)',
      gstin: '36AABCH9988C1Z4',
      cin: 'U72900TG2024PTC188234',
      address: 'Sirisampadha Arcade 1, 5th Floor, Gachibowli, Khajaguda, Hyderabad – 500008, Telangana, India',
    },
    items: [
      {
        description: 'TATA Tiscon 550D TMT Bar (12mm) — Fe550D High Ductility Rebar',
        hsnCode: '72142090',
        quantity: 5,
        unit: 'Ton',
        unitPrice: 60800,
        taxableValue: taxableTotal,
        gstRate: 18,
        cgstAmount: cgstTotal,
        sgstAmount: sgstTotal,
        igstAmount: 0,
        totalAmount: grandTotal,
      },
    ],
    taxableTotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    freightAmount: 2500,
    grandTotal,
    paymentStatus: raw.paymentStatus || 'PAID',
    paymentMethod: raw.paymentMethod || '45-Day Enterprise Credit',
    eWayBillNo: '3410-9988-7712',
    qrCodeMock: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=IRN-HINCH-2026-000115',
  };
}

export const invoiceApi = {
  async getInvoices(): Promise<TaxInvoice[]> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.get('/orders', { params: { userId } });
      if (res.data?.success && res.data?.data) {
        const rawOrders = Array.isArray(res.data.data) ? res.data.data : res.data.data.content || [];
        return rawOrders.map((o: any) => mapBackendInvoice({ ...o, invoiceNumber: `INV-${o.id || o.orderNumber}` }));
      }
    } catch {
      // fallback
    }
    return mockDb.getInvoices();
  },

  async getInvoiceById(id: string): Promise<TaxInvoice | null> {
    const userId = getCurrentUserId();
    try {
      const numId = Number(id.replace(/\D/g, '')) || 2;
      const res = await apiClient.get(`/orders/${numId}/invoice`, { params: { userId } });
      if (res.data?.success && res.data?.data) {
        return mapBackendInvoice(res.data.data);
      }
    } catch {
      // fallback
    }
    return mockDb.getInvoiceById(id);
  },
};
