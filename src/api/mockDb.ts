import type {
  Product,
  Category,
  Brand,
  User,
  Address,
  Cart,
  CartItem,
  Order,
  RFQ,
  Quote,
  TaxInvoice,
  Notification,
  Conversation,
  ChatMessage,
  ProductFilters,
  CheckoutPreview,
} from '../types';
import {
  INITIAL_USER,
  INITIAL_ADDRESSES,
  CATEGORIES,
  BRANDS,
  PRODUCTS,
  ORDERS,
  RFQS,
  QUOTES,
  INVOICES,
  NOTIFICATIONS,
  CONVERSATIONS,
  MESSAGES,
} from './mockData';
import { calculateBulkPrice, calculateGst } from '../utils/tax';

const STORAGE_KEYS = {
  USER: 'hm_db_user',
  ADDRESSES: 'hm_db_addresses',
  CART: 'hm_db_cart',
  ORDERS: 'hm_db_orders',
  RFQS: 'hm_db_rfqs',
  QUOTES: 'hm_db_quotes',
  INVOICES: 'hm_db_invoices',
  NOTIFICATIONS: 'hm_db_notifications',
  CONVERSATIONS: 'hm_db_conversations',
  MESSAGES: 'hm_db_messages',
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockDatabase {
  private user: User = getStored(STORAGE_KEYS.USER, INITIAL_USER);
  private addresses: Address[] = getStored(STORAGE_KEYS.ADDRESSES, INITIAL_ADDRESSES);
  private cartItems: CartItem[] = getStored(STORAGE_KEYS.CART, []);
  private orders: Order[] = getStored(STORAGE_KEYS.ORDERS, ORDERS);
  private rfqs: RFQ[] = getStored(STORAGE_KEYS.RFQS, RFQS);
  private quotes: Quote[] = getStored(STORAGE_KEYS.QUOTES, QUOTES);
  private invoices: TaxInvoice[] = getStored(STORAGE_KEYS.INVOICES, INVOICES);
  private notifications: Notification[] = getStored(STORAGE_KEYS.NOTIFICATIONS, NOTIFICATIONS);
  private conversations: Conversation[] = getStored(STORAGE_KEYS.CONVERSATIONS, CONVERSATIONS);
  private messages: Record<string, ChatMessage[]> = getStored(STORAGE_KEYS.MESSAGES, MESSAGES);

  // AUTH
  async getCurrentUser(): Promise<User> {
    await delay();
    return { ...this.user };
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    await delay();
    this.user = { ...this.user, ...updates };
    setStored(STORAGE_KEYS.USER, this.user);
    return { ...this.user };
  }

  // CATEGORIES & BRANDS
  async getCategories(): Promise<Category[]> {
    await delay(150);
    return [...CATEGORIES];
  }

  async getBrands(): Promise<Brand[]> {
    await delay(150);
    return [...BRANDS];
  }

  // PRODUCTS
  async getProducts(filters?: ProductFilters): Promise<{ products: Product[]; total: number }> {
    await delay(200);
    let result = [...PRODUCTS];

    if (filters) {
      if (filters.category) {
        result = result.filter(
          (p) =>
            p.category.toLowerCase().includes(filters.category!.toLowerCase()) ||
            p.categoryId === filters.category
        );
      }
      if (filters.subcategory) {
        result = result.filter(
          (p) =>
            p.subcategory.toLowerCase().includes(filters.subcategory!.toLowerCase()) ||
            p.subcategoryId === filters.subcategory
        );
      }
      if (filters.brand && filters.brand.length > 0) {
        result = result.filter((p) => filters.brand!.includes(p.brand));
      }
      if (filters.industry) {
        result = result.filter((p) => p.industries?.includes(filters.industry!));
      }
      if (filters.minPrice !== undefined) {
        result = result.filter((p) => p.price >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        result = result.filter((p) => p.price <= filters.maxPrice!);
      }
      if (filters.sellerVerified) {
        result = result.filter((p) => p.seller.isVerified);
      }
      if (filters.rating) {
        result = result.filter((p) => p.rating >= filters.rating!);
      }
      if (filters.gstRate && filters.gstRate.length > 0) {
        result = result.filter((p) => filters.gstRate!.includes(p.gstRate));
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.brand.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            p.subcategory.toLowerCase().includes(query) ||
            p.hsnCode.includes(query) ||
            p.tags?.some((t) => t.toLowerCase().includes(query))
        );
      }

      // Sort
      if (filters.sort === 'price_asc') {
        result.sort((a, b) => a.price - b.price);
      } else if (filters.sort === 'price_desc') {
        result.sort((a, b) => b.price - a.price);
      } else if (filters.sort === 'rating') {
        result.sort((a, b) => b.rating - a.rating);
      } else if (filters.sort === 'newest') {
        result.reverse();
      }
    }

    return { products: result, total: result.length };
  }

  async getProductById(idOrSlug: string): Promise<Product | null> {
    await delay(150);
    const prod = PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    return prod ? { ...prod } : null;
  }

  // CART
  private computeCart(): Cart {
    let subtotal = 0;
    let totalBulkDiscount = 0;
    let taxableAmount = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let estimatedFreight = 0;

    const items: CartItem[] = this.cartItems.map((item) => {
      const { unitPrice, savings, total } = calculateBulkPrice(item.product, item.quantity);
      const tax = calculateGst(total, item.product.gstRate, false);

      subtotal += item.product.price * item.quantity;
      totalBulkDiscount += savings;
      taxableAmount += total;
      cgst += tax.cgst;
      sgst += tax.sgst;
      igst += tax.igst;
      estimatedFreight += item.product.deliveryCharge;

      return {
        ...item,
        selectedUnitPrice: unitPrice,
        bulkSavings: savings,
        totalPrice: total,
      };
    });

    const totalGst = cgst + sgst + igst;
    const grandTotal = taxableAmount + totalGst + estimatedFreight;

    return {
      items,
      totalItems: items.reduce((acc, curr) => acc + curr.quantity, 0),
      subtotal,
      totalBulkDiscount,
      taxableAmount,
      cgst: Number(cgst.toFixed(2)),
      sgst: Number(sgst.toFixed(2)),
      igst: Number(igst.toFixed(2)),
      totalGst: Number(totalGst.toFixed(2)),
      estimatedFreight,
      grandTotal: Number(grandTotal.toFixed(2)),
    };
  }

  async getCart(): Promise<Cart> {
    await delay(150);
    return this.computeCart();
  }

  async addToCart(productId: string, quantity: number): Promise<Cart> {
    await delay(200);
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    const existingIndex = this.cartItems.findIndex((i) => i.product.id === productId);
    if (existingIndex > -1) {
      this.cartItems[existingIndex].quantity += quantity;
    } else {
      const { unitPrice, savings, total } = calculateBulkPrice(product, quantity);
      this.cartItems.push({
        id: `cart_item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        product,
        quantity,
        selectedUnitPrice: unitPrice,
        unit: product.unit,
        gstRate: product.gstRate,
        bulkSavings: savings,
        totalPrice: total,
      });
    }

    setStored(STORAGE_KEYS.CART, this.cartItems);
    return this.computeCart();
  }

  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    await delay(150);
    const itemIndex = this.cartItems.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) throw new Error('Cart item not found');

    if (quantity <= 0) {
      this.cartItems.splice(itemIndex, 1);
    } else {
      this.cartItems[itemIndex].quantity = quantity;
    }

    setStored(STORAGE_KEYS.CART, this.cartItems);
    return this.computeCart();
  }

  async removeFromCart(itemId: string): Promise<Cart> {
    await delay(150);
    this.cartItems = this.cartItems.filter((i) => i.id !== itemId);
    setStored(STORAGE_KEYS.CART, this.cartItems);
    return this.computeCart();
  }

  async clearCart(): Promise<void> {
    await delay(100);
    this.cartItems = [];
    setStored(STORAGE_KEYS.CART, this.cartItems);
  }

  // CHECKOUT PREVIEW
  async getCheckoutPreview(deliveryPincode: string): Promise<CheckoutPreview> {
    await delay(200);
    const cart = this.computeCart();
    const isInterState = !deliveryPincode.startsWith('50'); // Telangana pin codes start with 50

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    cart.items.forEach((item) => {
      const tax = calculateGst(item.totalPrice, item.gstRate, isInterState);
      cgst += tax.cgst;
      sgst += tax.sgst;
      igst += tax.igst;
    });

    const totalGst = cgst + sgst + igst;
    const freight = cart.estimatedFreight;
    const grandTotal = cart.taxableAmount + totalGst + freight;

    return {
      items: cart.items,
      subtotal: cart.subtotal,
      bulkDiscount: cart.totalBulkDiscount,
      taxableAmount: cart.taxableAmount,
      cgst: Number(cgst.toFixed(2)),
      sgst: Number(sgst.toFixed(2)),
      igst: Number(igst.toFixed(2)),
      totalGst: Number(totalGst.toFixed(2)),
      freight,
      grandTotal: Number(grandTotal.toFixed(2)),
      deliveryPincode,
      isInterState,
    };
  }

  // ADDRESSES
  async getAddresses(): Promise<Address[]> {
    await delay(150);
    return [...this.addresses];
  }

  async addAddress(addr: Omit<Address, 'id'>): Promise<Address> {
    await delay(200);
    const newAddr: Address = {
      ...addr,
      id: `addr_${Date.now()}`,
    };
    if (newAddr.isDefaultDelivery) {
      this.addresses.forEach((a) => (a.isDefaultDelivery = false));
    }
    if (newAddr.isDefaultBilling) {
      this.addresses.forEach((a) => (a.isDefaultBilling = false));
    }
    this.addresses.unshift(newAddr);
    setStored(STORAGE_KEYS.ADDRESSES, this.addresses);
    return newAddr;
  }

  async updateAddress(id: string, updates: Partial<Address>): Promise<Address> {
    await delay(200);
    const index = this.addresses.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Address not found');

    if (updates.isDefaultDelivery) {
      this.addresses.forEach((a) => (a.isDefaultDelivery = false));
    }
    if (updates.isDefaultBilling) {
      this.addresses.forEach((a) => (a.isDefaultBilling = false));
    }

    this.addresses[index] = { ...this.addresses[index], ...updates };
    setStored(STORAGE_KEYS.ADDRESSES, this.addresses);
    return this.addresses[index];
  }

  async deleteAddress(id: string): Promise<void> {
    await delay(150);
    this.addresses = this.addresses.filter((a) => a.id !== id);
    setStored(STORAGE_KEYS.ADDRESSES, this.addresses);
  }

  // ORDERS
  async getOrders(): Promise<Order[]> {
    await delay(200);
    return [...this.orders];
  }

  async getOrderById(id: string): Promise<Order | null> {
    await delay(150);
    const order = this.orders.find((o) => o.id === id || o.orderNumber === id);
    return order ? { ...order } : null;
  }

  async placeOrder(params: {
    deliveryAddressId: string;
    billingAddressId: string;
    paymentMethod: any;
    items?: CartItem[];
  }): Promise<Order> {
    await delay(500);
    const deliveryAddress = this.addresses.find((a) => a.id === params.deliveryAddressId) || this.addresses[0];
    const billingAddress = this.addresses.find((a) => a.id === params.billingAddressId) || this.addresses[2] || deliveryAddress;
    const cart = params.items ? { items: params.items } : this.computeCart();

    const orderNumber = `HM${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceNumber = `TAX-INV-${orderNumber}`;
    const orderId = `ord_${orderNumber.toLowerCase()}`;

    let subtotal = 0;
    let bulkDiscount = 0;
    let taxableAmount = 0;
    let cgst = 0;
    let sgst = 0;
    let deliveryCharge = 0;

    const orderItems = cart.items.map((item) => {
      subtotal += item.product.price * item.quantity;
      bulkDiscount += item.bulkSavings;
      taxableAmount += item.totalPrice;
      const tax = calculateGst(item.totalPrice, item.gstRate, false);
      cgst += tax.cgst;
      sgst += tax.sgst;
      deliveryCharge += item.product.deliveryCharge;

      return {
        productId: item.product.id,
        productTitle: item.product.title,
        productImage: item.product.images[0],
        brand: item.product.brand,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.selectedUnitPrice,
        gstRate: item.gstRate,
        totalPrice: item.totalPrice,
        hsnCode: item.product.hsnCode,
      };
    });

    const totalGst = cgst + sgst;
    const grandTotal = taxableAmount + totalGst + deliveryCharge;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      createdAt: new Date().toISOString(),
      expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      items: orderItems,
      seller: cart.items[0]?.product.seller || PRODUCTS[0].seller,
      status: 'Payment Confirmed',
      paymentStatus: 'Paid',
      paymentMethod: params.paymentMethod,
      deliveryAddress,
      billingAddress,
      subtotal,
      bulkDiscount,
      taxableAmount,
      cgst,
      sgst,
      igst: 0,
      deliveryCharge,
      grandTotal,
      invoiceId: `inv_${orderId}`,
      tracking: {
        partnerName: 'HinchLogistics Priority Fleet',
        trackingNumber: `TRK-${orderNumber}`,
        vehicleNumber: 'Vehicle Allocation in Progress',
        consignmentNumber: `LR-${orderNumber}`,
        dispatchDate: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Order Placed & Payment Verified. Preparing Material dispatch.',
        milestones: [
          {
            title: 'Order Placed & Payment Confirmed',
            description: `Payment of ₹${grandTotal.toLocaleString('en-IN')} verified successfully`,
            timestamp: 'Just now',
            completed: true,
            current: true,
            location: 'HinchMart Payment Gateway',
          },
          {
            title: 'Seller Yard Allocation & E-Way Bill',
            description: 'Seller generating E-Way Bill and staging material at dispatch bay',
            timestamp: 'Pending',
            completed: false,
            current: false,
            location: 'Regional Stock Depot',
          },
          {
            title: 'Material Loaded & Weighed',
            description: 'Weighbridge confirmation and Mill Test Certificate (MTC) generation',
            timestamp: 'Pending',
            completed: false,
            current: false,
            location: 'Weighbridge Depot',
          },
          {
            title: 'In Transit',
            description: 'Consignment en route to delivery destination',
            timestamp: 'Pending',
            completed: false,
            current: false,
            location: 'En Route',
          },
          {
            title: 'Delivered',
            description: 'Site engineer verification and digital POD sign-off',
            timestamp: 'Pending',
            completed: false,
            current: false,
            location: deliveryAddress.city,
          },
        ],
      },
    };

    // Create matching Tax Invoice
    const newInvoice: TaxInvoice = {
      id: `inv_${orderId}`,
      invoiceNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      orderNumber,
      orderId,
      buyer: {
        companyName: deliveryAddress.companyName || this.user.companyName,
        contactPerson: deliveryAddress.contactName || this.user.name,
        gstin: deliveryAddress.gstin || this.user.gstin,
        pan: this.user.pan,
        address: `${deliveryAddress.addressLine1}, ${deliveryAddress.addressLine2 || ''}`,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        pincode: deliveryAddress.pincode,
      },
      seller: {
        companyName: newOrder.seller.name,
        gstin: '36AABCS9912F1Z4',
        pan: 'AABCS9912F',
        address: 'Industrial Area Phase 2, Sanathnagar',
        city: newOrder.seller.city,
        state: newOrder.seller.state,
        pincode: '500018',
      },
      hinchmart: {
        platformName: 'HinchMart B2B Marketplace Private Limited',
        gstin: '36AABCH4910M1Z2',
        cin: 'U74999TG2024PTC189201',
        address: 'Level 5, HinchMart Towers, Hitech City, Hyderabad, Telangana - 500081',
      },
      items: orderItems.map((oi) => ({
        description: `${oi.productTitle} (${oi.brand})`,
        hsnCode: oi.hsnCode,
        quantity: oi.quantity,
        unit: oi.unit,
        unitPrice: oi.unitPrice,
        taxableValue: oi.totalPrice,
        gstRate: oi.gstRate,
        cgstAmount: (oi.totalPrice * (oi.gstRate / 2)) / 100,
        sgstAmount: (oi.totalPrice * (oi.gstRate / 2)) / 100,
        igstAmount: 0,
        totalAmount: oi.totalPrice * (1 + oi.gstRate / 100),
      })),
      taxableTotal: taxableAmount,
      cgstTotal: cgst,
      sgstTotal: sgst,
      igstTotal: 0,
      freightAmount: deliveryCharge,
      grandTotal,
      paymentStatus: 'PAID',
      paymentMethod: params.paymentMethod.toUpperCase(),
      eWayBillNo: `EWB-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    };

    this.orders.unshift(newOrder);
    this.invoices.unshift(newInvoice);
    this.cartItems = [];

    // Notification
    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      title: 'Order Placed Successfully',
      message: `Your order #${orderNumber} for ₹${grandTotal.toLocaleString('en-IN')} has been placed.`,
      category: 'order',
      createdAt: new Date().toISOString(),
      isRead: false,
      link: `/account/orders/${orderId}`,
    });

    setStored(STORAGE_KEYS.ORDERS, this.orders);
    setStored(STORAGE_KEYS.INVOICES, this.invoices);
    setStored(STORAGE_KEYS.CART, this.cartItems);
    setStored(STORAGE_KEYS.NOTIFICATIONS, this.notifications);

    return newOrder;
  }

  // RFQS & QUOTES
  async getRFQs(): Promise<RFQ[]> {
    await delay(200);
    return [...this.rfqs];
  }

  async getRFQById(id: string): Promise<RFQ | null> {
    await delay(150);
    const rfq = this.rfqs.find((r) => r.id === id || r.rfqNumber === id);
    return rfq ? { ...rfq } : null;
  }

  async createRFQ(data: Omit<RFQ, 'id' | 'rfqNumber' | 'createdAt' | 'status' | 'quotesCount'>): Promise<RFQ> {
    await delay(400);
    const rfqNumber = `RFQ${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${Math.floor(1000 + Math.random() * 9000)}`;
    const newRfq: RFQ = {
      ...data,
      id: `rfq_${Date.now()}`,
      rfqNumber,
      createdAt: new Date().toISOString(),
      status: 'Quotes Received',
      quotesCount: 2,
    };

    // Auto-generate 2 competing supplier quotes for interactive review
    const quote1: Quote = {
      id: `qte_${Date.now()}_1`,
      rfqId: newRfq.id,
      seller: PRODUCTS[0].seller,
      pricePerUnit: (data.targetPrice || 50000) * 0.98,
      quantity: data.quantity,
      unit: data.unit,
      subtotal: (data.targetPrice || 50000) * 0.98 * data.quantity,
      gstRate: 18,
      gstAmount: (data.targetPrice || 50000) * 0.98 * data.quantity * 0.18,
      deliveryCharge: 0,
      landedCost: (data.targetPrice || 50000) * 0.98 * data.quantity * 1.18,
      deliveryDays: 3,
      validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      paymentTerms: '50% Advance, 50% on Delivery',
      notes: 'Direct stockyard dispatch with manufacturer test certification (MTC). Free site delivery.',
      isAccepted: false,
      createdAt: new Date().toISOString(),
    };

    const quote2: Quote = {
      id: `qte_${Date.now()}_2`,
      rfqId: newRfq.id,
      seller: PRODUCTS[1].seller,
      pricePerUnit: (data.targetPrice || 50000) * 0.96,
      quantity: data.quantity,
      unit: data.unit,
      subtotal: (data.targetPrice || 50000) * 0.96 * data.quantity,
      gstRate: 18,
      gstAmount: (data.targetPrice || 50000) * 0.96 * data.quantity * 0.18,
      deliveryCharge: 3500,
      landedCost: (data.targetPrice || 50000) * 0.96 * data.quantity * 1.18 + 3500,
      deliveryDays: 2,
      validUntil: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      paymentTerms: '100% Before Dispatch',
      notes: 'Express 48hr delivery. Virgin grade material guaranteed.',
      isAccepted: false,
      createdAt: new Date().toISOString(),
    };

    this.rfqs.unshift(newRfq);
    this.quotes.unshift(quote1, quote2);

    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      title: 'RFQ Broadcasted to Verified Suppliers',
      message: `RFQ #${rfqNumber} for ${data.quantity} ${data.unit} of ${data.productName} has received 2 initial quotations.`,
      category: 'quote',
      createdAt: new Date().toISOString(),
      isRead: false,
      link: `/account/rfqs/${newRfq.id}/quotes`,
    });

    setStored(STORAGE_KEYS.RFQS, this.rfqs);
    setStored(STORAGE_KEYS.QUOTES, this.quotes);
    setStored(STORAGE_KEYS.NOTIFICATIONS, this.notifications);

    return newRfq;
  }

  async getQuotesForRFQ(rfqId: string): Promise<Quote[]> {
    await delay(200);
    return this.quotes.filter((q) => q.rfqId === rfqId);
  }

  async acceptQuote(quoteId: string): Promise<{ quote: Quote; order: Order }> {
    await delay(400);
    const quoteIndex = this.quotes.findIndex((q) => q.id === quoteId);
    if (quoteIndex === -1) throw new Error('Quote not found');

    const quote = this.quotes[quoteIndex];
    quote.isAccepted = true;

    const rfqIndex = this.rfqs.findIndex((r) => r.id === quote.rfqId);
    if (rfqIndex > -1) {
      this.rfqs[rfqIndex].status = 'Quote Accepted';
    }

    // Convert to an order
    const orderNumber = `HM${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `ord_${orderNumber.toLowerCase()}`;
    const rfq = this.rfqs[rfqIndex];

    const order: Order = {
      id: orderId,
      orderNumber,
      createdAt: new Date().toISOString(),
      expectedDelivery: new Date(Date.now() + quote.deliveryDays * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          productId: `rfq_item_${quote.rfqId}`,
          productTitle: rfq ? rfq.productName : 'Custom RFQ Material',
          productImage: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=400&q=80',
          brand: rfq?.brandPreference || 'Primary Manufacturer',
          quantity: quote.quantity,
          unit: quote.unit,
          unitPrice: quote.pricePerUnit,
          gstRate: quote.gstRate,
          totalPrice: quote.subtotal,
          hsnCode: '72142090',
        },
      ],
      seller: quote.seller,
      status: 'Order Placed',
      paymentStatus: 'Pending',
      paymentMethod: 'bank_transfer',
      deliveryAddress: this.addresses[0],
      billingAddress: this.addresses[2] || this.addresses[0],
      subtotal: quote.subtotal,
      bulkDiscount: 0,
      taxableAmount: quote.subtotal,
      cgst: quote.gstAmount / 2,
      sgst: quote.gstAmount / 2,
      igst: 0,
      deliveryCharge: quote.deliveryCharge,
      grandTotal: quote.landedCost,
      invoiceId: `inv_${orderId}`,
      tracking: {
        partnerName: 'Direct Seller Dispatch Logistics',
        trackingNumber: `TRK-${orderNumber}`,
        vehicleNumber: 'Vehicle Allocation in Progress',
        consignmentNumber: `LR-${orderNumber}`,
        dispatchDate: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + quote.deliveryDays * 24 * 60 * 60 * 1000).toISOString(),
        status: `Quotation accepted from ${quote.seller.name}. Awaiting payment / dispatch confirmation.`,
        milestones: [
          {
            title: 'Quote Accepted & Order Created',
            description: `Accepted quote #${quote.id} from ${quote.seller.name}`,
            timestamp: 'Just now',
            completed: true,
            current: true,
            location: 'HinchMart RFQ Desk',
          },
          {
            title: 'Payment Confirmation & Dispatch',
            description: `Payment terms: ${quote.paymentTerms}`,
            timestamp: 'Pending',
            completed: false,
            current: false,
            location: quote.seller.city,
          },
        ],
      },
    };

    this.orders.unshift(order);

    setStored(STORAGE_KEYS.QUOTES, this.quotes);
    setStored(STORAGE_KEYS.RFQS, this.rfqs);
    setStored(STORAGE_KEYS.ORDERS, this.orders);

    return { quote, order };
  }

  // INVOICES
  async getInvoices(): Promise<TaxInvoice[]> {
    await delay(150);
    return [...this.invoices];
  }

  async getInvoiceById(id: string): Promise<TaxInvoice | null> {
    await delay(150);
    const invoice = this.invoices.find((i) => i.id === id || i.invoiceNumber === id || i.orderId === id || i.orderNumber === id);
    return invoice ? { ...invoice } : null;
  }

  // NOTIFICATIONS
  async getNotifications(): Promise<Notification[]> {
    await delay(100);
    return [...this.notifications];
  }

  async markNotificationRead(id: string): Promise<void> {
    await delay(100);
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) notif.isRead = true;
    setStored(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
  }

  async markAllNotificationsRead(): Promise<void> {
    await delay(100);
    this.notifications.forEach((n) => (n.isRead = true));
    setStored(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
  }

  // CONVERSATIONS & CHAT
  async getConversations(): Promise<Conversation[]> {
    await delay(150);
    return [...this.conversations];
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    await delay(150);
    return this.messages[conversationId] ? [...this.messages[conversationId]] : [];
  }

  async sendMessage(params: {
    conversationId?: string;
    sellerId: string;
    topic: any;
    subject: string;
    referenceId?: string;
    message: string;
  }): Promise<{ conversation: Conversation; message: ChatMessage }> {
    await delay(250);
    let convId = params.conversationId;
    let conv = convId ? this.conversations.find((c) => c.id === convId) : null;

    if (!conv) {
      const seller = PRODUCTS.find((p) => p.seller.id === params.sellerId)?.seller || PRODUCTS[0].seller;
      convId = `conv_${Date.now()}`;
      conv = {
        id: convId,
        seller,
        topic: params.topic,
        subject: params.subject,
        referenceId: params.referenceId,
        lastMessage: params.message,
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      };
      this.conversations.unshift(conv);
      this.messages[convId] = [];
    } else {
      conv.lastMessage = params.message;
      conv.lastMessageTime = new Date().toISOString();
    }

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: convId!,
      sender: 'buyer',
      senderName: this.user.name,
      message: params.message,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    if (!this.messages[convId!]) {
      this.messages[convId!] = [];
    }
    this.messages[convId!].push(newMessage);

    setStored(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    setStored(STORAGE_KEYS.MESSAGES, this.messages);

    return { conversation: conv, message: newMessage };
  }
}

export const mockDb = new MockDatabase();
