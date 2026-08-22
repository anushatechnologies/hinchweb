export type ProductUnit =
  | 'Piece'
  | 'Pack'
  | 'Box'
  | 'Bag'
  | 'Kg'
  | 'Ton'
  | 'Meter'
  | 'Foot'
  | 'Roll'
  | 'Set'
  | 'Litre'
  | 'Drum'
  | 'Bundle';

export interface BulkPriceTier {
  minQty: number;
  maxQty: number | null;
  pricePerUnit: number;
  discountPercent?: number;
}

export interface ProductSpecification {
  name: string;
  value: string;
}

export interface Seller {
  id: string;
  name: string;
  isVerified: boolean;
  rating: number;
  city: string;
  state: string;
  successfulOrders: number;
  gstinMasked: string;
  phoneMasked?: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  brand: string;
  category: string;
  categoryId: string;
  subcategory: string;
  subcategoryId: string;
  description: string;
  images: string[];
  price: number; // Base unit price
  mrp?: number;
  unit: ProductUnit;
  moq: number; // Minimum order quantity
  gstRate: number; // e.g. 18, 28, 12
  hsnCode: string;
  bulkPricing: BulkPriceTier[];
  stock: number;
  rating: number;
  ratingCount: number;
  seller: Seller;
  specifications: ProductSpecification[];
  isFeatured?: boolean;
  isBulkDeal?: boolean;
  tags?: string[];
  industries?: string[];
  deliveryDays: number;
  deliveryCharge: number;
  freeDeliveryAbove?: number;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  image: string;
  description: string;
  subcategories: Subcategory[];
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  category: string;
  productCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  gstin: string;
  pan: string;
  businessType: 'Private Limited' | 'Partnership' | 'Proprietorship' | 'Contractor' | 'SME' | 'Individual';
  industry: string;
  isGstVerified: boolean;
  isApprovedBuyer: boolean;
  creditLimit: number;
  creditAvailable: number;
  creditDays: number;
  billingAddress?: Address;
}

export interface Address {
  id: string;
  contactName: string;
  mobile: string;
  companyName: string;
  gstin?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  addressType: 'Site / Project' | 'Warehouse / Factory' | 'Office / Commercial' | 'Other';
  isDefaultDelivery: boolean;
  isDefaultBilling: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedUnitPrice: number;
  unit: ProductUnit;
  gstRate: number;
  bulkSavings: number;
  totalPrice: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  totalBulkDiscount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  estimatedFreight: number;
  grandTotal: number;
}

export interface CheckoutPreview {
  items: CartItem[];
  subtotal: number;
  bulkDiscount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  freight: number;
  grandTotal: number;
  deliveryPincode: string;
  isInterState: boolean;
}

export type PaymentMethod =
  | 'upi'
  | 'card'
  | 'netbanking'
  | 'bank_transfer'
  | 'pay_later';

export type PaymentState = 'idle' | 'processing' | 'success' | 'failed' | 'pending';

export type OrderStatus =
  | 'Order Placed'
  | 'Payment Confirmed'
  | 'Seller Confirmed'
  | 'Packed'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface TrackingMilestone {
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
  location: string;
}

export interface TransportDetails {
  partnerName: string;
  trackingNumber: string;
  vehicleNumber: string;
  consignmentNumber: string;
  dispatchDate: string;
  estimatedDelivery: string;
  status: string;
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  productImage: string;
  brand: string;
  quantity: number;
  unit: ProductUnit;
  unitPrice: number;
  gstRate: number;
  totalPrice: number;
  hsnCode: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: OrderItem[];
  seller: Seller;
  status: OrderStatus;
  paymentStatus: 'Paid' | 'Pending' | 'Credit Authorized' | 'Failed';
  paymentMethod: PaymentMethod;
  deliveryAddress: Address;
  billingAddress: Address;
  subtotal: number;
  bulkDiscount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  deliveryCharge: number;
  grandTotal: number;
  tracking: TransportDetails & { milestones: TrackingMilestone[] };
  invoiceId?: string;
  expectedDelivery: string;
}

export type RFQStatus =
  | 'Draft'
  | 'Submitted'
  | 'Open'
  | 'Quotes Received'
  | 'Quote Accepted'
  | 'Converted to Order'
  | 'Closed'
  | 'Cancelled';

export interface RFQ {
  id: string;
  rfqNumber: string;
  productName: string;
  category: string;
  brandPreference: string;
  quantity: number;
  unit: ProductUnit;
  deliveryLocation: string;
  deliveryPincode: string;
  requiredByDate: string;
  targetPrice?: number;
  specifications: string;
  notes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  status: RFQStatus;
  quotesCount: number;
}

export interface Quote {
  id: string;
  rfqId: string;
  seller: Seller;
  pricePerUnit: number;
  quantity: number;
  unit: ProductUnit;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  deliveryCharge: number;
  landedCost: number;
  deliveryDays: number;
  validUntil: string;
  paymentTerms:
    | '100% Advance'
    | '50% Advance, 50% on Delivery'
    | '100% Before Dispatch'
    | '30 Days Credit'
    | '45 Days Credit';
  notes?: string;
  isAccepted: boolean;
  createdAt: string;
}

export interface TaxInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  orderNumber: string;
  orderId: string;
  buyer: {
    companyName: string;
    contactPerson: string;
    gstin: string;
    pan: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  seller: {
    companyName: string;
    gstin: string;
    pan: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  hinchmart: {
    platformName: string;
    gstin: string;
    cin: string;
    address: string;
  };
  items: {
    description: string;
    hsnCode: string;
    quantity: number;
    unit: ProductUnit;
    unitPrice: number;
    taxableValue: number;
    gstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalAmount: number;
  }[];
  taxableTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  freightAmount: number;
  grandTotal: number;
  paymentStatus: string;
  paymentMethod: string;
  eWayBillNo?: string;
  qrCodeMock?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: 'order' | 'rfq' | 'quote' | 'payment' | 'delivery' | 'system';
  createdAt: string;
  isRead: boolean;
  link: string;
}

export interface Conversation {
  id: string;
  seller: Seller;
  topic: 'Product Inquiry' | 'RFQ Discussion' | 'Order Discussion' | 'Delivery Issue' | 'Payment Issue';
  subject: string;
  referenceId?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'buyer' | 'seller';
  senderName: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  availability?: boolean;
  sellerVerified?: boolean;
  rating?: number;
  gstRate?: number[];
  moqMax?: number;
  deliveryDaysMax?: number;
  industry?: string;
  search?: string;
  sort?: 'popularity' | 'price_asc' | 'price_desc' | 'newest' | 'rating';
  page?: number;
  limit?: number;
}
