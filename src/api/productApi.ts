import { apiClient } from '../services/apiClient';
import { mockDb } from './mockDb';
import type { Product, ProductFilters } from '../types';

export function mapBackendProductToFrontend(raw: any): Product {
  if (!raw) throw new Error('Invalid product payload');

  const images: string[] = Array.isArray(raw.images) && raw.images.length > 0
    ? raw.images.map((img: any) => (typeof img === 'string' ? img : img.imageUrl || img.url || ''))
    : [raw.primaryImageUrl || raw.imageUrl || 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800'];

  const bulkPricing = Array.isArray(raw.bulkPrices) && raw.bulkPrices.length > 0
    ? raw.bulkPrices.map((bp: any) => ({
        minQty: bp.minQuantity || bp.minQty || 1,
        maxQty: bp.maxQuantity || bp.maxQty || null,
        pricePerUnit: Number(bp.pricePerUnit || raw.sellingPrice || raw.price || 0),
        discountPercent: raw.sellingPrice && bp.pricePerUnit
          ? Math.max(0, Math.round(((raw.sellingPrice - bp.pricePerUnit) / raw.sellingPrice) * 100))
          : 0,
      }))
    : [
        {
          minQty: Number(raw.moq || 1),
          maxQty: Number(raw.moq || 1) * 4,
          pricePerUnit: Number(raw.sellingPrice || raw.price || 1000),
          discountPercent: 0,
        },
        {
          minQty: Number(raw.moq || 1) * 5,
          maxQty: Number(raw.moq || 1) * 19,
          pricePerUnit: Math.round(Number(raw.sellingPrice || raw.price || 1000) * 0.95),
          discountPercent: 5,
        },
        {
          minQty: Number(raw.moq || 1) * 20,
          maxQty: null,
          pricePerUnit: Math.round(Number(raw.sellingPrice || raw.price || 1000) * 0.90),
          discountPercent: 10,
        },
      ];

  let specifications: { name: string; value: string }[] = [];
  if (typeof raw.specifications === 'string') {
    try {
      const parsed = JSON.parse(raw.specifications);
      specifications = Object.entries(parsed).map(([k, v]) => ({ name: k, value: String(v) }));
    } catch {
      specifications = [{ name: 'Specifications', value: raw.specifications }];
    }
  } else if (Array.isArray(raw.specifications)) {
    specifications = raw.specifications;
  }

  return {
    id: String(raw.id),
    slug: raw.slug || `product-${raw.id}`,
    title: raw.productName || raw.title || 'Industrial Material',
    brand: raw.brandName || raw.brand || 'Tata Tiscon',
    category: raw.categoryName || raw.category || 'Steel & Structural Materials',
    categoryId: String(raw.categoryId || '1'),
    subcategory: raw.subcategoryName || raw.subcategory || 'TMT Rebars',
    subcategoryId: String(raw.subcategoryId || '1'),
    description:
      raw.description ||
      'Industrial grade material certified for structural integrity, tensile strength, and standard compliance.',
    images: images.filter(Boolean),
    price: Number(raw.sellingPrice || raw.price || 0),
    mrp: raw.mrp ? Number(raw.mrp) : Number(raw.sellingPrice || raw.price || 0) * 1.1,
    unit: raw.unit || raw.unitName || 'Ton',
    moq: Number(raw.moq || 1),
    gstRate: Number(raw.gstRate || 18),
    hsnCode: raw.hsnCode || '72142090',
    bulkPricing,
    stock: Number(raw.stock ?? 500),
    rating: 4.85,
    ratingCount: 142,
    seller: {
      id: String(raw.sellerId || '5'),
      name: raw.sellerCompanyName || raw.sellerName || 'Tata Steel Distribution Hub',
      city: 'Pune',
      state: 'Maharashtra',
      isVerified: true,
      rating: 4.9,
      successfulOrders: 4280,
      gstinMasked: '27AAACT2727Q1ZW',
    },
    deliveryDays: Number(raw.deliveryDays || 2),
    deliveryCharge: 2500,
    specifications,
    isFeatured: true,
    isBulkDeal: true,
  };
}

export const productApi = {
  async getProducts(filters?: ProductFilters): Promise<{ products: Product[]; total: number }> {
    try {
      const params: Record<string, any> = {
        page: 0,
        size: 50,
      };

      if (filters?.search) params.query = filters.search;
      if (filters?.minPrice) params.minPrice = filters.minPrice;
      if (filters?.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters?.sort) {
        if (filters.sort === 'price_asc') params.sort = 'sellingPrice,asc';
        if (filters.sort === 'price_desc') params.sort = 'sellingPrice,desc';
      }

      const res = await apiClient.get('/products', { params });
      if (res.data?.success && res.data?.data) {
        const rawContent = Array.isArray(res.data.data)
          ? res.data.data
          : res.data.data.content || [];
        
        let products = rawContent.map(mapBackendProductToFrontend);

        // Apply in-memory filtering for category or brand if needed
        if (filters?.category) {
          const catQuery = String(filters.category).toLowerCase();
          products = products.filter((p: Product) =>
            p.category.toLowerCase().includes(catQuery)
          );
        }
        if (filters?.brand && filters.brand.length > 0) {
          const brandList = Array.isArray(filters.brand)
            ? filters.brand.map((b) => b.toLowerCase())
            : [String(filters.brand).toLowerCase()];
          products = products.filter((p: Product) =>
            brandList.includes(p.brand.toLowerCase())
          );
        }
        if (filters?.gstRate && filters.gstRate.length > 0) {
          products = products.filter((p: Product) =>
            filters.gstRate!.includes(p.gstRate)
          );
        }

        return { products, total: products.length };
      }
    } catch (err) {
      console.warn('Backend /products failed, using fallback dataset:', err);
    }
    return mockDb.getProducts(filters);
  },

  async getProductById(idOrSlug: string): Promise<Product> {
    try {
      const res = await apiClient.get(`/products/${idOrSlug}`);
      if (res.data?.success && res.data?.data) {
        return mapBackendProductToFrontend(res.data.data);
      }
    } catch (err) {
      console.warn(`Backend /products/${idOrSlug} failed, trying fallback:`, err);
    }

    const prod = await mockDb.getProductById(idOrSlug);
    if (!prod) throw new Error('Product not found');
    return prod;
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const { products } = await this.getProducts();
    return products.slice(0, 8);
  },

  async getBulkDeals(): Promise<Product[]> {
    const { products } = await this.getProducts();
    return products.filter((p) => p.isBulkDeal || p.bulkPricing.length > 0).slice(0, 8);
  },
};
