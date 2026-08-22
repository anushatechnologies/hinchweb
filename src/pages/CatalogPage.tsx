import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { CATEGORIES, BRANDS } from '../api/mockData';
import type { Product, Category, Brand } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { useRFQModalStore } from '../store/useRFQModalStore';
import {
  Filter,
  SlidersHorizontal,
  X,
  Search,
  ShieldCheck,
  FileText,
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openRFQModal } = useRFQModalStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filters State from URL or defaults
  const categoryParam = searchParams.get('category') || '';
  const brandParam = searchParams.get('brand') || '';
  const searchParam = searchParams.get('search') || '';
  const dealsParam = searchParams.get('deals') === 'true';
  const sortParam = (searchParams.get('sort') as any) || 'popularity';

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    brandParam ? [brandParam] : []
  );
  const [selectedGstRates, setSelectedGstRates] = useState<number[]>([]);
  const [onlyVerifiedSeller, setOnlyVerifiedSeller] = useState(false);
  const [sortBy, setSortBy] = useState<string>(sortParam);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }
    if (brandParam) {
      setSelectedBrands([brandParam]);
    }
  }, [categoryParam, brandParam]);

  useEffect(() => {
    setIsLoading(true);
    productApi
      .getProducts()
      .then((res) => {
        setProducts(res.products);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });

    categoryApi.getCategories().then(setCategories).catch(console.error);
    categoryApi.getBrands().then(setBrands).catch(console.error);
  }, []);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query filter
    if (searchParam) {
      const q = searchParam.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.hsnCode.includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    // Deals filter
    if (dealsParam) {
      result = result.filter((p) => p.isBulkDeal);
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
    selectedBrands,
    dealsParam,
    selectedGstRates,
    onlyVerifiedSeller,
    sortBy,
  ]);

  const toggleCategory = (catName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  const toggleBrand = (bName: string) => {
    setSelectedBrands((prev) =>
      prev.includes(bName) ? prev.filter((b) => b !== bName) : [...prev, bName]
    );
  };

  const toggleGstRate = (rate: number) => {
    setSelectedGstRates((prev) =>
      prev.includes(rate) ? prev.filter((r) => r !== rate) : [...prev, rate]
    );
  };

  const handleClearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedGstRates([]);
    setOnlyVerifiedSeller(false);
    setSearchParams({});
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    selectedGstRates.length > 0 ||
    onlyVerifiedSeller ||
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
            <span className="font-semibold text-industrial-800">B2B Material Catalog</span>
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

      {/* 2. Active Filter Chips */}
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
            className="text-xs font-bold text-rose-600 hover:text-rose-700 underline ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* 3. Main Grid & Faceted Sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Sidebar Filters Desktop */}
        <aside className="hidden md:block md:col-span-3 bg-white p-5 rounded-2xl border border-industrial-200 shadow-subtle space-y-6 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-industrial-200">
            <div className="flex items-center gap-2 font-bold text-sm text-industrial-900">
              <SlidersHorizontal className="w-4 h-4 text-brand-600" />
              <span>Procurement Filters</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold"
              >
                Reset
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-industrial-800 uppercase tracking-wider">
              Category
            </h4>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {(categories.length > 0 ? categories : (CATEGORIES as any[])).map((cat: any) => {
                const isSelected = selectedCategories.includes(cat.name);
                return (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2 text-xs text-industrial-700 hover:text-industrial-900 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCategory(cat.name)}
                      className="rounded border-industrial-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                    <span className={isSelected ? 'font-bold text-industrial-950' : ''}>
                      {cat.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2 pt-3 border-t border-industrial-100">
            <h4 className="font-bold text-xs text-industrial-800 uppercase tracking-wider">
              Primary Brand
            </h4>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {(brands.length > 0 ? brands : (BRANDS as any[])).map((brand: any) => {
                const isSelected = selectedBrands.includes(brand.name);
                return (
                  <label
                    key={brand.id}
                    className="flex items-center gap-2 text-xs text-industrial-700 hover:text-industrial-900 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleBrand(brand.name)}
                      className="rounded border-industrial-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                    <span className={isSelected ? 'font-bold text-industrial-950' : ''}>
                      {brand.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* GST Rate Filter */}
          <div className="space-y-2 pt-3 border-t border-industrial-100">
            <h4 className="font-bold text-xs text-industrial-800 uppercase tracking-wider">
              GST Tax Bracket
            </h4>
            <div className="flex gap-2">
              {[18, 28, 12].map((rate) => {
                const isSelected = selectedGstRates.includes(rate);
                return (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => toggleGstRate(rate)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'border-industrial-200 bg-industrial-50 text-industrial-700 hover:bg-industrial-100'
                    }`}
                  >
                    {rate}% GST
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seller Verified Checkbox */}
          <div className="pt-3 border-t border-industrial-100">
            <label className="flex items-center gap-2.5 text-xs text-industrial-800 font-semibold cursor-pointer select-none p-2 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <input
                type="checkbox"
                checked={onlyVerifiedSeller}
                onChange={(e) => setOnlyVerifiedSeller(e.target.checked)}
                className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <div className="flex items-center gap-1 text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Stockyards Only</span>
              </div>
            </label>
          </div>

          {/* RFQ Sidebar Banner */}
          <div className="p-4 bg-industrial-900 text-white rounded-xl space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-brand-400 font-bold">
              <FileText className="w-4 h-4" />
              <span>Can't find exact grade?</span>
            </div>
            <p className="text-[11px] text-industrial-300 leading-relaxed">
              Post your custom cutting schedule or BOQ specs for instant supplier bids.
            </p>
            <button
              onClick={() => openRFQModal()}
              className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg transition-colors text-center"
            >
              Post Custom RFQ
            </button>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="md:col-span-9 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl border border-industrial-200 p-4 space-y-4 animate-pulse h-96"
                >
                  <div className="bg-industrial-200 rounded-xl aspect-4/3"></div>
                  <div className="h-4 bg-industrial-200 rounded w-3/4"></div>
                  <div className="h-3 bg-industrial-200 rounded w-1/2"></div>
                  <div className="h-10 bg-industrial-100 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-industrial-200 p-12 text-center space-y-5 shadow-subtle">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-industrial-950">No exact match found</h3>
                <p className="text-xs text-industrial-500 max-w-md mx-auto">
                  We could not find items matching your search criteria. You can broadcast this exact material requirement as an RFQ to 500+ verified primary manufacturers.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleClearAllFilters}
                  className="px-5 py-2.5 rounded-xl border border-industrial-300 text-industrial-700 hover:bg-industrial-50 text-xs font-bold"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => openRFQModal()}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/25 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Broadcast RFQ for this item</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Sheet */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-industrial-950/60 backdrop-blur-xs md:hidden animate-in fade-in">
          <div className="bg-white w-full max-w-xs h-full p-6 shadow-2xl flex flex-col space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-industrial-200">
              <span className="font-bold text-sm text-industrial-900">Procurement Filters</span>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-lg hover:bg-industrial-100 text-industrial-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-industrial-800 uppercase">Category</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {CATEGORIES.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 text-xs text-industrial-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.name)}
                      onChange={() => toggleCategory(cat.name)}
                      className="rounded border-industrial-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2 pt-3 border-t border-industrial-100">
              <h4 className="font-bold text-xs text-industrial-800 uppercase">Primary Brand</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {BRANDS.map((brand) => (
                  <label key={brand.id} className="flex items-center gap-2 text-xs text-industrial-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand.name)}
                      onChange={() => toggleBrand(brand.name)}
                      className="rounded border-industrial-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>{brand.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-xs shadow-md mt-auto"
            >
              Apply Filters ({filteredProducts.length} items)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
