import { apiClient } from '../services/apiClient';
import type {
  Product,
  ProductFilters,
  CreateProductInput,
  BulkPriceTier,
  ProductSpecification,
} from '../types';

export function mapBackendProductToFrontend(raw: any): Product {
  if (!raw) throw new Error('Invalid product payload');

  const id = String(raw.productId || raw.id || '');
  const images: string[] = Array.isArray(raw.images) && raw.images.length > 0
    ? raw.images.map((img: any) => (typeof img === 'string' ? img : img.imageUrl || img.url || ''))
    : raw.imageUrl || raw.primaryImageUrl
    ? [raw.imageUrl || raw.primaryImageUrl]
    : [];

  const rawBulk = raw.bulkPricingTiers || raw.bulkPrices || [];
  const bulkPricing: BulkPriceTier[] = Array.isArray(rawBulk)
    ? rawBulk.map((bp: any) => ({
        tierId: bp.tierId,
        minQty: Number(bp.minQty || bp.minQuantity || 1),
        maxQty: bp.maxQty ? Number(bp.maxQty) : bp.maxQuantity ? Number(bp.maxQuantity) : null,
        pricePerUnit: Number(bp.price || bp.pricePerUnit || raw.price || raw.sellingPrice || 0),
        discountPercent: Number(bp.discountPercentage ?? bp.discountPercent ?? 0),
        price: Number(bp.price || bp.pricePerUnit || raw.price || raw.sellingPrice || 0),
        discountPercentage: Number(bp.discountPercentage ?? bp.discountPercent ?? 0),
      }))
    : [];

  let specifications: ProductSpecification[] = [];
  if (raw.specifications && typeof raw.specifications === 'object' && !Array.isArray(raw.specifications)) {
    specifications = Object.entries(raw.specifications).map(([name, value]) => ({
      name,
      value: String(value),
    }));
  } else if (typeof raw.specifications === 'string') {
    try {
      const parsed = JSON.parse(raw.specifications);
      specifications = Object.entries(parsed).map(([name, value]) => ({
        name,
        value: String(value),
      }));
    } catch {
      specifications = [{ name: 'Specifications', value: raw.specifications }];
    }
  } else if (Array.isArray(raw.specifications)) {
    specifications = raw.specifications;
  }

  const vendor = raw.vendor
    ? {
        id: String(raw.vendor.vendorId || raw.vendor.id || ''),
        name: raw.vendor.companyName || raw.vendor.name || 'Industrial Vendor',
        city: raw.vendor.city || '',
        state: raw.vendor.state || '',
        isVerified: raw.vendor.isVerified ?? true,
        rating: Number(raw.vendor.rating || 0),
        successfulOrders: Number(raw.vendor.successfulOrders || 0),
        gstinMasked: raw.vendor.gstinMasked || '',
      }
    : {
        id: String(raw.sellerId || ''),
        name: raw.sellerCompanyName || raw.sellerName || 'Verified Supplier',
        city: raw.sellerCity || '',
        state: '',
        isVerified: true,
        rating: 4.8,
        successfulOrders: 0,
        gstinMasked: '',
      };

  return {
    id,
    productId: Number(raw.productId || raw.id || 0),
    slug: raw.slug || `product-${id}`,
    sku: raw.sku || `SKU-${id}`,
    title: raw.title || raw.productName || '',
    brand: raw.brand || raw.brandName || '',
    category: raw.category || raw.categoryName || '',
    categoryId: raw.categoryId || 0,
    subcategory: raw.subcategory || raw.subcategoryName || '',
    subcategoryId: raw.subcategoryId || 0,
    description: raw.description || '',
    images: images.filter(Boolean),
    imageUrl: images[0] || raw.imageUrl || '',
    price: Number(raw.price || raw.sellingPrice || 0),
    mrp: raw.mrp ? Number(raw.mrp) : undefined,
    unit: raw.unit || 'Piece',
    moq: Number(raw.moq || 1),
    stock: Number(raw.stockQty ?? raw.stock ?? 0),
    stockQty: Number(raw.stockQty ?? raw.stock ?? 0),
    active: raw.active ?? true,
    is24HourDelivery: Boolean(raw.is24HourDelivery),
    gstRate: Number(raw.gstRate || 18),
    hsnCode: raw.hsnCode || '',
    bulkPricing,
    bulkPricingTiers: bulkPricing,
    rating: Number(raw.rating || 0),
    ratingCount: Number(raw.reviewCount || raw.ratingCount || 0),
    reviewCount: Number(raw.reviewCount || 0),
    seller: vendor,
    vendor: raw.vendor,
    deliveryDays: raw.is24HourDelivery ? 1 : Number(raw.deliveryDays || 2),
    deliveryCharge: Number(raw.deliveryCharge || 0),
    specifications,
    isFeatured: Boolean(raw.isFeatured ?? true),
    isBulkDeal: bulkPricing.length > 0,
    approvalStatus: raw.approvalStatus || 'APPROVED',
    rejectionReason: raw.rejectionReason,
    createdAt: raw.createdAt,
  };
}

export const productApi = {
  // 3.1 Search & Filter Products (Paginated)
  async getProducts(filters?: ProductFilters): Promise<{
    products: Product[];
    total: number;
    pagination?: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
  }> {
    const params: Record<string, any> = {
      page: filters?.page || 1,
      limit: filters?.limit || 20,
    };

    if (filters?.categoryId) params.categoryId = filters.categoryId;
    if (filters?.subcategoryId) params.subcategoryId = filters.subcategoryId;
    if (filters?.search) params.search = filters.search;
    if (filters?.minPrice !== undefined) params.minPrice = filters.minPrice;
    if (filters?.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
    if (filters?.brand) {
      params.brand = Array.isArray(filters.brand) ? filters.brand.join(',') : filters.brand;
    }
    if (filters?.is24HourDelivery !== undefined) params.is24HourDelivery = filters.is24HourDelivery;
    if (filters?.sort) params.sort = filters.sort;

    try {
      const res = await apiClient.get('/products', { params });
      if (res.data?.success && res.data?.data) {
        const rawList = Array.isArray(res.data.data) ? res.data.data : res.data.data.content || [];
        const products = rawList.map(mapBackendProductToFrontend);
        const pagination = res.data.pagination || {
          page: params.page,
          limit: params.limit,
          total: products.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        };
        return { products, total: pagination.total || products.length, pagination };
      }
      if (Array.isArray(res.data)) {
        const products = res.data.map(mapBackendProductToFrontend);
        return {
          products,
          total: products.length,
          pagination: {
            page: 1,
            limit: products.length,
            total: products.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        };
      }
    } catch (err) {
      console.error('Backend GET /products error:', err);
    }

    return {
      products: [],
      total: 0,
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    };
  },

  // 3.2 Get Product Details By ID
  async getProductById(idOrSlug: string | number): Promise<Product> {
    const res = await apiClient.get(`/products/${idOrSlug}`);
    if (res.data?.success && res.data?.data) {
      return mapBackendProductToFrontend(res.data.data);
    }
    if (res.data?.productId || res.data?.id) {
      return mapBackendProductToFrontend(res.data);
    }
    throw new Error(`Product ${idOrSlug} not found`);
  },

  // 3.3 Create Product
  async createProduct(payload: CreateProductInput): Promise<Product> {
    const res = await apiClient.post('/products', payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendProductToFrontend(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to create product');
  },

  // 3.4 Update Product
  async updateProduct(id: number | string, payload: Partial<CreateProductInput>): Promise<Product> {
    const res = await apiClient.put(`/products/${id}`, payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendProductToFrontend(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to update product');
  },

  // 3.4 Delete Product
  async deleteProduct(id: number | string): Promise<boolean> {
    const res = await apiClient.delete(`/products/${id}`);
    return res.data?.success ?? true;
  },

  // 3.4 Activate Product
  async activateProduct(id: number | string): Promise<boolean> {
    const res = await apiClient.patch(`/products/${id}/activate`);
    return res.data?.success ?? true;
  },

  // 3.4 Deactivate Product
  async deactivateProduct(id: number | string): Promise<boolean> {
    const res = await apiClient.patch(`/products/${id}/deactivate`);
    return res.data?.success ?? true;
  },

  // 4. Admin Product Approval APIs
  async getAdminProducts(): Promise<Product[]> {
    const res = await apiClient.get('/admin/products');
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data.map(mapBackendProductToFrontend);
    }
    return [];
  },

  async getAdminPendingProducts(): Promise<Product[]> {
    const res = await apiClient.get('/admin/products/pending');
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data.map(mapBackendProductToFrontend);
    }
    return [];
  },

  async getAdminProductById(id: number | string): Promise<Product> {
    const res = await apiClient.get(`/admin/products/${id}`);
    if (res.data?.success && res.data?.data) {
      return mapBackendProductToFrontend(res.data.data);
    }
    throw new Error('Admin product details not found');
  },

  async approveProduct(id: number | string): Promise<boolean> {
    const res = await apiClient.patch(`/admin/products/${id}/approve`);
    return res.data?.success ?? true;
  },

  async rejectProduct(id: number | string, reason: string): Promise<boolean> {
    const res = await apiClient.patch(`/admin/products/${id}/reject`, { reason });
    return res.data?.success ?? true;
  },

  // Helper shortcuts
  async getFeaturedProducts(): Promise<Product[]> {
    const { products } = await this.getProducts({ limit: 8 });
    return products.slice(0, 8);
  },

  async getBulkDeals(): Promise<Product[]> {
    const { products } = await this.getProducts({ limit: 8 });
    return products.filter((p) => p.isBulkDeal || p.bulkPricing.length > 0).slice(0, 8);
  },
};
