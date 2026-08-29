import { apiClient } from '../services/apiClient';
import type {
  Order,
  CheckoutPreview,
  PreviewCheckoutInput,
  PlaceOrderInput,
  OrderTracking,
  TaxInvoice,
} from '../types';

export function mapBackendOrder(raw: any): Order {
  const id = String(raw.orderId || raw.id || '');
  const items = Array.isArray(raw.items)
    ? raw.items.map((it: any) => ({
        id: String(it.orderItemId || it.id || ''),
        productId: String(it.productId || ''),
        title: it.productName || it.title || 'Industrial Material',
        productName: it.productName || it.title || 'Industrial Material',
        brand: it.brand || '',
        price: Number(it.unitPrice || it.price || 0),
        unitPrice: Number(it.unitPrice || it.price || 0),
        quantity: Number(it.quantity || 1),
        unit: it.unit || 'Piece',
        total: Number(it.totalPrice || (it.unitPrice || 0) * (it.quantity || 1)),
        gstRate: Number(it.gstRate || 18),
        hsnCode: it.hsnCode || '',
        imageUrl: it.imageUrl || '',
      }))
    : [];

  const trackingTimeline = Array.isArray(raw.trackingTimeline)
    ? raw.trackingTimeline
    : [
        {
          status: raw.status || 'ORDER_CONFIRMED',
          title: 'Order Placed',
          description: 'Purchase order received by primary mills.',
          timestamp: raw.createdAt || new Date().toISOString(),
          isCompleted: true,
        },
      ];

  const deliveryAddress = raw.deliveryAddress
    ? {
        id: String(raw.deliveryAddress.addressId || raw.deliveryAddress.id || '1'),
        siteName: raw.deliveryAddress.siteName || 'Project Site',
        recipientName: raw.deliveryAddress.recipientName || 'Site Engineer',
        contactName: raw.deliveryAddress.recipientName || 'Site Engineer',
        mobile: raw.deliveryAddress.mobile || '9876543210',
        phone: raw.deliveryAddress.mobile || '9876543210',
        companyName: raw.deliveryAddress.companyName || 'Enterprise Buyer',
        gstin: raw.deliveryAddress.gstin || '',
        addressLine1: raw.deliveryAddress.addressLine1 || '',
        city: raw.deliveryAddress.city || '',
        state: raw.deliveryAddress.state || '',
        pincode: raw.deliveryAddress.pincode || '',
        addressType: 'Site / Project' as const,
        isDefaultDelivery: true,
        isDefaultBilling: false,
      }
    : {
        id: '1',
        siteName: 'Project Site',
        recipientName: 'Site Engineer',
        contactName: 'Site Engineer',
        mobile: '9876543210',
        phone: '9876543210',
        companyName: 'Enterprise Buyer',
        gstin: '',
        addressLine1: 'Main Project Gate',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        addressType: 'Site / Project' as const,
        isDefaultDelivery: true,
        isDefaultBilling: false,
      };

  return {
    id,
    orderId: raw.orderId,
    orderNumber: raw.orderNumber || `PO-${id}`,
    poNumber: raw.poNumber,
    customerId: raw.customerId,
    createdAt: raw.createdAt || new Date().toISOString(),
    status: raw.status || 'ORDER_CONFIRMED',
    paymentMethod: raw.paymentMethod || 'RAZORPAY',
    paymentStatus: raw.paymentStatus || 'PAID',
    items,
    subtotal: Number(raw.subtotal || 0),
    taxTotal: Number(raw.taxTotal || raw.gstTotal || 0),
    gstTotal: Number(raw.taxTotal || raw.gstTotal || 0),
    deliveryCharge: Number(raw.shippingTotal || raw.deliveryCharge || 0),
    shippingTotal: Number(raw.shippingTotal || raw.deliveryCharge || 0),
    discountTotal: Number(raw.discountTotal || 0),
    grandTotal: Number(raw.total || raw.grandTotal || 0),
    deliveryAddress,
    billingAddress: deliveryAddress,
    estimatedDelivery: raw.estimatedDelivery || 'In Transit (2-3 days)',
    trackingTimeline,
    invoiceId: raw.invoiceId,
    invoiceNumber: raw.invoiceNumber || `INV-${id}`,
    invoiceUrl: raw.invoiceUrl,
    ewayBillNumber: raw.ewayBillNumber,
    mtcDocumentUrl: raw.mtcDocumentUrl,
    weightTons: raw.weightTons,
    craneUnloadingRequired: Boolean(raw.craneUnloadingRequired),
  };
}

export const orderApi = {
  // 11.1 Checkout Preview & Summary
  async previewCheckout(payload: PreviewCheckoutInput): Promise<CheckoutPreview> {
    const res = await apiClient.post('/checkout/preview', payload);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    if (res.data?.subtotal !== undefined) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to calculate checkout preview');
  },

  // 11.2 Place Final Order
  async placeOrder(payload: PlaceOrderInput): Promise<Order> {
    const res = await apiClient.post('/orders', payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendOrder(res.data.data);
    }
    if (res.data?.orderNumber || res.data?.id) {
      return mapBackendOrder(res.data);
    }
    throw new Error(res.data?.message || 'Failed to place order');
  },

  // 11.3 Get All User Orders
  async getOrders(): Promise<Order[]> {
    try {
      const res = await apiClient.get('/orders');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map(mapBackendOrder);
      }
      if (Array.isArray(res.data)) {
        return res.data.map(mapBackendOrder);
      }
    } catch (err) {
      console.warn('Backend GET /orders error:', err);
    }
    return [];
  },

  // 11.4 Get Order Details By ID
  async getOrderById(id: number | string): Promise<Order> {
    const res = await apiClient.get(`/orders/${id}`);
    if (res.data?.success && res.data?.data) {
      return mapBackendOrder(res.data.data);
    }
    if (res.data?.orderNumber || res.data?.id) {
      return mapBackendOrder(res.data);
    }
    throw new Error(`Order ${id} not found`);
  },

  // 11.5 Live Shipment & Vehicle GPS Tracking
  async getOrderTracking(id: number | string): Promise<OrderTracking> {
    const res = await apiClient.get(`/orders/${id}/tracking`);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    if (res.data?.currentStatus) {
      return res.data;
    }
    throw new Error('Tracking details unavailable');
  },

  // 11.6 Get GST Tax Invoice & E-Way Bill
  async getOrderInvoice(id: number | string): Promise<TaxInvoice> {
    const res = await apiClient.get(`/orders/${id}/invoice`);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    if (res.data?.invoiceNumber) {
      return res.data;
    }
    throw new Error('Invoice not found');
  },
};
