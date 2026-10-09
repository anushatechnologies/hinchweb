import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { categoryApi } from '../api/categoryApi';
import { subcategoryApi } from '../api/subcategoryApi';
import { brandApi } from '../api/brandApi';
import { productApi } from '../api/productApi';
import type { Category, Subcategory, Brand, Product } from '../types';
import { CategoryRibbon } from '../components/layout/CategoryRibbon';
import { SubcategoryPageSkeleton } from '../components/common/SkeletonLoaders';
import { useCartStore } from '../store/useCartStore';
import { useLocationStore } from '../store/useLocationStore';
import { useToastStore } from '../store/useToastStore';
import { formatINR } from '../utils/formatters';
import {
  ChevronRight,
  ChevronLeft,
  Search,
  ShoppingCart,
  Star,
  Truck,
  Play,
  MapPin,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export const SubcategoryLandingPage: React.FC = () => {
  const { categorySlug, subcategorySlug } = useParams<{
    categorySlug?: string;
    subcategorySlug?: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const { addItem } = useCartStore();
  const { pincode, openPincodeModal } = useLocationStore();
  const { showToast } = useToastStore();

  // Resolved Category & Subcategory Names
  const resolvedCatName =
    searchParams.get('category') ||
    (categorySlug ? decodeURIComponent(categorySlug).replace(/-/g, ' ') : '');
  const resolvedSubName =
    subcategorySlug
      ? decodeURIComponent(subcategorySlug).replace(/-/g, ' ')
      : searchParams.get('subcategory') || '';

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const selectedBrandParam = searchParams.get('brand') || '';
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    selectedBrandParam ? [selectedBrandParam] : []
  );
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [fastDeliveryOnly, setFastDeliveryOnly] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    async function loadData() {
      try {
        // 1. Fetch category
        let currentCat: Category | null = null;
        if (resolvedCatName) {
          currentCat = await categoryApi.getCategoryBySlug(resolvedCatName);
          setCategory(currentCat);
        }

        // 2. Fetch products for this subcategory & category
        const { products: fetchedProds } = await productApi.getProducts({
          category: resolvedCatName || undefined,
          categoryId: currentCat?.categoryId,
          subcategory: resolvedSubName || undefined,
          limit: 100,
        });

        // 3. Match Subcategory info
        let currentSub: Subcategory | null = null;
        if (currentCat?.subcategories) {
          currentSub =
            currentCat.subcategories.find(
              (s) =>
                s.name.toLowerCase() === resolvedSubName.toLowerCase() ||
                s.slug.toLowerCase() === (subcategorySlug || '').toLowerCase() ||
                s.name.toLowerCase().replace(/\s+/g, '-') === (subcategorySlug || '').toLowerCase()
            ) || null;
        }

        if (!currentSub && subcategorySlug) {
          try {
            currentSub = await subcategoryApi.getSubcategoryBySlug(subcategorySlug);
          } catch {}
        }

        if (!currentSub) {
          const resolvedSubId = await categoryApi.resolveSubcategoryId(resolvedSubName || subcategorySlug || '');
          if (resolvedSubId) {
            try {
              currentSub = await subcategoryApi.getSubcategoryById(resolvedSubId);
            } catch {
              try {
                currentSub = await categoryApi.getSubcategoryById(resolvedSubId);
              } catch {}
            }
          }
        }

        if (!currentSub && resolvedSubName) {
          currentSub = {
            id: `sub_${resolvedSubName}`,
            subcategoryId: 0,
            categoryId: currentCat?.categoryId || 0,
            name: resolvedSubName.charAt(0).toUpperCase() + resolvedSubName.slice(1),
            slug: resolvedSubName.toLowerCase().replace(/\s+/g, '-'),
            active: true,
            sortOrder: 1,
            productCount: fetchedProds.length,
          };
        }
        setSubcategory(currentSub);

        // 4. Fetch Brands strictly from Backend (Flow 2: GET /api/brands?subcategoryId=... or /api/brands)
        let backendBrands: Brand[] = [];
        try {
          if (currentSub?.subcategoryId) {
            backendBrands = await brandApi.getBrands({
              subcategoryId: currentSub.subcategoryId,
              active: true,
            });
          }

          if (backendBrands.length === 0 && currentCat?.categoryId) {
            const catBrands = await brandApi.getBrands({
              categoryId: currentCat.categoryId,
              active: true,
            });
            backendBrands = catBrands.filter(
              (b) =>
                !b.subcategoryId ||
                b.subcategoryId === currentSub?.subcategoryId ||
                (currentSub?.name && b.subcategoryName?.toLowerCase() === currentSub.name.toLowerCase())
            );
          }

          if (backendBrands.length === 0) {
            const allBrands = await brandApi.getBrands({ active: true });
            backendBrands = allBrands.filter(
              (b) =>
                (currentSub?.subcategoryId && b.subcategoryId === currentSub.subcategoryId) ||
                (currentSub?.name && b.subcategoryName?.toLowerCase() === currentSub.name.toLowerCase()) ||
                (currentCat?.categoryId && b.categoryId === currentCat.categoryId) ||
                (currentCat?.name && b.categoryName?.toLowerCase() === currentCat.name.toLowerCase())
            );
          }
        } catch (brandErr) {
          console.warn('Could not fetch brands from backend /api/brands:', brandErr);
        }

        // Map backend brands into unique dictionary
        const brandMap = new Map<string, Brand>();
        backendBrands.forEach((b) => {
          if (b.name && b.name.trim() !== '') {
            brandMap.set(b.name.toLowerCase(), b);
          }
        });

        // Also add any verified brands present on the fetched backend products
        fetchedProds.forEach((p) => {
          const bName = (p.brandName || p.brand || '').trim();
          if (bName && !brandMap.has(bName.toLowerCase())) {
            brandMap.set(bName.toLowerCase(), {
              id: `brand_${p.brandId || bName}`,
              brandId: p.brandId || 0,
              name: bName,
              slug: bName.toLowerCase().replace(/\s+/g, '-'),
              productCount: fetchedProds.filter((prod) => (prod.brandName || prod.brand || '').toLowerCase() === bName.toLowerCase()).length,
              active: true,
            });
          }
        });

        setBrands(Array.from(brandMap.values()));
        setProducts(fetchedProds);

        // Fetch selected brand details if brand query filter is present
        if (selectedBrandParam) {
          try {
            const brandDetail = await brandApi.getBrandBySlug(selectedBrandParam);
            if (brandDetail?.brandId) {
              try {
                await brandApi.getBrandById(brandDetail.brandId);
              } catch {}
            }
          } catch {}
        }
      } catch (err) {
        console.error('Error loading subcategory landing page:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [categorySlug, subcategorySlug, resolvedCatName, resolvedSubName]);

  // Handle Brand Filter Toggle
  const handleToggleBrand = (brandName: string) => {
    let next: string[];
    if (selectedBrands.includes(brandName)) {
      next = selectedBrands.filter((b) => b !== brandName);
    } else {
      next = [...selectedBrands, brandName];
    }
    setSelectedBrands(next);
    if (next.length === 1) {
      searchParams.set('brand', next[0]);
    } else {
      searchParams.delete('brand');
    }
    setSearchParams(searchParams, { replace: true });
  };

  // Price range definitions with counts
  const priceRanges = [
    { label: '₹1 - ₹500', min: 1, max: 500 },
    { label: '₹501 - ₹1000', min: 501, max: 1000 },
    { label: '₹1001 - ₹2500', min: 1001, max: 2500 },
    { label: '₹2501 - ₹5000', min: 2501, max: 5000 },
    { label: '₹5001 - ₹10000', min: 5001, max: 10000 },
    { label: '₹10001 - *', min: 10001, max: Infinity },
  ];

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by Brand
    if (selectedBrands.length > 0) {
      result = result.filter((p) =>
        selectedBrands.some(
          (b) =>
            (p.brandName || p.brand || '').toLowerCase() === b.toLowerCase() ||
            (p.brand || '').toLowerCase().includes(b.toLowerCase())
        )
      );
    }

    // Filter by Price Range
    if (selectedPriceRanges.length > 0) {
      result = result.filter((p) => {
        return selectedPriceRanges.some((rangeLabel) => {
          const range = priceRanges.find((r) => r.label === rangeLabel);
          if (!range) return false;
          return p.price >= range.min && p.price <= range.max;
        });
      });
    }

    // Filter by 24h delivery
    if (fastDeliveryOnly) {
      result = result.filter((p) => p.is24HourDelivery);
    }

    return result;
  }, [products, selectedBrands, selectedPriceRanges, fastDeliveryOnly]);

  // Bestsellers & Hot New Releases
  const bestsellers = useMemo(() => {
    return products.slice(0, 8);
  }, [products]);

  const hotNewReleases = useMemo(() => {
    return products.slice(2, 10);
  }, [products]);

  // Add to cart action
  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addItem(product, product.moq || 1);
      showToast('success', `Added ${product.title} to your procurement cart.`, 'Item Added');
    } catch {
      showToast('error', 'Could not add product to cart', 'Error');
    }
  };

  // Carousel horizontal scroll helper
  const scrollCarousel = (elementId: string, direction: 'left' | 'right') => {
    const el = document.getElementById(elementId);
    if (el) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const displayName =
    subcategory?.name ||
    resolvedSubName ||
    'Industrial Subcategory';

  const categoryDisplayName =
    category?.name ||
    resolvedCatName ||
    'Category';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <CategoryRibbon activeName={categoryDisplayName} />
        <SubcategoryPageSkeleton categoryName={categoryDisplayName} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 pb-16">
      {/* Top Moglix-Style Category Ribbon */}
      <CategoryRibbon activeName={categoryDisplayName} />

      <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* 1. Breadcrumb (Screenshot 1) */}
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs text-gray-500 font-medium">
          <Link to="/" className="hover:text-[#d9232d] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <Link
            to={`/category/${encodeURIComponent((category?.slug || categoryDisplayName).toLowerCase().replace(/\s+/g, '-'))}`}
            className="hover:text-[#d9232d] transition-colors"
          >
            {categoryDisplayName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="font-bold text-gray-900 truncate">{displayName}</span>
        </nav>

        {/* 2. Subcategory Header Hero with 24-hr Delivery Notice & Video (Screenshot 1) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title & Video Icon */}
            <div className="flex items-center gap-4">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-outfit tracking-tight">
                {displayName}
              </h1>

              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#d9232d] transition-colors border border-gray-200 px-3 py-1.5 rounded-full hover:border-red-300 cursor-pointer shadow-2xs bg-gray-50"
              >
                <span>Videos:</span>
                <div className="w-4 h-4 rounded-sm bg-red-600 flex items-center justify-center text-white">
                  <Play className="w-2.5 h-2.5 fill-current" />
                </div>
              </button>
            </div>

            {/* Location 24-hour Delivery Pill Banner (Screenshot 1) */}
            <button
              type="button"
              onClick={openPincodeModal}
              className="inline-flex items-center gap-2 bg-[#fef3c7]/60 hover:bg-[#fef3c7] border border-amber-300/80 px-4 py-2 rounded-full text-xs font-bold text-amber-950 transition-all cursor-pointer shadow-2xs self-start md:self-auto"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
                📦
              </div>
              <span>
                Allow location access to explore <strong>24 hours delivery</strong> products{' '}
                {pincode ? `(${pincode})` : ''}
              </span>
              <span className="text-red-600 font-black uppercase text-[11px] ml-1 hover:underline flex items-center gap-0.5">
                UPDATE <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>

          {/* Informative SEO Paragraph highlighting top brands with clickable links */}
          <div className="text-xs text-gray-600 leading-relaxed space-y-2 border-t border-gray-100 pt-3">
            <p>
              Are you looking for verified <strong>{displayName.toLowerCase()}</strong> for your commercial construction, industrial setup, or fabrication project? Finding certified materials with tested load ratings and standard compliance is essential to ensure site safety, efficiency, and longevity.
            </p>
            {brands.length > 0 && (
              <p>
                You can ease your procurement by exploring trusted brands available on HinchMart like{' '}
                {brands.slice(0, 8).map((b, idx) => (
                  <span key={b.id || idx}>
                    <button
                      type="button"
                      onClick={() => handleToggleBrand(b.name)}
                      className="font-bold text-[#d9232d] hover:underline cursor-pointer inline"
                    >
                      {b.name}
                    </button>
                    {idx < Math.min(brands.length, 8) - 1 ? ', ' : ''}
                  </span>
                ))}
                , and many more. All verified supplies are ready for instant dispatch at factory wholesale prices!
              </p>
            )}
          </div>
        </div>

        {/* 3. SHOP BY BRANDS (Circular Brand Logos with Next Arrow - Screenshot 2) */}
        {brands.length > 0 && (
          <section className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 font-outfit">
                Shop by Brands
              </h2>
              {selectedBrands.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrands([]);
                    searchParams.delete('brand');
                    setSearchParams(searchParams, { replace: true });
                  }}
                  className="text-xs font-bold text-[#d9232d] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Clear Brand Filter ({selectedBrands.join(', ')})</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative group">
              {/* Scroll Left Button */}
              {brands.length > 6 && (
                <button
                  type="button"
                  onClick={() => scrollCarousel('brands_carousel_row', 'left')}
                  className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 text-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 cursor-pointer"
                  aria-label="Previous Brands"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Circular Brands Row */}
              <div
                id="brands_carousel_row"
                className="flex items-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-1"
              >
                {brands.map((b) => {
                  const isSelected = selectedBrands.includes(b.name);
                  return (
                    <button
                      key={b.id || b.name}
                      type="button"
                      onClick={() => handleToggleBrand(b.name)}
                      className="flex flex-col items-center shrink-0 text-center group/brand cursor-pointer transition-transform hover:-translate-y-1 focus:outline-hidden"
                    >
                      {/* Circle Card */}
                      <div
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 p-3 bg-white flex items-center justify-center transition-all shadow-xs ${
                          isSelected
                            ? 'border-[#d9232d] ring-4 ring-red-100 shadow-md'
                            : 'border-gray-200 group-hover/brand:border-red-400 group-hover/brand:shadow-md'
                        }`}
                      >
                        {b.imageUrl || b.logo ? (
                          <img
                            src={b.imageUrl || b.logo}
                            alt={b.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="font-black text-sm sm:text-base text-gray-800 tracking-tight font-outfit uppercase">
                            {b.name}
                          </span>
                        )}
                      </div>

                      {/* Labels Below */}
                      <div className="mt-2 text-center max-w-[100px]">
                        <div
                          className={`text-xs font-black truncate ${
                            isSelected ? 'text-[#d9232d]' : 'text-gray-900 group-hover/brand:text-[#d9232d]'
                          }`}
                        >
                          {b.name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium truncate">
                          {displayName}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Scroll Right Button */}
              {brands.length > 6 && (
                <button
                  type="button"
                  onClick={() => scrollCarousel('brands_carousel_row', 'right')}
                  className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 text-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 cursor-pointer"
                  aria-label="Next Brands"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </section>
        )}

        {/* 4. BESTSELLERS SECTION (Soft Lavender / Blue Tinted Container - Screenshot 2) */}
        {bestsellers.length > 0 && (
          <section className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-blue-50/80 rounded-3xl p-5 sm:p-6 border border-blue-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-6 bg-[#d9232d] rounded-full" />
                <h2 className="text-xl font-black text-gray-900 font-outfit">
                  Bestsellers
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollCarousel('bestsellers_carousel', 'left')}
                  className="w-8 h-8 rounded-full bg-white shadow-xs border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-700 cursor-pointer"
                  aria-label="Previous Bestsellers"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel('bestsellers_carousel', 'right')}
                  className="w-8 h-8 rounded-full bg-white shadow-xs border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-700 cursor-pointer"
                  aria-label="Next Bestsellers"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Horizontal Product Cards Row */}
            <div
              id="bestsellers_carousel"
              className="flex items-stretch gap-4 overflow-x-auto no-scrollbar py-2"
            >
              {bestsellers.map((prod) => {
                const discount = prod.mrp
                  ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100)
                  : 0;

                return (
                  <div
                    key={prod.id}
                    className="w-56 sm:w-60 shrink-0 bg-white rounded-2xl border border-gray-200 p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group relative"
                  >
                    {/* Top Deal of the Day Ribbon (Screenshot 2) */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="bg-[#0f766e] text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                        Deal of the Day
                      </span>
                    </div>

                    <Link to={`/product/${prod.id}`} className="space-y-3 block">
                      {/* Image */}
                      <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden p-2 flex items-center justify-center">
                        <img
                          src={prod.images[0] || prod.imageUrl}
                          alt={prod.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Title & Brand */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">
                          {prod.brand}
                        </div>
                        <h3 className="text-xs font-extrabold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#d9232d] transition-colors">
                          {prod.title}
                        </h3>
                      </div>
                    </Link>

                    {/* Price & Add to Cart */}
                    <div className="pt-3 border-t border-gray-100 space-y-2.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-gray-900 font-outfit">
                          {formatINR(prod.price)}
                        </span>
                        {prod.mrp && prod.mrp > prod.price && (
                          <>
                            <span className="text-[11px] text-gray-400 line-through">
                              {formatINR(prod.mrp)}
                            </span>
                            <span className="text-[11px] font-extrabold text-emerald-600">
                              {discount}% OFF
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(prod, e)}
                        className="w-full py-2 bg-[#d9232d] hover:bg-[#b91c1c] text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>ADD TO CART</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. HOT NEW RELEASES SECTION (Soft Yellow Tinted Container - Screenshot 3) */}
        {hotNewReleases.length > 0 && (
          <section className="bg-gradient-to-r from-amber-50/80 via-yellow-50/40 to-amber-50/80 rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-6 bg-[#f59e0b] rounded-full" />
                <h2 className="text-xl font-black text-gray-900 font-outfit">
                  Hot New Releases
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollCarousel('hot_releases_carousel', 'left')}
                  className="w-8 h-8 rounded-full bg-white shadow-xs border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-700 cursor-pointer"
                  aria-label="Previous Releases"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel('hot_releases_carousel', 'right')}
                  className="w-8 h-8 rounded-full bg-white shadow-xs border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-700 cursor-pointer"
                  aria-label="Next Releases"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              id="hot_releases_carousel"
              className="flex items-stretch gap-4 overflow-x-auto no-scrollbar py-2"
            >
              {hotNewReleases.map((prod) => {
                const discount = prod.mrp
                  ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100)
                  : 0;

                return (
                  <div
                    key={prod.id}
                    className="w-56 sm:w-60 shrink-0 bg-white rounded-2xl border border-gray-200 p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group"
                  >
                    <Link to={`/product/${prod.id}`} className="space-y-3 block">
                      <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden p-2 flex items-center justify-center">
                        <img
                          src={prod.images[0] || prod.imageUrl}
                          alt={prod.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">
                          {prod.brand}
                        </div>
                        <h3 className="text-xs font-extrabold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#d9232d] transition-colors">
                          {prod.title}
                        </h3>
                      </div>
                    </Link>

                    <div className="pt-3 border-t border-gray-100 space-y-2.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-gray-900 font-outfit">
                          {formatINR(prod.price)}
                        </span>
                        {prod.mrp && prod.mrp > prod.price && (
                          <>
                            <span className="text-[11px] text-gray-400 line-through">
                              {formatINR(prod.mrp)}
                            </span>
                            <span className="text-[11px] font-extrabold text-emerald-600">
                              {discount}% OFF
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(prod, e)}
                        className="w-full py-2 bg-[#d9232d] hover:bg-[#b91c1c] text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>ADD TO CART</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 6. MAIN PRODUCTS LISTING WITH LEFT FILTER SIDEBAR (Screenshot 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
          {/* LEFT FILTER SIDEBAR (Screenshot 4) */}
          <aside className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 font-black text-sm text-gray-900 font-outfit">
                <SlidersHorizontal className="w-4 h-4 text-[#d9232d]" />
                <span>Filters</span>
              </div>
              {(selectedBrands.length > 0 || selectedPriceRanges.length > 0 || fastDeliveryOnly) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrands([]);
                    setSelectedPriceRanges([]);
                    setFastDeliveryOnly(false);
                    searchParams.delete('brand');
                    setSearchParams(searchParams, { replace: true });
                  }}
                  className="text-xs text-[#d9232d] hover:underline font-bold cursor-pointer"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* 1. Category Accordion */}
            <div className="space-y-2 border-b border-gray-100 pb-4">
              <div className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                <span>Category</span>
                <span className="text-gray-400 font-normal">−</span>
              </div>
              <div className="pl-2 space-y-1 text-xs">
                <div className="flex items-center justify-between text-gray-700 font-semibold py-1">
                  <span className="flex items-center gap-1 text-[#d9232d]">
                    <ChevronRight className="w-3.5 h-3.5" />
                    {categoryDisplayName}
                  </span>
                  <span className="text-gray-400">({products.length})</span>
                </div>
              </div>
            </div>

            {/* 2. Price Filter Checkboxes */}
            <div className="space-y-3 border-b border-gray-100 pb-4">
              <div className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                <span>Price</span>
                <span className="text-gray-400 font-normal">−</span>
              </div>
              <div className="space-y-2 text-xs">
                {priceRanges.map((range) => {
                  const count = products.filter(
                    (p) => p.price >= range.min && p.price <= range.max
                  ).length;
                  const isChecked = selectedPriceRanges.includes(range.label);

                  return (
                    <label
                      key={range.label}
                      className="flex items-center justify-between text-gray-700 hover:text-gray-900 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedPriceRanges(
                                selectedPriceRanges.filter((r) => r !== range.label)
                              );
                            } else {
                              setSelectedPriceRanges([...selectedPriceRanges, range.label]);
                            }
                          }}
                          className="rounded-md border-gray-300 text-[#d9232d] focus:ring-red-200 w-4 h-4 cursor-pointer"
                        />
                        <span className="font-medium">{range.label}</span>
                      </div>
                      <span className="text-gray-400 text-[11px]">({count})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3. Brand Search & Checkboxes */}
            <div className="space-y-3 border-b border-gray-100 pb-4">
              <div className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                <span>Brand</span>
                <span className="text-gray-400 font-normal">−</span>
              </div>

              {/* Brand Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={brandSearchQuery}
                  onChange={(e) => setBrandSearchQuery(e.target.value)}
                  placeholder="Search Brand"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d9232d] focus:bg-white outline-hidden"
                />
              </div>

              {/* Brand List */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs divide-y-0">
                {brands
                  .filter((b) =>
                    b.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
                  )
                  .map((b) => {
                    const isChecked = selectedBrands.includes(b.name);
                    const count = products.filter(
                      (p) => (p.brand || '').toLowerCase() === b.name.toLowerCase()
                    ).length;

                    return (
                      <label
                        key={b.id || b.name}
                        className="flex items-center justify-between text-gray-700 hover:text-gray-900 cursor-pointer select-none py-0.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleBrand(b.name)}
                            className="rounded-md border-gray-300 text-[#d9232d] focus:ring-red-200 w-4 h-4 cursor-pointer"
                          />
                          <span className="font-medium">{b.name}</span>
                        </div>
                        <span className="text-gray-400 text-[11px]">
                          ({count > 0 ? count : b.productCount || 1})
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* 4. Express Delivery Fast Filter */}
            <div className="pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fastDeliveryOnly}
                  onChange={(e) => setFastDeliveryOnly(e.target.checked)}
                  className="rounded-md border-gray-300 text-[#d9232d] focus:ring-red-200 w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-1 text-amber-700">
                  <Truck className="w-3.5 h-3.5" />
                  <span>24-Hour Express Dispatch Only</span>
                </div>
              </label>
            </div>
          </aside>

          {/* RIGHT PRODUCTS GRID & PROCUREMENT INSIGHTS (Screenshot 4) */}
          <main className="lg:col-span-9 space-y-6">
            {/* Active Filters Bar & Count */}
            <div className="bg-white rounded-2xl px-5 py-3.5 border border-gray-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="text-xs text-gray-500 font-medium">
                Showing <strong className="text-gray-900 font-extrabold">{filteredProducts.length}</strong> items in{' '}
                <strong className="text-[#d9232d]">{displayName}</strong>
              </div>

              {selectedBrands.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedBrands.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1 bg-red-50 text-[#d9232d] text-xs font-bold px-2.5 py-1 rounded-full border border-red-200"
                    >
                      Brand: {b}
                      <button
                        type="button"
                        onClick={() => handleToggleBrand(b)}
                        className="hover:text-red-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Products Grid Matching Screenshot 4 */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto text-2xl">
                  📦
                </div>
                <h3 className="text-lg font-black text-gray-900 font-outfit">
                  No Direct Matches Found with Active Filters
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Try clearing your brand or price filter selections to see all verified materials available in {displayName}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrands([]);
                    setSelectedPriceRanges([]);
                    setFastDeliveryOnly(false);
                    searchParams.delete('brand');
                    setSearchParams(searchParams, { replace: true });
                  }}
                  className="px-5 py-2.5 bg-[#d9232d] text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((prod) => {
                  const discount = prod.mrp
                    ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100)
                    : 0;

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between hover:shadow-lg transition-all group relative"
                    >
                      {/* Rating Badge (Screenshot 4) */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="inline-flex items-center gap-1 bg-[#15803d] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-2xs">
                          <span>{prod.rating || 4.7}</span>
                          <Star className="w-3 h-3 fill-current" />
                          <span className="opacity-80 font-normal">
                            ({prod.reviewCount || 252} Reviews)
                          </span>
                        </div>
                        {prod.is24HourDelivery && (
                          <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            ⚡ 24h Dispatch
                          </span>
                        )}
                      </div>

                      <Link to={`/product/${prod.id}`} className="space-y-3 block">
                        {/* Product Image */}
                        <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden p-3 flex items-center justify-center">
                          <img
                            src={prod.images[0] || prod.imageUrl}
                            alt={prod.title}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                        </div>

                        {/* Title & Brand */}
                        <div className="space-y-1">
                          <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#d9232d] transition-colors">
                            {prod.title}
                          </h3>
                          <div className="text-[11px] font-bold text-gray-500">
                            By: <span className="text-gray-800 font-extrabold">{prod.brand}</span>
                          </div>
                        </div>
                      </Link>

                      {/* Pricing & CTA */}
                      <div className="pt-3 border-t border-gray-100 space-y-2.5 mt-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-gray-900 font-outfit">
                            {formatINR(prod.price)}
                          </span>
                          {prod.mrp && prod.mrp > prod.price && (
                            <>
                              <span className="text-xs text-gray-400 line-through">
                                {formatINR(prod.mrp)}
                              </span>
                              <span className="text-xs font-black text-[#15803d]">
                                {discount}% OFF
                              </span>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(prod, e)}
                          className="w-full py-2.5 bg-[#d9232d] hover:bg-[#b91c1c] text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>ADD TO CART</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 7. MOGLIX / HINCHMART INSIGHTS WIDGET (Screenshot 4) */}
            <section className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-black text-[#d9232d] uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>HinchMart Market Insights</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Infographic 1: Spec / Size preference */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2.5">
                  <h4 className="text-xs font-extrabold text-gray-900">
                    {displayName} purchase as per Specification / Grade
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                      <span>Primary Standard Grade</span>
                      <span className="text-[#d9232d]">62% Demand</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="w-[62%] h-full bg-[#d9232d] rounded-full" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 pt-1">
                      <span>Commercial Grade</span>
                      <span className="text-gray-600">38% Demand</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="w-[38%] h-full bg-gray-400 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Infographic 2: Bulk / Wholesale orders */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2.5">
                  <h4 className="text-xs font-extrabold text-gray-900">
                    {displayName} purchase as per Bulk MOQ Tiers
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                      <span>Full Truckload & Site Delivery</span>
                      <span className="text-[#0f766e]">74% Orders</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="w-[74%] h-full bg-[#0f766e] rounded-full" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 pt-1">
                      <span>Retail Sample Pack</span>
                      <span className="text-gray-600">26% Orders</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="w-[26%] h-full bg-gray-400 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Video Demonstration Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-black text-gray-900 font-outfit">
              {displayName} Technical Demonstration & Inspection Guide
            </h3>
            <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center text-white p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#d9232d] flex items-center justify-center text-white text-2xl shadow-xl shadow-red-600/40">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
              <p className="text-xs text-gray-300 max-w-sm text-center">
                Quality testing, chemical composition inspection, and batch verification video stream for {displayName}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
