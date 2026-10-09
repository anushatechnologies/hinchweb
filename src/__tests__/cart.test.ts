import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cartApi, mapBackendCart, getGuestCart } from '../api/cartApi';
import { useCartStore } from '../store/useCartStore';
import { apiClient } from '../services/apiClient';

// Polyfill localStorage and window for Node test environment
const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => {
    storage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    for (const key of Object.keys(storage)) {
      delete storage[key];
    }
  },
};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

if (typeof globalThis.window === 'undefined') {
  const eventListeners: Record<string, Array<(...args: any[]) => void>> = {};
  Object.defineProperty(globalThis, 'window', {
    value: {
      addEventListener: (type: string, listener: (...args: any[]) => void) => {
        eventListeners[type] = eventListeners[type] || [];
        eventListeners[type].push(listener);
      },
      removeEventListener: (type: string, listener: (...args: any[]) => void) => {
        if (eventListeners[type]) {
          eventListeners[type] = eventListeners[type].filter((l) => l !== listener);
        }
      },
      dispatchEvent: () => true,
    },
    writable: true,
  });
}

describe('HinchMart Cart Flow Architecture & API Contract Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useCartStore.setState({
      cart: {
        id: 'cart_current',
        items: [],
        subtotal: 0,
        gstTotal: 0,
        deliveryTotal: 0,
        discountTotal: 0,
        grandTotal: 0,
        estimatedDeliveryDays: 2,
      },
      isLoading: false,
      isOpen: false,
      storeMismatchConflict: null,
      isStoreMismatchOpen: false,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. GET /api/cart - retrieves and maps active store cart', async () => {
    localStorage.setItem('hinchmart_auth_token', 'mock_jwt_token');

    const backendPayload = {
      cartId: 45,
      storeId: 1,
      storeName: 'HinchStore Hyderabad Central',
      storeSlug: 'hinchstore-hyderabad-central',
      items: [
        {
          cartItemId: 112,
          productId: 201,
          title: 'UltraTech Super Cement 50kg',
          imageUrl: 'https://cdn.example.com/cement.jpg',
          quantity: 10,
          unit: 'bag',
          unitPrice: 380,
          originalPrice: 420,
          appliedTier: '10-49 Bags Tier',
          gstRate: 28,
          lineTotal: 3800,
          lineGst: 1064,
        },
      ],
      subtotal: 3800,
      couponDiscount: 0,
      totalGst: 1064,
      deliveryCharge: 0,
      grandTotal: 4864,
      appliedCoupon: null,
    };

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        message: 'Cart retrieved successfully',
        data: backendPayload,
      },
    } as any);

    const cart = await cartApi.getCart();

    expect(cart.cartId).toBe(45);
    expect(cart.storeId).toBe(1);
    expect(cart.storeName).toBe('HinchStore Hyderabad Central');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].cartItemId).toBe(112);
    expect(cart.items[0].productId).toBe('201');
    expect(cart.grandTotal).toBe(4864);
  });

  it('2. POST /api/cart/items - adds item to cart with backend calculations', async () => {
    localStorage.setItem('hinchmart_auth_token', 'mock_jwt_token');

    const updatedBackendCart = {
      cartId: 45,
      storeId: 1,
      storeName: 'HinchStore Hyderabad Central',
      items: [
        {
          cartItemId: 112,
          productId: 201,
          title: 'UltraTech Super Cement 50kg',
          quantity: 15,
          unitPrice: 370,
          lineTotal: 5550,
          lineGst: 1554,
          gstRate: 28,
        },
      ],
      subtotal: 5550,
      totalGst: 1554,
      grandTotal: 7104,
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        data: updatedBackendCart,
      },
    } as any);

    const result = await cartApi.addToCart({ productId: 201, quantity: 5 });

    expect(postSpy).toHaveBeenCalledWith('/cart/items', { productId: 201, quantity: 5 });
    expect(result.grandTotal).toBe(7104);
    expect(result.items[0].quantity).toBe(15);
  });

  it('3. POST /api/cart/items - intercepts 409 STORE_MISMATCH and sets conflict modal in store', async () => {
    localStorage.setItem('hinchmart_auth_token', 'mock_jwt_token');

    const mismatchError = {
      statusCode: 409,
      error: 'STORE_MISMATCH',
      message:
        "Your cart contains items from 'HinchStore Hyderabad Central'. Switch store to add items from 'Steel Direct Bengaluru'?",
      currentStore: {
        id: 1,
        name: 'HinchStore Hyderabad Central',
        slug: 'hinchstore-hyderabad-central',
      },
      newStore: {
        id: 2,
        name: 'Steel Direct Bengaluru',
        slug: 'steel-direct-bengaluru',
      },
    };

    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(mismatchError);

    const productToAdd: any = {
      id: 412,
      title: 'TMT Rebars Fe 550D 12mm',
      price: 1050,
      moq: 3,
    };

    await useCartStore.getState().addItem(productToAdd, 3);

    const state = useCartStore.getState();
    expect(state.isStoreMismatchOpen).toBe(true);
    expect(state.storeMismatchConflict).not.toBeNull();
    expect(state.storeMismatchConflict?.currentStore.name).toBe('HinchStore Hyderabad Central');
    expect(state.storeMismatchConflict?.newStore.name).toBe('Steel Direct Bengaluru');
    expect(state.storeMismatchConflict?.pendingProductId).toBe(412);
    expect(state.storeMismatchConflict?.pendingQuantity).toBe(3);
  });

  it('4. POST /api/cart/switch-store - switches active store cart and adds pending item', async () => {
    localStorage.setItem('hinchmart_auth_token', 'mock_jwt_token');

    useCartStore.setState({
      isStoreMismatchOpen: true,
      storeMismatchConflict: {
        message: 'Switch store',
        currentStore: { id: 1, name: 'HinchStore Hyderabad Central' },
        newStore: { id: 2, name: 'Steel Direct Bengaluru', slug: 'steel-direct-bengaluru' },
        pendingProductId: 412,
        pendingQuantity: 3,
      },
    });

    const switchedCart = {
      cartId: 45,
      storeId: 2,
      storeName: 'Steel Direct Bengaluru',
      storeSlug: 'steel-direct-bengaluru',
      items: [
        {
          cartItemId: 113,
          productId: 412,
          title: 'TMT Rebars Fe 550D 12mm',
          quantity: 3,
          unitPrice: 1050,
          lineTotal: 3150,
          lineGst: 567,
          gstRate: 18,
        },
      ],
      subtotal: 3150,
      totalGst: 567,
      grandTotal: 3717,
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        data: switchedCart,
      },
    } as any);

    await useCartStore.getState().confirmSwitchStore();

    expect(postSpy).toHaveBeenCalledWith('/cart/switch-store', {
      storeId: 2,
      storeSlug: 'steel-direct-bengaluru',
      pendingProductId: 412,
      pendingQuantity: 3,
    });

    const state = useCartStore.getState();
    expect(state.isStoreMismatchOpen).toBe(false);
    expect(state.storeMismatchConflict).toBeNull();
    expect(state.cart.storeName).toBe('Steel Direct Bengaluru');
    expect(state.cart.grandTotal).toBe(3717);
  });

  it('5. PUT /api/cart/items/{cartItemId} - updates quantity for cart item', async () => {
    localStorage.setItem('hinchmart_auth_token', 'mock_jwt_token');

    // Populate initial mapped cart to resolve cartItemId
    mapBackendCart({
      cartId: 45,
      items: [{ cartItemId: 112, productId: 201, quantity: 10 }],
    });

    const updatedCart = {
      cartId: 45,
      items: [
        {
          cartItemId: 112,
          productId: 201,
          quantity: 20,
          lineTotal: 7400,
          lineGst: 2072,
        },
      ],
      subtotal: 7400,
      grandTotal: 9472,
    };

    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        data: updatedCart,
      },
    } as any);

    const result = await cartApi.updateQuantity(201, 20);

    expect(putSpy).toHaveBeenCalledWith('/cart/items/112', { quantity: 20 });
    expect(result.grandTotal).toBe(9472);
  });

  it('6. POST /api/cart/sync - synchronizes guest cart with user cart after login', async () => {
    localStorage.setItem('hinchmart_auth_token', 'mock_jwt_token');

    localStorage.setItem(
      'hinchmart_guest_cart',
      JSON.stringify({
        storeId: 1,
        items: [
          { productId: 201, quantity: 5 },
          { productId: 305, quantity: 2 },
        ],
      })
    );

    const mergedBackendCart = {
      cartId: 45,
      storeId: 1,
      items: [
        { cartItemId: 112, productId: 201, quantity: 5 },
        { cartItemId: 114, productId: 305, quantity: 2 },
      ],
      grandTotal: 12850,
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        data: mergedBackendCart,
      },
    } as any);

    await useCartStore.getState().syncGuestCartWithBackend();

    expect(postSpy).toHaveBeenCalledWith('/cart/sync', {
      targetStoreId: 1,
      items: [
        { productId: 201, quantity: 5 },
        { productId: 305, quantity: 2 },
      ],
    });

    expect(localStorage.getItem('hinchmart_guest_cart')).toBeNull();
    expect(useCartStore.getState().cart.grandTotal).toBe(12850);
  });

  it('7. POST & DELETE /api/cart/coupon - applies and removes coupon', async () => {
    localStorage.setItem('hinchmart_auth_token', 'mock_jwt_token');

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        message: 'Coupon BUILD500 applied successfully',
        data: {
          couponCode: 'BUILD500',
          discountAmount: 500,
          newGrandTotal: 6604,
        },
      },
    } as any);

    const applyRes = await cartApi.applyCoupon('BUILD500');
    expect(applyRes.success).toBe(true);
    expect(applyRes.discountAmount).toBe(500);

    const updatedCartWithoutCoupon = {
      cartId: 45,
      subtotal: 5550,
      couponDiscount: 0,
      grandTotal: 7104,
      appliedCoupon: null,
    };

    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        data: updatedCartWithoutCoupon,
      },
    } as any);

    const removeRes = await cartApi.removeCoupon();
    expect(deleteSpy).toHaveBeenCalledWith('/cart/coupon');
    expect(removeRes.couponDiscount).toBe(0);
  });

  it('8. DELETE /api/cart/items/{cartItemId} & DELETE /api/cart - removes item and clears cart', async () => {
    localStorage.setItem('hinchmart_auth_token', 'mock_jwt_token');

    mapBackendCart({
      cartId: 45,
      items: [{ cartItemId: 112, productId: 201, quantity: 10 }],
    });

    const deleteItemSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        data: { cartId: 45, items: [], grandTotal: 0 },
      },
    } as any);

    await cartApi.removeItem(201);
    expect(deleteItemSpy).toHaveBeenCalledWith('/cart/items/112');

    const clearSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        data: null,
      },
    } as any);

    await cartApi.clearCart();
    expect(clearSpy).toHaveBeenCalledWith('/cart');
  });

  it('9. Guest cart operations - works offline in localStorage when unauthenticated', async () => {
    // No auth token
    const itemToAdd = {
      id: 'prod_99',
      title: 'Safety Helmet Class E',
      price: 250,
      moq: 2,
    };

    const cart = await cartApi.addToCart({ productId: 'prod_99', quantity: 2 }, itemToAdd);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.subtotal).toBe(500);

    const guestStored = getGuestCart();
    expect(guestStored.items).toHaveLength(1);
    expect(guestStored.items[0].title).toBe('Safety Helmet Class E');
  });
});
