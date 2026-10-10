import { apiClient } from '../services/apiClient';
import type {
  PaymentOrderCreateRequest,
  PaymentOrderCreateResponse,
  PaymentVerifyRequest,
  PaymentStatusResponse,
} from '../types';

export const paymentApi = {
  /**
   * Step 1: Create Razorpay Payment Order
   * POST /api/payments/create-order
   * Supports:
   * - purpose: "ORDER_PAYMENT" (Existing Order Payment)
   * - purpose: "CHECKOUT" (Direct Checkout from Cart with address & options)
   * - purpose: "WALLET_TOPUP" (Customer Wallet Top-Up)
   */
  async createPaymentOrder(payload: PaymentOrderCreateRequest): Promise<PaymentOrderCreateResponse> {
    const requestBody: Record<string, any> = {
      purpose: payload.purpose || 'ORDER_PAYMENT',
    };

    if (payload.orderId) {
      requestBody.orderId = Number(payload.orderId);
    }
    if (payload.addressId) {
      requestBody.addressId = Number(payload.addressId);
    }
    if (payload.deliverySlot) {
      requestBody.deliverySlot = payload.deliverySlot;
    }
    if (typeof payload.requiresCraneUnloading === 'boolean') {
      requestBody.requiresCraneUnloading = payload.requiresCraneUnloading;
    }
    if (typeof payload.amount === 'number') {
      requestBody.amount = payload.amount;
    }

    try {
      const res = await apiClient.post('/payments/create-order', requestBody);
      const data = res.data?.data || res.data;
      if (data) {
        return {
          razorpayOrderId: data.razorpayOrderId || data.gatewayOrderId || '',
          keyId: data.keyId || data.razorpayKeyId || '',
          amount: Number(data.amount || 0),
          amountInPaise: Number(data.amountInPaise || (data.amount ? Math.round(data.amount * 100) : 0)),
          currency: data.currency || 'INR',
          orderId: data.orderId ? Number(data.orderId) : undefined,
          orderNumber: data.orderNumber || '',
          purpose: data.purpose || payload.purpose,
          customerName: data.customerName || '',
          customerEmail: data.customerEmail || '',
          customerPhone: data.customerPhone || '',
          description: data.description || '',
          // Aliases for compatibility
          gatewayOrderId: data.razorpayOrderId || data.gatewayOrderId || '',
          razorpayKeyId: data.keyId || data.razorpayKeyId || '',
        };
      }
    } catch (err: any) {
      // Fallback for legacy endpoints if mounted at /payments/create
      try {
        const fallbackRes = await apiClient.post('/payments/create', requestBody);
        const data = fallbackRes.data?.data || fallbackRes.data;
        if (data) {
          return {
            razorpayOrderId: data.razorpayOrderId || data.gatewayOrderId || '',
            keyId: data.keyId || data.razorpayKeyId || '',
            amount: Number(data.amount || 0),
            amountInPaise: Number(data.amountInPaise || (data.amount ? Math.round(data.amount * 100) : 0)),
            currency: data.currency || 'INR',
            orderId: data.orderId ? Number(data.orderId) : undefined,
            orderNumber: data.orderNumber || '',
            purpose: data.purpose || payload.purpose,
            customerName: data.customerName || '',
            customerEmail: data.customerEmail || '',
            customerPhone: data.customerPhone || '',
            description: data.description || '',
            gatewayOrderId: data.razorpayOrderId || data.gatewayOrderId || '',
            razorpayKeyId: data.keyId || data.razorpayKeyId || '',
          };
        }
      } catch {
        // rethrow original error
      }
      throw err;
    }

    throw new Error('Failed to create payment order');
  },

  /**
   * Backward-compatible alias for existing callers
   */
  async initiatePayment(
    orderId: number | string,
    _paymentMethod: string = 'RAZORPAY'
  ): Promise<PaymentOrderCreateResponse> {
    return this.createPaymentOrder({
      orderId: Number(orderId),
      purpose: 'ORDER_PAYMENT',
    });
  },

  /**
   * Step 2: Verify Razorpay Payment Signature
   * POST /api/payments/verify
   * Verifies HMAC-SHA256 signature and confirms order fulfillment
   */
  async verifyPayment(payload: PaymentVerifyRequest): Promise<PaymentStatusResponse> {
    const requestBody: Record<string, any> = {
      razorpayOrderId: payload.razorpayOrderId || payload.gatewayOrderId || '',
      razorpayPaymentId: payload.razorpayPaymentId || payload.gatewayPaymentId || '',
      razorpaySignature: payload.razorpaySignature || payload.gatewaySignature || '',
    };

    if (payload.orderId) {
      requestBody.orderId = Number(payload.orderId);
    }

    const res = await apiClient.post('/payments/verify', requestBody);
    const data = res.data?.data || res.data;
    if (data) {
      return {
        paymentId: Number(data.paymentId || data.id || 0),
        customerId: data.customerId ? Number(data.customerId) : undefined,
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || '',
        orderId: data.orderId ? Number(data.orderId) : undefined,
        orderNumber: data.orderNumber || '',
        razorpayPaymentId: data.razorpayPaymentId || payload.razorpayPaymentId,
        razorpayOrderId: data.razorpayOrderId || payload.razorpayOrderId,
        status: data.status || 'CAPTURED',
        amount: Number(data.amount || 0),
        currency: data.currency || 'INR',
        purpose: data.purpose || 'ORDER_PAYMENT',
        paymentMethod: data.paymentMethod || 'UPI',
        email: data.email || '',
        contact: data.contact || '',
        vpa: data.vpa || null,
        bank: data.bank || null,
        cardNetwork: data.cardNetwork || null,
        cardLast4: data.cardLast4 || null,
        errorCode: data.errorCode || null,
        errorDescription: data.errorDescription || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    }

    throw new Error(res.data?.message || 'Payment verification failed');
  },

  /**
   * Step 3: Get Real-time Payment Status by Payment ID
   * GET /api/payments/{paymentId}/status
   */
  async getPaymentStatus(paymentId: number | string): Promise<PaymentStatusResponse> {
    const res = await apiClient.get(`/payments/${paymentId}/status`);
    const data = res.data?.data || res.data;
    return data;
  },

  /**
   * Step 4: Get Order Payment Status by Order ID
   * GET /api/payments/order/{orderId}/status
   */
  async getOrderPaymentStatus(orderId: number | string): Promise<PaymentStatusResponse> {
    const res = await apiClient.get(`/payments/order/${orderId}/status`);
    const data = res.data?.data || res.data;
    return data;
  },

  /**
   * Step 5: Get Customer Payment History
   * GET /api/payments/customer/{customerId}
   */
  async getCustomerPaymentHistory(customerId: number | string): Promise<PaymentStatusResponse[]> {
    const res = await apiClient.get(`/payments/customer/${customerId}`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * Step 7: Order Refund & Customer Fund Protection
   * POST /api/payments/order/{orderId}/refund
   */
  async refundOrderPayment(orderId: number | string): Promise<PaymentStatusResponse> {
    const res = await apiClient.post(`/payments/order/${orderId}/refund`);
    const data = res.data?.data || res.data;
    return data;
  },
};
