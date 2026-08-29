import { apiClient } from '../services/apiClient';

export interface PaymentInitiation {
  id: number;
  orderId: number | string;
  orderNumber: string;
  amount: number;
  currency: string;
  amountInPaise: number;
  gatewayOrderId: string;
  razorpayKeyId: string;
  companyName: string;
}

export interface PaymentVerificationResult {
  id: number;
  orderId: number | string;
  amount: number;
  paymentStatus: string;
}

export const paymentApi = {
  async initiatePayment(orderId: number | string, paymentMethod: string = 'RAZORPAY'): Promise<PaymentInitiation> {
    const res = await apiClient.post('/payments/create', {
      orderId,
      paymentMethod,
    });
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    if (res.data?.gatewayOrderId) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to initiate gateway payment');
  },

  async verifyPayment(payload: {
    paymentId: number;
    gatewayOrderId: string;
    gatewayPaymentId: string;
    gatewaySignature: string;
  }): Promise<PaymentVerificationResult> {
    const res = await apiClient.post('/payments/verify', payload);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    if (res.data?.paymentStatus) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Payment verification failed');
  },
};
