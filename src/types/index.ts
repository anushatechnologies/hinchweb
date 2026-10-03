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
  | 'Bundle'
  | 'CUBIC_METER'
  | string;

export interface BulkPriceTier {
  tierId?: number;
  minQty: number;
  maxQty: number | null;
  pricePerUnit: number;
  discountPercent?: number;
  price?: number;
  discountPercentage?: number;
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

export interface Vendor {
  vendorId: number;
  companyName: string;
  city: string;
  isVerified: boolean;
  rating: number;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  timestamp?: string;
}

export interface BulkPricingTier {
  tierId?: number;
  minQty: number;
  maxQty?: number | null;
  price: number;
  discountPercentage?: number;
}

export interface VendorInfo {
  vendorId: number;
  companyName: string;
  city: string;
  isVerified: boolean;
  rating: number;
}

export interface Product {
  id: string;
  productId: number;
  brandId?: number;
  brand: string;
  brandName?: string;
  subcategoryId: number | string;
  subcategory?: string;
  subcategoryName?: string;
  categoryId: number | string;
  category?: string;
  categoryName?: string;
  title: string;
  slug: string;
  sku?: string;
  description: string;
  images: string[];
  imageUrl?: string;
  price: number;
  mrp?: number;
  unit: ProductUnit;
  moq: number;
  stock: number;
  stockQty?: number;
  gstRate: number;
  hsnCode?: string;
  bulkPricing: BulkPriceTier[];
  bulkPricingTiers?: BulkPriceTier[];
  rating: number;
  ratingCount?: number;
  reviewCount?: number;
  active?: boolean;
  is24HourDelivery?: boolean;
  status?: 'APPROVED' | 'PENDING' | 'REJECTED' | string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  rejectionReason?: string;
  seller: Seller;
  vendor?: Vendor;
  specifications: ProductSpecification[];
  isFeatured?: boolean;
  isBulkDeal?: boolean;
  tags?: string[];
  industries?: string[];
  deliveryDays?: number;
  deliveryCharge?: number;
  freeDeliveryAbove?: number;
  createdAt?: string;
}

export interface CreateProductInput {
  brandId?: number;
  categoryId: number;
  subcategoryId: number;
  title: string;
  sku?: string;
  brand?: string;
  price: number;
  mrp?: number;
  unit: string;
  moq: number;
  stockQty: number;
  description: string;
  imageUrl?: string;
  images?: string[];
  active?: boolean;
  is24HourDelivery?: boolean;
  gstRate: number;
  hsnCode?: string;
  specifications?: Record<string, string> | ProductSpecification[];
  bulkPricingTiers?: {
    minQty: number;
    maxQty?: number | null;
    price: number;
    discountPercentage?: number;
  }[];
}

export interface Subcategory {
  id: string;
  subcategoryId: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  slug: string;
  imageUrl?: string;
  image?: string;
  active: boolean;
  sortOrder: number;
  productCount: number;
  itemCount?: number;
  brands?: Brand[];
  createdAt?: string;
}

export interface CreateSubcategoryInput {
  categoryId: number;
  name: string;
  slug?: string;
  imageUrl?: string;
  sortOrder?: number;
  active?: boolean;
}

export interface Category {
  id: string;
  categoryId: number;
  name: string;
  slug: string;
  iconName?: string;
  description?: string;
  imageUrl?: string;
  image?: string;
  active: boolean;
  sortOrder: number;
  productCount: number;
  subcategories?: Subcategory[];
  createdAt?: string;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  iconName?: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  active?: boolean;
}

export interface Brand {
  id: string;
  brandId: number;
  subcategoryId?: number;
  subcategoryName?: string;
  categoryId?: number;
  categoryName?: string;
  name: string;
  slug: string;
  imageUrl?: string;
  logo?: string;
  sortOrder?: number;
  productCount: number;
  active: boolean;
  createdAt?: string;
}

export interface ProductFilters {
  categoryId?: number | string;
  subcategoryId?: number | string;
  brandId?: number | string;
  category?: string;
  subcategory?: string;
  brand?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  is24HourDelivery?: boolean;
  search?: string;
  sort?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  active?: boolean;
}

export interface SearchSuggestionItem {
  type: 'BRAND' | 'PRODUCT' | 'CATEGORY';
  id: number | string;
  title: string;
  subtitle?: string;
  link: string;
}

export interface SearchSuggestions {
  suggestions: string[];
  matchingCategories: string[];
  matchingBrands: string[];
  structuredSuggestions?: SearchSuggestionItem[];
}

export interface Banner {
  bannerId?: number;
  id?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  targetUrl?: string;
  active?: boolean;
  sortOrder?: number;
}

export interface CreateBannerInput {
  title: string;
  subtitle?: string;
  targetUrl?: string;
  sortOrder?: number;
  active?: boolean;
}

export interface ProcurementStats {
  totalOrders: number;
  activeRfqs: number;
  wishlistItems: number;
  savedAddresses: number;
}

export interface BusinessInfo {
  companyName: string;
  gstNumber: string;
  panNumber: string;
  businessType: string;
  isGstVerified: boolean;
  creditLimit: number;
  availableCredit: number;
}

export interface User {
  id: string | number;
  userId?: number;
  firebaseUid?: string;
  name: string;
  fullName?: string;
  email: string;
  phone: string;
  role?: string;
  active?: boolean;
  sellerId?: number | null;
  tier?: string;
  companyName: string;
  gstin: string;
  pan: string;
  businessType: string;
  industry: string;
  isGstVerified: boolean;
  isApprovedBuyer: boolean;
  isProfileComplete?: boolean;
  creditLimit: number;
  creditAvailable: number;
  creditDays: number;
  procurementStats?: ProcurementStats;
  business?: BusinessInfo;
  billingAddress?: Address;
}

export interface UpdateUserProfileInput {
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
  companyName?: string;
  gstNumber?: string;
  panNumber?: string;
  businessType?: string;
  creditLimit?: number;
}

export interface CustomerMaster {
  customerId: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstNumber: string;
  panNumber: string;
  businessType: string;
  creditLimit: number;
  status: string;
  createdAt?: string;
}

export type Customer = CustomerMaster;
export type CreateCustomerInput = Partial<CustomerMaster>;
export type UpdateCustomerInput = Partial<CustomerMaster>;

export interface Address {
  id: string;
  addressId?: number;
  siteName?: string;
  recipientName?: string;
  contactName: string;
  mobile: string;
  phone?: string;
  companyName: string;
  country?: string;
  gstin?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  addressType: 'Site / Project' | 'Warehouse / Factory' | 'Office / Commercial' | 'HOME' | 'WORK' | 'OTHER' | string;
  isDefault?: boolean;
  isDefaultDelivery: boolean;
  isDefaultBilling: boolean;
  hasHeavyVehicleAccess?: boolean;
  createdAt?: string;
}

export interface CreateSiteAddressInput {
  siteName?: string;
  recipientName?: string;
  contactName?: string;
  phone?: string;
  mobile?: string;
  companyName?: string;
  country?: string;
  gstin?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  addressType?: string;
  isDefault?: boolean;
  isDefaultDelivery?: boolean;
  isDefaultBilling?: boolean;
  hasHeavyVehicleAccess?: boolean;
}

export type CreateAddressInput = CreateSiteAddressInput;

export type KYCDocumentType =
  | 'GST_CERTIFICATE'
  | 'COMPANY_PAN'
  | 'PAN'
  | 'INCORPORATION_CERTIFICATE'
  | 'MSME_UDYAM'
  | 'MSME'
  | 'CHEQUE'
  | 'TRADE_LICENSE'
  | 'OTHER';

export interface KYCDocument {
  documentId: number;
  customerId: number;
  documentType: KYCDocumentType;
  title: string;
  documentNumber: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string | null;
  expiresOn?: string;
  uploadedAt: string;
  verifiedAt?: string | null;
}

export interface SubmitKYCInput {
  documentType: KYCDocumentType;
  title: string;
  documentNumber: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  expiresOn?: string;
}

export interface CartItem {
  id?: string;
  cartItemId?: number;
  productId: string | number;
  title?: string;
  productTitle?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  product?: Product;
  quantity: number;
  unit?: ProductUnit;
  price?: number;
  unitPrice?: number;
  originalPrice?: number;
  appliedTier?: string;
  selectedUnitPrice?: number;
  effectiveUnitPrice?: number;
  totalPrice: number;
  lineTotal?: number;
  lineGst?: number;
  gstRate: number;
  hsnCode?: string;
  moq?: number;
  stock?: number;
  is24HourDelivery?: boolean;
  deliveryCharge?: number;
  seller?: Seller;
  bulkSavings?: number;
}

export interface Cart {
  id?: string;
  cartId?: number;
  storeId?: number;
  storeName?: string;
  storeSlug?: string;
  items: CartItem[];
  totalItems?: number;
  subtotal: number;
  couponDiscount?: number;
  totalBulkDiscount?: number;
  discountTotal?: number;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  gstTotal?: number;
  taxTotal?: number;
  totalGst?: number;
  estimatedFreight?: number;
  deliveryCharge?: number;
  deliveryTotal?: number;
  shippingTotal?: number;
  grandTotal: number;
  appliedCoupon?: any;
  estimatedDeliveryDays?: number;
  weightEstimateKg?: number;
}

export interface AddToCartInput {
  productId: number | string;
  quantity: number;
}

export interface ApplyCouponResult {
  success: boolean;
  message: string;
  discountAmount?: number;
  coupon?: any;
}

export interface WishlistItem {
  productId: number | string;
  title: string;
  slug?: string;
  price: number;
  mrp?: number;
  imageUrl: string;
  brand?: string;
  category?: string;
  unit?: string;
  inStock?: boolean;
  addedAt?: string;
}

export interface CheckoutPreview {
  items?: CartItem[];
  subtotal: number;
  discount?: number;
  discountTotal?: number;
  bulkDiscount?: number;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  taxTotal?: number;
  gstTotal?: number;
  totalGst?: number;
  freight?: number;
  freightCharge?: number;
  deliveryTotal?: number;
  shippingTotal?: number;
  craneUnloadingCharge?: number;
  grandTotal: number;
  deliveryPincode?: string;
  isInterState?: boolean;
}

export interface CheckoutPreviewInput {
  addressId: number | string;
  deliverySlot?: string;
  requiresCraneUnloading?: boolean;
}

export type PreviewCheckoutInput = CheckoutPreviewInput;

export type PaymentMethod =
  | 'RAZORPAY'
  | 'UPI'
  | 'CARD'
  | 'NETBANKING'
  | 'BANK_TRANSFER'
  | 'PAY_LATER'
  | 'upi'
  | 'card'
  | 'netbanking'
  | 'bank_transfer'
  | 'pay_later'
  | string;

export interface PlaceOrderInput {
  addressId: number | string;
  paymentMethod: string;
  deliverySlot?: string;
  deliveryInstructions?: string;
  poNumber?: string;
  requiresCraneUnloading?: boolean;
}

export interface OrderItem {
  id?: string;
  orderItemId?: number;
  productId: string | number;
  title?: string;
  productName?: string;
  productTitle?: string;
  productImage?: string;
  imageUrl?: string;
  brand?: string;
  quantity: number;
  unit: ProductUnit;
  price?: number;
  unitPrice: number;
  gstRate: number;
  totalPrice?: number;
  total?: number;
  hsnCode?: string;
}

export interface OrderTrackingTimelineItem {
  status: string;
  title: string;
  description: string;
  timestamp: string;
  isCompleted: boolean;
}

export interface OrderTracking {
  orderId: number | string;
  orderNumber: string;
  currentStatus: string;
  carrierName?: string;
  vehicleNumber?: string;
  driverPhone?: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  timeline?: OrderTrackingTimelineItem[];
}

export interface Order {
  id: string;
  orderId?: number;
  orderNumber: string;
  poNumber?: string;
  customerId?: number;
  createdAt: string;
  status: string;
  orderStatus?: string;
  paymentStatus: string;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  itemCount?: number;
  firstItemTitle?: string;
  firstItemImage?: string;
  seller?: Seller;
  deliveryAddress: Address;
  billingAddress: Address;
  deliverySlot?: string;
  deliveryInstructions?: string;
  subtotal: number;
  bulkDiscount?: number;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  taxTotal?: number;
  gstTotal?: number;
  deliveryCharge: number;
  shippingTotal?: number;
  discountTotal?: number;
  totalAmount?: number;
  grandTotal: number;
  trackingTimeline?: OrderTrackingTimelineItem[];
  tracking?: any;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  ewayBillNumber?: string;
  mtcDocumentUrl?: string;
  weightTons?: number;
  craneUnloadingRequired?: boolean;
  expectedDelivery?: string;
  estimatedDelivery?: string;
}

export interface RFQ {
  id: string;
  rfqId?: number;
  rfqNumber: string;
  title?: string;
  productName: string;
  productMaterial?: string;
  category: string;
  brandPreference?: string;
  quantity: number;
  unit: ProductUnit;
  technicalGrade?: string;
  mtcRequired?: boolean;
  deliveryLocation: string;
  deliveryPincode?: string;
  siteAccess?: string;
  craneRequired?: boolean;
  targetBudget?: number;
  paymentTerms?: string;
  requiredByDate: string;
  targetPrice?: number;
  specifications: string;
  notes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  status: string;
  quotesCount: number;
  quotes?: Quote[];
  expiresAt?: string;
}

export interface CreateBulkRFQInput {
  title?: string;
  productName?: string;
  category: string;
  productMaterial?: string;
  brandPreference?: string;
  quantity: number;
  unit: string;
  technicalGrade?: string;
  mtcRequired?: boolean;
  deliveryLocation: string;
  requiredByDate: string;
  siteAccess?: string;
  craneRequired?: boolean;
  targetBudget?: number;
  targetPrice?: number;
  paymentTerms?: string;
  specifications?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  notes?: string;
}

export type CreateRFQInput = CreateBulkRFQInput;

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
  paymentTerms: string;
  isAccepted: boolean;
  createdAt: string;
  notes: string;
}

export interface TaxInvoiceItem {
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxableValue: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface TaxInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  invoiceDate: string;
  seller: {
    companyName: string;
    gstin: string;
    pan: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  buyer: {
    companyName: string;
    contactPerson?: string;
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
  items: TaxInvoiceItem[];
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
  category: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  senderId?: string;
  sender?: string;
  senderName: string;
  senderRole?: 'BUYER' | 'SELLER' | 'SUPPORT' | string;
  text?: string;
  message?: string;
  timestamp: string;
  attachmentUrl?: string;
  status?: string;
}

export interface Conversation {
  id: string;
  sellerId?: string;
  sellerName?: string;
  seller?: Seller;
  topic?: string;
  subject?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
  messages?: ChatMessage[];
}

// 1. File Upload
export interface UploadResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  url: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  sizeBytes?: number;
}

// 2. Pincode & Delivery Serviceability
export interface ServiceabilityResult {
  success?: boolean;
  pincode: string;
  city: string;
  state: string;
  serviceable: boolean;
  estimatedDays: number;
  isExpressAvailable: boolean;
  area?: string;
}

// 3. Global Tax Invoice Item
export interface GlobalInvoiceItem {
  invoiceNumber: string;
  orderId: number | string;
  orderNumber: string;
  date: string;
  amount: number;
  downloadUrl: string;
  status: string;
}

// 4. Order Cancellation, Return & MTC
export interface OrderCancellationInput {
  location?: string;
  description: string;
}

export interface OrderCancellationResult {
  orderId: number | string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
}

export interface OrderDisputeInput {
  reason: string;
  description: string;
  itemId?: number;
  photos?: string[];
}

export interface OrderDisputeResult {
  disputeId: string;
  orderId: number | string;
  status: string;
  reason: string;
  description: string;
  createdAt: string;
}

export interface MillTestCertificate {
  orderId: number | string;
  certificateNumber: string;
  productName: string;
  heatNumber: string;
  batchNumber: string;
  grade: string;
  inspectionAgency: string;
  chemicalAnalysis: Record<string, string>;
  mechanicalProperties: Record<string, string>;
  status: string;
  verified: boolean;
  downloadUrl?: string;
}

// 5. Coupons & Promotions
export interface Coupon {
  couponId: number;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FLAT' | string;
  discountValue: number;
  minimumOrderAmount: number;
  maxDiscountAmount: number;
  validUntil: string;
}

// 6. Product Reviews
export interface ProductReview {
  reviewId: number;
  productId: number;
  customerName?: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export interface CreateReviewInput {
  productId: number;
  rating: number;
  title: string;
  comment: string;
}

// 7. Credit Limit & Ledger
export interface CreditApplicationInput {
  businessName: string;
  gstin: string;
  panNumber: string;
  requestedLimit: number;
  tenureDays: number;
  annualTurnover: number;
  financialDocUrls?: string[];
  notes?: string;
}

export interface CreditApplicationResult {
  applicationId: string;
  businessName: string;
  gstin: string;
  requestedLimit: number;
  approvedLimit?: number;
  tenureDays: number;
  status: string;
  message?: string;
  appliedAt?: string;
}

export interface CreditLedgerTransaction {
  transactionId: string;
  type: 'DRAWDOWN' | 'REPAYMENT' | string;
  amount: number;
  description: string;
  referenceNumber?: string;
  date: string;
}

export interface CreditLedger {
  creditLimit: number;
  availableLimit: number;
  utilizedLimit: number;
  dueAmount: number;
  dueDate: string;
  status: string;
  currency: string;
  transactions: CreditLedgerTransaction[];
}

// 8. RFQ Negotiation
export interface RejectQuoteInput {
  reason: string;
}

export interface CounterQuoteInput {
  counterPrice: number;
  quantity?: number;
  notes?: string;
}

export interface CloseRFQInput {
  reason: string;
}

// 9. AI Requirement Estimation & Quotation Types
export type EstimationItemStatus = 'MATCHED' | 'MULTIPLE_MATCHES' | 'NOT_FOUND' | 'RESOLVED';
export type EstimationStatus =
  | 'PROCESSING'
  | 'REQUIREMENTS_EXTRACTED'
  | 'RESOLVED'
  | 'QUOTATION_GENERATED'
  | 'EXPIRED';

export interface CandidateProduct {
  productId: number | string;
  title: string;
  brand: string;
  category: string;
  price: number;
  mrp: number;
  unit: string;
  stock: number;
  imageUrl: string;
  specifications: Record<string, string>;
  appliedTier?: string;
  tierSavings?: number;
}

export interface EstimationItem {
  itemId: number | string;
  requirementText: string;
  quantity: number;
  unit: string;
  matchedProductId: number | string | null;
  matchedProductTitle: string | null;
  matchedProductBrand: string | null;
  matchedProductImage: string | null;
  unitPrice: number;
  appliedTier: string;
  tierDiscount: number;
  gstRate: number;
  gstAmount: number;
  lineTotal: number;
  status: EstimationItemStatus;
  candidateProducts: CandidateProduct[];
}

export interface Estimation {
  id: string;
  estimationNumber: string;
  fileName: string;
  fileUrl?: string;
  fileSizeFormatted?: string;
  status: EstimationStatus;
  projectNotes?: string;
  createdAt: string;
  validUntil?: string;
  quotationNumber?: string;
  quotationPdfUrl?: string | null;
  itemsCount: number;
  subtotal: number;
  gstTotal: number;
  tierSavings: number;
  grandTotal: number;
  items: EstimationItem[];
}

export interface EstimationHistoryResponse {
  data: Estimation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

