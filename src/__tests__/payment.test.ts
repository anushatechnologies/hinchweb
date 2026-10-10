import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { paymentApi } from '../api/paymentApi';
import { apiClient } from '../services/apiClient';

describe('HinchMart Payment System & Flow Architecture Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. POST /api/payments/create-order (ORDER_PAYMENT) - creates Razorpay payment order for existing order', async () => {
    const mockBackendResponse = {
      success: true,
      statusCode: 201,
      message: 'Razorpay order created successfully',
      data: {
        razorpayOrderId: 'order_OkW1x4r8a8pLzq',
        keyId: 'rzp_test_1DP5mmOlF5G5ag',
        amount: 14250.0,
        amountInPaise: 1425000,
        currency: 'INR',
        orderId: 5001,
        orderNumber: 'ORD-2026-0042',
        purpose: 'ORDER_PAYMENT',
        customerName: 'Enterprise Buyer',
        customerEmail: 'buyer@example.com',
        customerPhone: '9876543210',
        description: 'Payment for Order #ORD-2026-0042',
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockBackendResponse,
    } as any);

    const result = await paymentApi.createPaymentOrder({
      orderId: 5001,
      purpose: 'ORDER_PAYMENT',
    });

    expect(postSpy).toHaveBeenCalledWith('/payments/create-order', {
      orderId: 5001,
      purpose: 'ORDER_PAYMENT',
    });

    expect(result.razorpayOrderId).toBe('order_OkW1x4r8a8pLzq');
    expect(result.keyId).toBe('rzp_test_1DP5mmOlF5G5ag');
    expect(result.amountInPaise).toBe(1425000);
    expect(result.amount).toBe(14250.0);
    expect(result.currency).toBe('INR');
    expect(result.orderId).toBe(5001);
  });

  it('2. POST /api/payments/create-order (CHECKOUT) - direct checkout from cart with crane unloading option', async () => {
    const mockBackendResponse = {
      success: true,
      statusCode: 201,
      data: {
        razorpayOrderId: 'order_Check999',
        keyId: 'rzp_test_1DP5mmOlF5G5ag',
        amount: 35000.0,
        amountInPaise: 3500000,
        currency: 'INR',
        purpose: 'CHECKOUT',
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockBackendResponse,
    } as any);

    const result = await paymentApi.createPaymentOrder({
      addressId: 12,
      deliverySlot: 'AFTERNOON_12PM_TO_4PM',
      requiresCraneUnloading: true,
      purpose: 'CHECKOUT',
    });

    expect(postSpy).toHaveBeenCalledWith('/payments/create-order', {
      addressId: 12,
      deliverySlot: 'AFTERNOON_12PM_TO_4PM',
      requiresCraneUnloading: true,
      purpose: 'CHECKOUT',
    });

    expect(result.razorpayOrderId).toBe('order_Check999');
    expect(result.amount).toBe(35000.0);
  });

  it('3. POST /api/payments/create-order (WALLET_TOPUP) - adds balance directly to customer wallet', async () => {
    const mockBackendResponse = {
      success: true,
      statusCode: 201,
      data: {
        razorpayOrderId: 'order_WalletTopUp1',
        keyId: 'rzp_test_1DP5mmOlF5G5ag',
        amount: 2500.0,
        amountInPaise: 250000,
        currency: 'INR',
        purpose: 'WALLET_TOPUP',
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockBackendResponse,
    } as any);

    const result = await paymentApi.createPaymentOrder({
      amount: 2500.0,
      purpose: 'WALLET_TOPUP',
    });

    expect(postSpy).toHaveBeenCalledWith('/payments/create-order', {
      amount: 2500.0,
      purpose: 'WALLET_TOPUP',
    });

    expect(result.razorpayOrderId).toBe('order_WalletTopUp1');
    expect(result.amountInPaise).toBe(250000);
  });

  it('4. POST /api/payments/verify - verifies cryptographic HMAC-SHA256 signature and returns CAPTURED status', async () => {
    const mockVerifyResponse = {
      success: true,
      statusCode: 200,
      message: 'Payment verified and order updated successfully',
      data: {
        paymentId: 105,
        customerId: 101,
        customerName: 'Enterprise Buyer',
        orderId: 5001,
        orderNumber: 'ORD-2026-0042',
        razorpayPaymentId: 'pay_OkW2A7h4aBqKls',
        razorpayOrderId: 'order_OkW1x4r8a8pLzq',
        status: 'CAPTURED',
        amount: 14250.0,
        currency: 'INR',
        purpose: 'ORDER_PAYMENT',
        paymentMethod: 'UPI',
        vpa: 'buyer@okhdfcbank',
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockVerifyResponse,
    } as any);

    const result = await paymentApi.verifyPayment({
      orderId: 5001,
      razorpayOrderId: 'order_OkW1x4r8a8pLzq',
      razorpayPaymentId: 'pay_OkW2A7h4aBqKls',
      razorpaySignature: '9ef4023b6b1b70744ebbf0ab2f150fbfd59ec347898516d03d37a1e0bca5c219',
    });

    expect(postSpy).toHaveBeenCalledWith('/payments/verify', {
      orderId: 5001,
      razorpayOrderId: 'order_OkW1x4r8a8pLzq',
      razorpayPaymentId: 'pay_OkW2A7h4aBqKls',
      razorpaySignature: '9ef4023b6b1b70744ebbf0ab2f150fbfd59ec347898516d03d37a1e0bca5c219',
    });

    expect(result.status).toBe('CAPTURED');
    expect(result.paymentId).toBe(105);
    expect(result.orderId).toBe(5001);
    expect(result.paymentMethod).toBe('UPI');
  });

  it('5. POST /api/payments/verify - throws error when gateway signature verification fails', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
      statusCode: 400,
      message: 'Payment signature verification failed: Invalid Razorpay payment signature.',
    });

    await expect(
      paymentApi.verifyPayment({
        orderId: 5001,
        razorpayOrderId: 'order_OkW1x4r8a8pLzq',
        razorpayPaymentId: 'pay_Fake',
        razorpaySignature: 'invalid_sig',
      })
    ).rejects.toThrow();
  });

  it('6. GET /api/payments/{paymentId}/status - fetches payment status by payment ID', async () => {
    const mockStatusResponse = {
      success: true,
      statusCode: 200,
      data: {
        paymentId: 105,
        status: 'CAPTURED',
        amount: 14250.0,
        currency: 'INR',
      },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockStatusResponse,
    } as any);

    const result = await paymentApi.getPaymentStatus(105);

    expect(getSpy).toHaveBeenCalledWith('/payments/105/status');
    expect(result.paymentId).toBe(105);
    expect(result.status).toBe('CAPTURED');
  });

  it('7. GET /api/payments/order/{orderId}/status - fetches latest payment status by order ID', async () => {
    const mockOrderStatusResponse = {
      success: true,
      statusCode: 200,
      data: {
        paymentId: 105,
        orderId: 5001,
        status: 'CAPTURED',
        amount: 14250.0,
      },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockOrderStatusResponse,
    } as any);

    const result = await paymentApi.getOrderPaymentStatus(5001);

    expect(getSpy).toHaveBeenCalledWith('/payments/order/5001/status');
    expect(result.orderId).toBe(5001);
    expect(result.status).toBe('CAPTURED');
  });

  it('8. GET /api/payments/customer/{customerId} - fetches customer payment history', async () => {
    const mockHistory = [
      {
        paymentId: 105,
        orderId: 5001,
        status: 'CAPTURED',
        amount: 14250.0,
      },
      {
        paymentId: 98,
        orderId: 4920,
        status: 'CAPTURED',
        amount: 5200.0,
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockHistory },
    } as any);

    const list = await paymentApi.getCustomerPaymentHistory(101);

    expect(getSpy).toHaveBeenCalledWith('/payments/customer/101');
    expect(list).toHaveLength(2);
    expect(list[0].paymentId).toBe(105);
  });

  it('9. POST /api/payments/order/{orderId}/refund - triggers order refund & customer fund protection', async () => {
    const mockRefundResponse = {
      success: true,
      statusCode: 200,
      message: 'Refund processed successfully to customer wallet',
      data: {
        paymentId: 105,
        orderId: 5001,
        status: 'REFUNDED_TO_WALLET',
        amount: 14250.0,
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockRefundResponse,
    } as any);

    const result = await paymentApi.refundOrderPayment(5001);

    expect(postSpy).toHaveBeenCalledWith('/payments/order/5001/refund');
    expect(result.status).toBe('REFUNDED_TO_WALLET');
  });

  it('10. initiatePayment backward-compatibility wrapper delegates to createPaymentOrder', async () => {
    const mockResp = {
      data: {
        success: true,
        data: {
          razorpayOrderId: 'order_Legacy123',
          keyId: 'rzp_test_key',
          amount: 5000,
          amountInPaise: 500000,
          currency: 'INR',
          orderId: 200,
        },
      },
    };

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResp as any);

    const res = await paymentApi.initiatePayment(200);

    expect(res.razorpayOrderId).toBe('order_Legacy123');
    expect(res.gatewayOrderId).toBe('order_Legacy123');
    expect(res.keyId).toBe('rzp_test_key');
  });
});
