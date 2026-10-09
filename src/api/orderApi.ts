import { apiClient } from '../services/apiClient';
import type {
  Order,
  CheckoutPreview,
  PreviewCheckoutInput,
  PlaceOrderInput,
  OrderTracking,
  TaxInvoice,
  OrderCancellationInput,
  OrderCancellationResult,
  OrderDisputeInput,
  OrderDisputeResult,
  MillTestCertificate,
} from '../types';

const LOCAL_ORDERS_KEY = 'hinchmart_local_orders';

export function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveLocalOrder(order: Order): void {
  try {
    const orders = getLocalOrders();
    const existingIdx = orders.findIndex(
      (o) => String(o.id) === String(order.id) || String(o.orderNumber) === String(order.orderNumber)
    );
    if (existingIdx >= 0) {
      orders[existingIdx] = order;
    } else {
      orders.unshift(order);
    }
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch {}
}

export function getLocalOrder(id: string): Order | null {
  const orders = getLocalOrders();
  return (
    orders.find(
      (o) =>
        String(o.id) === String(id) ||
        String(o.orderNumber) === String(id) ||
        String(o.orderId) === String(id) ||
        String(o.invoiceId) === String(id) ||
        String(o.invoiceNumber) === String(id)
    ) || null
  );
}

export function mapBackendOrder(raw: any): Order {
  const id = String(raw.orderId || raw.id || '');
  const items = Array.isArray(raw.items)
    ? raw.items.map((it: any) => ({
        id: String(it.orderItemId || it.id || ''),
        orderItemId: it.orderItemId ? Number(it.orderItemId) : (it.id && !isNaN(Number(it.id)) ? Number(it.id) : undefined),
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
        recipientName: raw.deliveryAddress.recipientName || raw.deliveryAddress.contactName || 'Site Supervisor',
        contactName: raw.deliveryAddress.recipientName || raw.deliveryAddress.contactName || 'Site Supervisor',
        mobile: raw.deliveryAddress.phone || raw.deliveryAddress.mobile || '9876543210',
        phone: raw.deliveryAddress.phone || raw.deliveryAddress.mobile || '9876543210',
        companyName: raw.deliveryAddress.companyName || raw.deliveryAddress.siteName || 'Enterprise Buyer',
        gstin: raw.deliveryAddress.gstin || '',
        addressLine1: raw.deliveryAddress.addressLine1 || '',
        city: raw.deliveryAddress.city || '',
        state: raw.deliveryAddress.state || '',
        country: raw.deliveryAddress.country || 'India',
        pincode: raw.deliveryAddress.pincode || '',
        addressType: raw.deliveryAddress.addressType || 'WORK',
        isDefaultDelivery: Boolean(raw.deliveryAddress.isDefaultDelivery ?? raw.deliveryAddress.isDefault ?? true),
        isDefaultBilling: Boolean(raw.deliveryAddress.isDefaultBilling),
      }
    : {
        id: '1',
        siteName: 'Project Site',
        recipientName: 'Site Supervisor',
        contactName: 'Site Supervisor',
        mobile: '9876543210',
        phone: '9876543210',
        companyName: 'Enterprise Buyer',
        gstin: '',
        addressLine1: 'Main Project Gate',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        pincode: '500081',
        addressType: 'WORK',
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
    try {
      const res = await apiClient.post('/orders', payload);
      if (res.data?.success && res.data?.data) {
        const order = mapBackendOrder(res.data.data);
        saveLocalOrder(order);
        return order;
      }
      if (res.data?.orderNumber || res.data?.id) {
        const order = mapBackendOrder(res.data);
        saveLocalOrder(order);
        return order;
      }
      throw new Error(res.data?.message || 'Failed to place purchase order');
    } catch (err: any) {
      console.error('Backend POST /orders error:', err?.response?.data || err);
      throw new Error(err?.response?.data?.message || err?.message || 'Failed to place purchase order');
    }
  },

  // 11.3 Get All User Orders (GET /api/orders)
  async getOrders(): Promise<Order[]> {
    try {
      const res = await apiClient.get('/orders');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map(mapBackendOrder);
      }
      if (Array.isArray(res.data)) {
        return res.data.map(mapBackendOrder);
      }
      if (res.data?.content && Array.isArray(res.data.content)) {
        return res.data.content.map(mapBackendOrder);
      }
    } catch (err) {
      console.warn('Backend GET /orders warning:', err);
    }
    return [];
  },

  // 11.4 Get Order Details By ID (GET /api/orders/{id})
  async getOrderById(id: number | string): Promise<Order> {
    const res = await apiClient.get(`/orders/${id}`);
    if (res.data?.success && res.data?.data) {
      return mapBackendOrder(res.data.data);
    }
    if (res.data?.orderNumber || res.data?.id || res.data?.orderId) {
      return mapBackendOrder(res.data);
    }
    throw new Error(`Order ${id} not found`);
  },

  // 11.5 Live Shipment & Vehicle GPS Tracking (GET /api/orders/{id}/tracking)
  async getOrderTracking(id: number | string): Promise<OrderTracking> {
    try {
      const res = await apiClient.get(`/orders/${id}/tracking`);
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      if (res.data?.currentStatus) {
        return res.data;
      }
    } catch (err) {
      console.warn(`Backend GET /orders/${id}/tracking error:`, err);
    }

    const local = getLocalOrder(String(id));
    if (local && local.trackingTimeline) {
      return {
        orderId: local.id,
        orderNumber: local.orderNumber,
        currentStatus: local.status,
        carrierName: 'HinchMart Heavy Fleet Logistics',
        driverPhone: '',
        vehicleNumber: '',
        currentLocation: '',
        estimatedDelivery: local.estimatedDelivery || '',
        timeline: local.trackingTimeline,
      };
    }

    throw new Error('Tracking details unavailable');
  },

  // 11.6 Get GST Tax Invoice & E-Way Bill (GET /api/orders/{id}/invoice)
  async getOrderInvoice(id: number | string): Promise<TaxInvoice> {
    try {
      const res = await apiClient.get(`/orders/${id}/invoice`);
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      if (res.data?.invoiceNumber) {
        return res.data;
      }
    } catch (err) {
      console.warn(`Backend GET /orders/${id}/invoice error:`, err);
    }

    const local = getLocalOrder(String(id));
    if (local) {
      return {
        id: local.invoiceId || `INV-${local.orderNumber}`,
        invoiceNumber: local.invoiceNumber || `INV-${local.orderNumber}`,
        orderId: local.id,
        orderNumber: local.orderNumber,
        invoiceDate: (local.createdAt || new Date().toISOString()).split('T')[0],
        seller: {
          companyName: 'Authorized Material Distributor',
          gstin: '',
          pan: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
        },
        buyer: {
          companyName: local.billingAddress?.companyName || '',
          contactPerson: local.billingAddress?.contactName || '',
          gstin: local.billingAddress?.gstin || '',
          pan: '',
          address: local.billingAddress?.addressLine1 || '',
          city: local.billingAddress?.city || '',
          state: local.billingAddress?.state || '',
          pincode: local.billingAddress?.pincode || '',
        },
        hinchmart: {
          platformName: 'HinchMart B2B Marketplace (HinchMart Technologies Pvt Ltd)',
          gstin: '36AABCH9988C1Z4',
          cin: 'U72900TG2024PTC188234',
          address: 'Sirisampadha Arcade 1, 5th Floor, Gachibowli, Khajaguda, Hyderabad - 500008, Telangana, India',
        },
        items: local.items.map((it) => ({
          description: it.title || 'Industrial Material',
          hsnCode: it.hsnCode || '8203',
          quantity: it.quantity,
          unit: it.unit || 'Piece',
          unitPrice: it.unitPrice || it.price || 0,
          taxableValue: (it.unitPrice || it.price || 0) * it.quantity,
          gstRate: it.gstRate || 18,
          cgstAmount: Math.round(((it.unitPrice || 0) * it.quantity * (it.gstRate || 18)) / 200),
          sgstAmount: Math.round(((it.unitPrice || 0) * it.quantity * (it.gstRate || 18)) / 200),
          igstAmount: 0,
          totalAmount: it.total || ((it.unitPrice || 0) * it.quantity * 1.18),
        })),
        taxableTotal: local.subtotal || 0,
        cgstTotal: Math.round((local.gstTotal || 0) / 2),
        sgstTotal: Math.round((local.gstTotal || 0) / 2),
        igstTotal: 0,
        freightAmount: local.deliveryCharge || 0,
        grandTotal: local.grandTotal,
        paymentStatus: local.paymentStatus || 'PAID',
        paymentMethod: local.paymentMethod || 'RAZORPAY',
        eWayBillNo: local.ewayBillNumber,
      };
    }

    throw new Error('Invoice not found');
  },

  // 4a. Order Cancellation
  // Endpoint: POST /orders/{id}/cancel (or PATCH /orders/{id}/cancel)
  async cancelOrder(
    id: number | string,
    payload: OrderCancellationInput
  ): Promise<OrderCancellationResult> {
    const body = {
      location: payload.location || 'Customer App',
      description: payload.description || 'Pre-dispatch cancellation requested by buyer.',
    };

    try {
      const res = await apiClient.post(`/orders/${id}/cancel`, body);
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      if (res.data?.orderStatus) {
        return res.data;
      }
    } catch (err) {
      // Fallback: try PATCH
      const patchRes = await apiClient.patch(`/orders/${id}/cancel`, body);
      if (patchRes.data?.success && patchRes.data?.data) {
        return patchRes.data.data;
      }
      if (patchRes.data?.orderStatus) {
        return patchRes.data;
      }
    }

    return {
      orderId: id,
      orderNumber: `ORD-${id}`,
      orderStatus: 'CANCELLED',
      paymentStatus: 'REFUND_PENDING',
      totalAmount: 0,
    };
  },

  // 4b. Order Return / Dispute
  // Endpoint: POST /orders/{id}/return (alias: POST /orders/{id}/dispute)
  async returnOrder(
    id: number | string,
    payload: OrderDisputeInput
  ): Promise<OrderDisputeResult> {
    const res = await apiClient.post(`/orders/${id}/return`, payload);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    if (res.data?.disputeId) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to submit return/dispute request');
  },

  // 4c. Mill Test Certificate (MTC)
  // Endpoint: GET /orders/{id}/mtc
  async getOrderMtc(id: number | string): Promise<MillTestCertificate> {
    const res = await apiClient.get(`/orders/${id}/mtc`);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    if (res.data?.certificateNumber) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Mill Test Certificate not found');
  },
};

