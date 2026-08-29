import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import type { Product, Category, Brand } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { useRFQModalStore } from '../store/useRFQModalStore';
import {
  Filter,
  SlidersHorizontal,
  X,
  ShieldCheck,
  FileText,
  Layers,
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openRFQModal } = useRFQModalStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filters State from URL or defaults
  const categoryParam = searchParams.get('category') || '';
  const subcategoryParam = searchParams.get('subcategory') || '';
  const brandParam = searchParams.get('brand') || '';
  const searchParam = searchParams.get('search') || '';
  const dealsParam = searchParams.get('deals') === 'true';
  const fastDeliveryParam = searchParams.get('fastDelivery') === 'true';
  const sortParam = (searchParams.get('sort') as any) || 'popularity';

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    subcategoryParam ? [subcategoryParam] : []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    brandParam ? [brandParam] : []
  );
  const [selectedGstRates, setSelectedGstRates] = useState<number[]>([]);
  const [onlyVerifiedSeller, setOnlyVerifiedSeller] = useState(false);
  const [only24HourDelivery, setOnly24HourDelivery] = useState(fastDeliveryParam);
  const [sortBy, setSortBy] = useState<string>(sortParam);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }
    if (subcategoryParam) {
      setSelectedSubcategories([subcategoryParam]);
    }
    if (brandParam) {
      setSelectedBrands([brandParam]);
    }
    if (fastDeliveryParam) {
      setOnly24HourDelivery(true);
    }
  }, [categoryParam, subcategoryParam, brandParam, fastDeliveryParam]);

  useEffect(() => {
    setIsLoading(true);
    categoryApi.getCategories().then(setCategories).catch(console.error);
    categoryApi.getBrands().then(setBrands).catch(console.error);

    const sortMap: Record<string, any> = {
      price_asc: 'price_asc',
      price_desc: 'price_desc',
      rating: 'rating',
      newest: 'newest',
    };

    productApi
      .getProducts({
        search: searchParam || undefined,
        category: categoryParam || undefined,
        subcategory: subcategoryParam || undefined,
        brand: brandParam || undefined,
        is24HourDelivery: fastDeliveryParam ? true : undefined,
        sort: sortMap[sortParam] || undefined,
        limit: 50,
      })
      .then((res) => {
        setProducts(res.products);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [searchParam, categoryParam, subcategoryParam, brandParam, fastDeliveryParam, sortParam]);

  // Derived available subcategories for selected categories
  const availableSubcategories = useMemo(() => {
    const subcats: { name: string; categoryName: string; count?: number }[] = [];
    
    // 1. From Category objects nested subcategories
    categories.forEach((cat) => {
      if (selectedCategories.length === 0 || selectedCategories.includes(cat.name)) {
        if (cat.subcategories && cat.subcategories.length > 0) {
          cat.subcategories.forEach((sub) => {
            if (!subcats.some((s) => s.name.toLowerCase() === sub.name.toLowerCase())) {
              subcats.push({ name: sub.name, categoryName: cat.name, count: sub.productCount });
            }
          });
        }
      }
    });

    // 2. From actual products if present
    products.forEach((p) => {
      if (p.subcategory && !subcats.some((s) => s.name.toLowerCase() === p.subcategory.toLowerCase())) {
        subcats.push({ name: p.subcategory, categoryName: p.category });
      }
    });

    return subcats;
  }, [categories, selectedCategories, products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query filter (client-side refinement)
    if (searchParam) {
      const q = searchParam.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
          (p.hsnCode && p.hsnCode.includes(q)) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) =>
        selectedCategories.some((c) => p.category.toLowerCase().includes(c.toLowerCase()))
      );
    }

    // Subcategory filter
    if (selectedSubcategories.length > 0) {
      result = result.filter((p) =>
        selectedSubcategories.some((s) => p.subcategory?.toLowerCase().includes(s.toLowerCase()))
      );
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      result = result.filter((p) =>
        selectedBrands.some((b) => p.brand.toLowerCase().includes(b.toLowerCase()))
      );
    }

    // Deals filter
    if (dealsParam) {
      result = result.filter((p) => p.isBulkDeal || p.bulkPricing.length > 0);
    }

    // 24 Hour Express Delivery
    if (only24HourDelivery) {
      result = result.filter((p) => p.is24HourDelivery || p.deliveryDays === 1);
    }

    // GST rate filter
    if (selectedGstRates.length > 0) {
      result = result.filter((p) => selectedGstRates.includes(p.gstRate));
    }

    // Verified seller filter
    if (onlyVerifiedSeller) {
      result = result.filter((p) => p.seller.isVerified);
    }

    // Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'moq') {
      result.sort((a, b) => a.moq - b.moq);
    }

    return result;
  }, [
    products,
    searchParam,
    selectedCategories,
    selectedSubcategories,
    selectedBrands,
    dealsParam,
    only24HourDelivery,
    selectedGstRates,
    onlyVerifiedSeller,
    sortBy,
  ]);

  const toggleCategory = (catName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  const toggleSubcategory = (subName: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subName) ? prev.filter((s) => s !== subName) : [...prev, subName]
    );
  };

  const toggleBrand = (brandName: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName) ? prev.filter((b) => b !== brandName) : [...prev, brandName]
    );
  };

  const toggleGstRate = (rate: number) => {
    setSelectedGstRates((prev) =>
      prev.includes(rate) ? prev.filter((r) => r !== rate) : [...prev, rate]
    );
  };

  const handleClearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedBrands([]);
    setSelectedGstRates([]);
    setOnlyVerifiedSeller(false);
    setOnly24HourDelivery(false);
    setSearchParams({});
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedSubcategories.length > 0 ||
    selectedBrands.length > 0 ||
    selectedGstRates.length > 0 ||
    onlyVerifiedSeller ||
    only24HourDelivery ||
    dealsParam ||
    Boolean(searchParam);

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-6">
      {/* 1. Header Breadcrumbs & Search Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-industrial-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-industrial-500 mb-1">
            <Link to="/" className="hover:text-industrial-900">Home</Link>
            <span>/</span>
            <Link to="/catalog" className="hover:text-industrial-900">Catalog</Link>
            {selectedCategories.length === 1 && (
              <>
                <span>/</span>
                <Link
                  to={`/category/${encodeURIComponent(selectedCategories[0].toLowerCase().replace(/\s+/g, '-'))}`}
                  className="font-semibold text-industrial-700 hover:text-brand-600 transition-colors"
                >
                  {selectedCategories[0]}
                </Link>
              </>
            )}
            {selectedSubcategories.length === 1 && (
              <>
                <span>/</span>
                <span className="font-bold text-industrial-950">{selectedSubcategories[0]}</span>
              </>
            )}
            {searchParam && (
              <>
                <span>/</span>
                <span className="text-brand-600">"{searchParam}"</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-industrial-950">
            {dealsParam
              ? 'Wholesale Bulk Tier Deals'
              : selectedCategories.length === 1
              ? selectedCategories[0]
              : 'All Industrial & Construction Materials'}
          </h1>
          <p className="text-xs text-industrial-500 mt-0.5">
            Showing <strong className="text-industrial-900 font-mono">{filteredProducts.length}</strong> verified industrial items with wholesale tier pricing
          </p>
        </div>

        {/* Sort and View Mode Toolbar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden px-3.5 py-2 bg-industrial-100 border border-industrial-300 rounded-xl text-xs font-bold text-industrial-800 flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-industrial-200 rounded-xl p-1 shadow-2xs text-xs">
            <label className="text-industrial-500 pl-2 font-medium">Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-semibold text-industrial-900 pr-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="popularity">Most Popular / Order Volume</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Supplier Rating</option>
              <option value="moq">Lowest MOQ</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. SUBCATEGORIES BROWSER PILLS (Watch & Filter Subcategories) */}
      {availableSubcategories.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-industrial-200 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-industrial-800">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>Browse Subcategories {selectedCategories.length === 1 ? `in ${selectedCategories[0]}` : ''}</span>
            </div>
            {selectedSubcategories.length > 0 && (
              <button
                onClick={() => setSelectedSubcategories([])}
                className="text-[11px] text-rose-600 font-semibold hover:underline"
              >
                Clear Subcategory Filter
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {availableSubcategories.map((sub, idx) => {
              const isSelected = selectedSubcategories.includes(sub.name);
              return (
                <button
                  key={idx}
                  onClick={() => toggleSubcategory(sub.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm ring-1 ring-brand-600'
                      : 'bg-industrial-50 hover:bg-industrial-100 text-industrial-800 border border-industrial-200'
                  }`}
                >
                  <span>{sub.name}</span>
                  {sub.count !== undefined && sub.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-industrial-200 text-industrial-700'}`}>
                      {sub.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-industrial-500">Active Filters:</span>
          {searchParam && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-800 border border-brand-200 text-xs font-semibold">
              Search: "{searchParam}"
              <button
                onClick={() => {
                  searchParams.delete('search');
                  setSearchParams(searchParams);
                }}
              >
                <X className="w-3 h-3 hover:text-brand-950" />
              </button>
            </span>
          )}
          {selectedCategories.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-industrial-100 text-industrial-800 border border-industrial-300 text-xs font-semibold"
            >
              Category: {c}
              <button onClick={() => toggleCategory(c)}>
                <X className="w-3 h-3 hover:text-rose-600" />
              </button>
            </span>
          ))}
          {selectedSubcategories.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-800 border border-brand-300 text-xs font-bold"
            >
              Subcategory: {s}
              <button onClick={() => toggleSubcategory(s)}>
                <X className="w-3 h-3 hover:text-rose-600" />
              </button>
            </span>
          ))}
          {selectedBrands.map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-industrial-100 text-industrial-800 border border-industrial-300 text-xs font-semibold"
            >
              Brand: {b}
              <button onClick={() => toggleBrand(b)}>
                <X className="w-3 h-3 hover:text-rose-600" />
              </button>
            </span>
          ))}
          {only24HourDelivery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
              ? 24h Express Delivery
              <button onClick={() => setOnly24HourDelivery(false)}>
                <X className="w-3 h-3 hover:text-rose-600" />
              </button>
            </span>
          )}
          {selectedGstRates.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
            >
              GST: {r}%
              <button onClick={() => toggleGstRate(r)}>
                <X className="w-3 h-3 hover:text-rose-600" />
              </button>
            </span>
          ))}
          {onlyVerifiedSeller && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              Verified Suppliers Only
              <button onClick={() => setOnlyVerifiedSeller(false)}>
                <X className="w-3 h-3 hover:text-rose-600" />
              </button>
            </span>
          )}

          <button
            onClick={handleClearAllFilters}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline ml-2 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* 4. Main Catalog Content: Sidebar + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Filter Sidebar (3 cols) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24">
          <div className="bg-white rounded-3xl border border-industrial-200 p-6 shadow-card space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-industrial-100">
              <div className="flex items-center gap-2 font-black text-sm text-industrial-950">
                <SlidersHorizontal className="w-4 h-4 text-brand-600" />
                <span>Filters</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Fast 24h Delivery Filter */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-base">?</span>
                  <span className="text-xs font-bold text-amber-950">24-Hour Dispatch</span>
                </div>
                <input
                  type="checkbox"
                  checked={only24HourDelivery}
                  onChange={(e) => setOnly24HourDelivery(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
              </label>
            </div>

            {/* Categories & Nested Subcategories Filter */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-industrial-500">
                Categories
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center justify-between text-xs text-industrial-700 hover:text-industrial-950 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.name)}
                        onChange={() => toggleCategory(cat.name)}
                        className="w-3.5 h-3.5 text-brand-600 rounded focus:ring-brand-500"
                      />
                      <span>{cat.name}</span>
                    </div>
                    {cat.productCount !== undefined && cat.productCount > 0 && (
                      <span className="text-[10px] text-industrial-400 font-mono">
                        {cat.productCount}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Subcategories Filter (If available) */}
            {availableSubcategories.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-industrial-100">
                <h4 className="font-bold text-xs uppercase tracking-wider text-industrial-500 flex items-center justify-between">
                  <span>Subcategories</span>
                  <span className="text-[10px] text-industrial-400">{availableSubcategories.length}</span>
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {availableSubcategories.map((sub, idx) => (
                    <label
                      key={idx}
                      className="flex items-center justify-between text-xs text-industrial-700 hover:text-industrial-950 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedSubcategories.includes(sub.name)}
                          onChange={() => toggleSubcategory(sub.name)}
                          className="w-3.5 h-3.5 text-brand-600 rounded focus:ring-brand-500"
                        />
                        <span className="truncate max-w-[150px]">{sub.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Brands Filter */}
            {brands.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-industrial-100">
                <h4 className="font-bold text-xs uppercase tracking-wider text-industrial-500">
                  Brands & Mills
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {brands.map((brand) => (
                    <label
                      key={brand.id}
                      className="flex items-center justify-between text-xs text-industrial-700 hover:text-industrial-950 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand.name)}
                          onChange={() => toggleBrand(brand.name)}
                          className="w-3.5 h-3.5 text-brand-600 rounded focus:ring-brand-500"
                        />
                        <span>{brand.name}</span>
                      </div>
                      {brand.productCount !== undefined && brand.productCount > 0 && (
                        <span className="text-[10px] text-industrial-400 font-mono">
                          {brand.productCount}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* GST Rate Filter */}
            <div className="space-y-3 pt-3 border-t border-industrial-100">
              <h4 className="font-bold text-xs uppercase tracking-wider text-industrial-500">
                GST Rate (ITC Claim)
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[18, 28].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => toggleGstRate(rate)}
                    className={`py-2 px-3 rounded-xl border text-center font-mono font-bold transition-all cursor-pointer ${
                      selectedGstRates.includes(rate)
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-white border-industrial-200 hover:border-industrial-300 text-industrial-800'
                    }`}
                  >
                    {rate}% GST
                  </button>
                ))}
              </div>
            </div>

            {/* Verified Seller Switch */}
            <div className="pt-3 border-t border-industrial-100">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-1.5 text-xs font-bold text-industrial-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Manufacturers</span>
                </div>
                <input
                  type="checkbox"
                  checked={onlyVerifiedSeller}
                  onChange={(e) => setOnlyVerifiedSeller(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>
        </aside>

        {/* Right Products Area (9 cols) */}
        <main className="lg:col-span-9 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-industrial-200 p-4 space-y-4 animate-pulse h-96"
                >
                  <div className="bg-industrial-200 rounded-xl aspect-4/3" />
                  <div className="h-4 bg-industrial-200 rounded w-3/4" />
                  <div className="h-3 bg-industrial-200 rounded w-1/2" />
                  <div className="h-10 bg-industrial-100 rounded-xl mt-6" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-industrial-200 p-12 text-center space-y-4 shadow-card">
              <div className="w-16 h-16 rounded-2xl bg-industrial-100 text-industrial-400 flex items-center justify-center mx-auto text-2xl">
                ??
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-industrial-950">No Materials Found</h3>
                <p className="text-xs text-industrial-500 max-w-sm mx-auto">
                  We couldn't find items matching your filter criteria. Try clearing filters or submit a custom RFQ.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleClearAllFilters}
                  className="px-4 py-2 bg-industrial-100 hover:bg-industrial-200 text-industrial-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => openRFQModal()}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>Request RFQ for Custom Specs</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
