import { apiClient } from '../services/apiClient';
import type { TaxInvoice } from '../types';

export function mapBackendInvoice(raw: any): TaxInvoice {
  const taxableTotal = Number(raw.taxableValue || raw.taxableTotal || raw.subtotal || 0);
  const cgstTotal = Number(raw.cgstAmount || raw.cgstTotal || (raw.taxTotal ? raw.taxTotal / 2 : 0));
  const sgstTotal = Number(raw.sgstAmount || raw.sgstTotal || (raw.taxTotal ? raw.taxTotal / 2 : 0));
  const igstTotal = Number(raw.igstAmount || raw.igstTotal || 0);
  const grandTotal = Number(raw.grandTotal || raw.total || (taxableTotal + cgstTotal + sgstTotal + igstTotal));

  const items = Array.isArray(raw.items)
    ? raw.items.map((it: any) => ({
        description: it.description || it.productName || it.title || 'Industrial Material',
        hsnCode: it.hsnCode || '72142090',
        quantity: Number(it.quantity || 1),
        unit: it.unit || 'Piece',
        unitPrice: Number(it.unitPrice || it.price || 0),
        taxableValue: Number(it.taxableValue || (it.unitPrice || it.price || 0) * (it.quantity || 1)),
        gstRate: Number(it.gstRate || 18),
        cgstAmount: Number(it.cgstAmount || 0),
        sgstAmount: Number(it.sgstAmount || 0),
        igstAmount: Number(it.igstAmount || 0),
        totalAmount: Number(it.totalAmount || it.total || 0),
      }))
    : [];

  return {
    id: String(raw.id || raw.invoiceNumber || raw.invoiceId || ''),
    invoiceNumber: raw.invoiceNumber || `INV-${raw.id || raw.orderNumber}`,
    orderId: String(raw.orderId || raw.id || ''),
    orderNumber: raw.orderNumber || `PO-${raw.id}`,
    invoiceDate: raw.invoiceDate || raw.createdAt || new Date().toISOString().split('T')[0],
    seller: {
      companyName: raw.sellerCompanyName || raw.seller?.companyName || 'Authorized Material Distributor',
      gstin: raw.sellerGstin || raw.seller?.gstin || '',
      pan: raw.sellerPan || '',
      address: raw.sellerAddress || '',
      city: raw.sellerCity || '',
      state: raw.sellerState || '',
      pincode: raw.sellerPincode || '',
    },
    buyer: {
      companyName: raw.buyerCompanyName || raw.buyer?.companyName || 'Enterprise Buyer',
      contactPerson: raw.buyerName || raw.buyer?.name || '',
      gstin: raw.buyerGstin || raw.buyer?.gstin || '',
      pan: raw.buyerPan || '',
      address: raw.billingAddress || raw.shippingAddress || '',
      city: raw.city || '',
      state: raw.state || '',
      pincode: raw.pincode || '',
    },
    hinchmart: {
      platformName: 'HinchMart B2B Marketplace (HinchMart Technologies Pvt Ltd)',
      gstin: '36AABCH9988C1Z4',
      cin: 'U72900TG2024PTC188234',
      address: 'Sirisampadha Arcade 1, 5th Floor, Gachibowli, Khajaguda, Hyderabad � 500008, Telangana, India',
    },
    items,
    taxableTotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    freightAmount: Number(raw.freightAmount || raw.deliveryCharge || 0),
    grandTotal,
    paymentStatus: raw.paymentStatus || 'PAID',
    paymentMethod: raw.paymentMethod || 'RAZORPAY',
    eWayBillNo: raw.ewayBillNumber || raw.eWayBillNo,
    qrCodeMock: raw.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=IRN-HINCH-${raw.invoiceNumber || raw.id}`,
  };
}

export const invoiceApi = {
  async getInvoices(): Promise<TaxInvoice[]> {
    try {
      const res = await apiClient.get('/orders');
      if (res.data?.success && res.data?.data) {
        const rawOrders = Array.isArray(res.data.data) ? res.data.data : res.data.data.content || [];
        return rawOrders.map((o: any) => mapBackendInvoice({ ...o, invoiceNumber: `INV-${o.id || o.orderNumber}` }));
      }
      if (Array.isArray(res.data)) {
        return res.data.map((o: any) => mapBackendInvoice({ ...o, invoiceNumber: `INV-${o.id || o.orderNumber}` }));
      }
    } catch (err) {
      console.warn('Backend GET /orders for invoices error:', err);
    }
    return [];
  },

  async getInvoiceById(id: string): Promise<TaxInvoice | null> {
    try {
      const numId = Number(id.replace(/\D/g, '')) || id;
      const res = await apiClient.get(`/orders/${numId}/invoice`);
      if (res.data?.success && res.data?.data) {
        return mapBackendInvoice(res.data.data);
      }
      if (res.data?.invoiceNumber) {
        return mapBackendInvoice(res.data);
      }
    } catch (err) {
      console.warn(`Backend GET /orders/${id}/invoice error:`, err);
    }
    return null;
  },
};
