import { apiClient, getCurrentUserId } from '../services/apiClient';
import { mockDb } from './mockDb';
import type { Order, OrderItem, TrackingMilestone, Address, PaymentMethod, OrderStatus } from '../types';

export function mapBackendOrder(raw: any): Order {
  const items: OrderItem[] = Array.isArray(raw.items)
    ? raw.items.map((item: any) => ({
        productId: String(item.productId || 1),
        productTitle: item.productName || item.title || 'Industrial Supply',
        productImage: item.primaryImageUrl || item.imageUrl || 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800',
        brand: item.brand || 'Tata Tiscon',
        unit: item.unit || 'Ton',
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || item.price || 0),
        gstRate: Number(item.gstPercentage || item.gstRate || 18),
        totalPrice: Number(item.total || item.subtotal || 0),
        hsnCode: item.hsnCode || '72142090',
      }))
    : [
        {
          productId: '1',
          productTitle: 'TATA Tiscon 550D TMT Bar (12mm)',
          productImage: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800',
          brand: 'Tata Tiscon',
          unit: 'Ton',
          quantity: 10,
          unitPrice: 61500,
          gstRate: 18,
          totalPrice: 725700,
          hsnCode: '72142090',
        },
      ];

  const subtotal = Number(raw.subtotal || 0);
  const gstTotal = Number(raw.gstAmount || raw.gstTotal || 0);
  const deliveryCharge = Number(raw.deliveryCharge || 2500);
  const grandTotal = Number(raw.totalAmount || raw.grandTotal || subtotal + gstTotal + deliveryCharge);

  const deliveryAddress: Address = {
    id: 'addr_deliv',
    contactName: raw.buyerName || 'Rajesh Sharma',
    mobile: raw.buyerPhone || '9876543210',
    companyName: raw.buyerCompanyName || 'Apex Infra Projects Pvt Ltd',
    gstin: '27AAAAA0000A1Z5',
    addressLine1: raw.shippingAddress || 'Site #7, Metro Line 3 Corridor, Hinjewadi Phase 2',
    city: raw.city || 'Pune',
    state: raw.state || 'Maharashtra',
    pincode: raw.pincode || '411057',
    addressType: 'Site / Project',
    isDefaultDelivery: true,
    isDefaultBilling: false,
  };

  const billingAddress: Address = {
    id: 'addr_bill',
    contactName: raw.buyerName || 'Rajesh Sharma',
    mobile: raw.buyerPhone || '9876543210',
    companyName: raw.buyerCompanyName || 'Apex Infra Projects Pvt Ltd',
    gstin: '27AAAAA0000A1Z5',
    addressLine1: raw.billingAddress || raw.shippingAddress || 'Plot 45, MIDC Industrial Area, Phase 2',
    city: raw.city || 'Pune',
    state: raw.state || 'Maharashtra',
    pincode: raw.pincode || '411057',
    addressType: 'Office / Commercial',
    isDefaultDelivery: false,
    isDefaultBilling: true,
  };

  const milestones: TrackingMilestone[] = [
    {
      title: 'Order Placed & Verified',
      description: 'Order confirmed and PO allocated to manufacturer.',
      timestamp: raw.createdAt || new Date().toISOString(),
      completed: true,
      current: false,
      location: `${raw.city || 'Pune'}, ${raw.state || 'Maharashtra'}`,
    },
    {
      title: 'Depot Allocation & E-Way Bill',
      description: 'Assigned to Tata Distribution Yard. E-Way bill generated.',
      timestamp: raw.createdAt || new Date().toISOString(),
      completed: true,
      current: false,
      location: 'Chakan Industrial Yard, Pune',
    },
    {
      title: 'Material Loaded & Weighed',
      description: 'Mill Test Certificate (MTC) attached. Weighbridge slip: 32.45 MT.',
      timestamp: raw.createdAt || new Date().toISOString(),
      completed: true,
      current: true,
      location: 'Weighbridge Bay #4',
    },
    {
      title: 'In Transit via Trailer Logistics',
      description: 'Consignment en-route to delivery site with driver tracking.',
      timestamp: new Date().toISOString(),
      completed: raw.orderStatus === 'SHIPPED' || raw.orderStatus === 'DELIVERED',
      current: false,
      location: 'NH-48 Corridor Checkpoint',
    },
    {
      title: 'Site Delivery & Unloading',
      description: 'Physical inspection and digital proof of delivery sign-off.',
      timestamp: '',
      completed: raw.orderStatus === 'DELIVERED',
      current: false,
      location: raw.shippingAddress || 'Project Site Gate',
    },
  ];

  return {
    id: String(raw.id),
    orderNumber: raw.orderNumber || `ORD-${raw.id}`,
    createdAt: raw.createdAt || new Date().toISOString(),
    items,
    seller: {
      id: '5',
      name: 'Tata Steel Distribution Hub',
      city: 'Pune',
      state: 'Maharashtra',
      isVerified: true,
      rating: 4.9,
      successfulOrders: 4280,
      gstinMasked: '27AAACT2727Q1ZW',
    },
    status: (raw.orderStatus === 'CONFIRMED' || raw.orderStatus === 'SHIPPED'
      ? 'In Transit'
      : raw.orderStatus === 'DELIVERED'
      ? 'Delivered'
      : 'Order Placed') as OrderStatus,
    paymentStatus: (raw.paymentStatus === 'PAID' ? 'Paid' : 'Pending') as any,
    paymentMethod: (raw.paymentMethod === 'UPI' ? 'upi' : raw.paymentMethod || 'upi') as PaymentMethod,
    deliveryAddress,
    billingAddress,
    subtotal,
    bulkDiscount: 0,
    taxableAmount: subtotal,
    cgst: Math.round(gstTotal / 2),
    sgst: Math.round(gstTotal / 2),
    igst: 0,
    deliveryCharge,
    grandTotal,
    tracking: {
      partnerName: 'VRL Logistics Heavy Freight',
      trackingNumber: 'VRL-2026-998811',
      vehicleNumber: 'MH-12-RN-8899 (Tata Prima 40T Trailer)',
      consignmentNumber: 'CSN-4491-002',
      dispatchDate: '2026-08-20',
      estimatedDelivery: '2026-08-25',
      status: raw.orderStatus || 'IN_TRANSIT',
      milestones,
    },
    invoiceId: `INV-${raw.id || '2026-001'}`,
    expectedDelivery: '2026-08-25',
  };
}

export const orderApi = {
  async getOrders(): Promise<Order[]> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.get('/orders', { params: { userId } });
      if (res.data?.success && res.data?.data) {
        const rawOrders = Array.isArray(res.data.data)
          ? res.data.data
          : res.data.data.content || [];
        return rawOrders.map(mapBackendOrder);
      }
    } catch (err) {
      console.warn('Backend getOrders failed, using local orders:', err);
    }
    return mockDb.getOrders();
  },

  async getOrderById(id: string): Promise<Order> {
    const userId = getCurrentUserId();
    try {
      const numId = Number(id.replace(/\D/g, '')) || 2;
      const res = await apiClient.get(`/orders/${numId}`, { params: { userId } });
      if (res.data?.success && res.data?.data) {
        return mapBackendOrder(res.data.data);
      }
    } catch (err) {
      console.warn(`Backend getOrderById(${id}) failed, trying local:`, err);
    }
    const ord = await mockDb.getOrderById(id);
    if (!ord) throw new Error('Order not found');
    return ord;
  },

  async previewCheckout(data: any = {}): Promise<any> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.post(`/checkout/preview?userId=${userId}`, data);
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('Backend previewCheckout failed:', err);
    }
    return null;
  },

  async placeOrder(payload: {
    deliveryAddressId: string;
    billingAddressId: string;
    paymentMethod: PaymentMethod;
    notes?: string;
    shippingAddress?: string;
    billingAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }): Promise<Order> {
    const userId = getCurrentUserId();
    try {
      const body = {
        shippingAddress:
          payload.shippingAddress ||
          'Site #7, Metro Line 3 Corridor, Hinjewadi Phase 2, Pune',
        billingAddress:
          payload.billingAddress ||
          'Plot 45, MIDC Industrial Area, Phase 2, Pune',
        city: payload.city || 'Pune',
        state: payload.state || 'Maharashtra',
        pincode: payload.pincode || '411057',
        paymentMethod: (payload.paymentMethod || 'upi').toUpperCase(),
        notes: payload.notes || 'Heavy transit delivery.',
      };

      const res = await apiClient.post(`/orders?userId=${userId}`, body);
      if (res.data?.success && res.data?.data) {
        return mapBackendOrder(res.data.data);
      }
    } catch (err) {
      console.warn('Backend createOrder error, creating local order:', err);
    }

    return mockDb.placeOrder({
      deliveryAddressId: payload.deliveryAddressId,
      billingAddressId: payload.billingAddressId,
      paymentMethod: payload.paymentMethod,
    });
  },
};
