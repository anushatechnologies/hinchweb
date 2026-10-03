import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import type { Product, Category, Brand } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/common/SkeletonLoaders';
import { SubcategoryLandingPage } from './SubcategoryLandingPage';
import { useRFQModalStore } from '../store/useRFQModalStore';
import {
  Filter,
  SlidersHorizontal,
  X,
  ShieldCheck,
  FileText,
  Layers,
  PackageSearch,
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
  const categoryIdParam = searchParams.get('categoryId') || '';
  const subcategoryParam = searchParams.get('subcategory') || '';
  const subcategoryIdParam = searchParams.get('subcategoryId') || '';
  const brandParam = searchParams.get('brand') || '';
  const brandIdParam = searchParams.get('brandId') || '';
  const searchParam = searchParams.get('search') || '';
  const dealsParam = searchParams.get('deals') === 'true';
  const fastDeliveryParam = searchParams.get('fastDelivery') === 'true';
  const sortParam = (searchParams.get('sort') as any) || (searchParams.get('sortBy') as any) || 'popularity';

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
    setSelectedCategories(categoryParam ? [categoryParam] : []);
    setSelectedSubcategories(subcategoryParam ? [subcategoryParam] : []);
    setSelectedBrands(brandParam ? [brandParam] : []);
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
        categoryId: categoryIdParam ? Number(categoryIdParam) : undefined,
        subcategory: subcategoryParam || undefined,
        subcategoryId: subcategoryIdParam ? Number(subcategoryIdParam) : undefined,
        brand: brandParam || undefined,
        brandId: brandIdParam ? Number(brandIdParam) : undefined,
        is24HourDelivery: fastDeliveryParam ? true : undefined,
        sortBy: sortMap[sortParam] || undefined,
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
  }, [searchParam, categoryParam, categoryIdParam, subcategoryParam, subcategoryIdParam, brandParam, brandIdParam, fastDeliveryParam, sortParam]);

  // Derived active category for contextual subcategories
  const activeCategory = useMemo(() => {
    // 1. Direct selected category
    if (selectedCategories.length > 0) {
      const match = categories.find((c) =>
        selectedCategories.some((sc) => sc.toLowerCase() === c.name.toLowerCase() || sc.toLowerCase() === c.slug.toLowerCase())
      );
      if (match) return match;
    }
    if (categoryParam) {
      const match = categories.find(
        (c) =>
          c.name.toLowerCase() === categoryParam.toLowerCase() ||
          c.slug.toLowerCase() === categoryParam.toLowerCase()
      );
      if (match) return match;
    }

    // 2. Derive parent category from selected subcategories
    const activeSub = selectedSubcategories[0] || subcategoryParam;
    if (activeSub) {
      const match = categories.find((c) =>
        c.subcategories?.some(
          (s) =>
            s.name.toLowerCase() === activeSub.toLowerCase() ||
            s.slug.toLowerCase() === activeSub.toLowerCase() ||
            s.name.toLowerCase().includes(activeSub.toLowerCase())
        )
      );
      if (match) return match;
    }

    // 3. Derive from currently loaded products
    if (products.length > 0) {
      const catCountMap = new Map<string, number>();
      products.forEach((p) => {
        const cName = p.categoryName || p.category;
        if (cName) {
          catCountMap.set(cName, (catCountMap.get(cName) || 0) + 1);
        }
      });
      let topCat = '';
      let topCount = 0;
      catCountMap.forEach((cnt, cName) => {
        if (cnt > topCount) {
          topCount = cnt;
          topCat = cName;
        }
      });
      if (topCat) {
        const match = categories.find(
          (c) =>
            c.name.toLowerCase() === topCat.toLowerCase() ||
            c.slug.toLowerCase() === topCat.toLowerCase()
        );
        if (match) return match;
      }
    }

    return null;
  }, [selectedCategories, categoryParam, selectedSubcategories, subcategoryParam, categories, products]);

  // Derived available subcategories with dynamic product counts
  const availableSubcategories = useMemo(() => {
    const subcats: { name: string; categoryName: string; count?: number; subcategoryId?: number }[] = [];

    // Helper: count matching products in currently loaded products list
    const countInProducts = (subName: string, subId?: number) => {
      const q = subName.toLowerCase().trim();
      return products.filter((p) => {
        if (subId && p.subcategoryId && Number(p.subcategoryId) === Number(subId)) return true;
        const pSub = (p.subcategoryName || p.subcategory || '').toLowerCase().trim();
        return pSub === q || pSub.includes(q) || q.includes(pSub);
      }).length;
    };

    // If we have an active category context, prioritize its subcategories
    if (activeCategory && activeCategory.subcategories && activeCategory.subcategories.length > 0) {
      activeCategory.subcategories.forEach((sub) => {
        const prodCount = countInProducts(sub.name, sub.subcategoryId);
        subcats.push({
          name: sub.name,
          categoryName: activeCategory.name,
          count: prodCount > 0 ? prodCount : sub.productCount,
          subcategoryId: sub.subcategoryId,
        });
      });
    }

    // Also include any subcategories represented in currently loaded products that aren't added yet
    products.forEach((p) => {
      const subName = p.subcategoryName || p.subcategory;
      if (subName && !subcats.some((s) => s.name.toLowerCase() === subName.toLowerCase())) {
        const pSubId = typeof p.subcategoryId === 'number' ? p.subcategoryId : undefined;
        const prodCount = countInProducts(subName, pSubId);
        subcats.push({
          name: subName,
          categoryName: p.categoryName || p.category || '',
          count: prodCount > 0 ? prodCount : 1,
          subcategoryId: pSubId,
        });
      }
    });

    // If still empty (e.g. initial catalog load without category or products yet),
    // show top subcategories from across all categories
    if (subcats.length === 0 && categories.length > 0) {
      categories.forEach((cat) => {
        if (cat.subcategories && cat.subcategories.length > 0) {
          cat.subcategories.forEach((sub) => {
            if (!subcats.some((s) => s.name.toLowerCase() === sub.name.toLowerCase())) {
              subcats.push({
                name: sub.name,
                categoryName: cat.name,
                count: sub.productCount,
                subcategoryId: sub.subcategoryId,
              });
            }
          });
        }
      });
    }

    return subcats;
  }, [activeCategory, categories, products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query filter (client-side refinement)
    if (searchParam) {
      const q = searchParam.toLowerCase();
      result = result.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.categoryName || '').toLowerCase().includes(q) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
          (p.subcategoryName && p.subcategoryName.toLowerCase().includes(q)) ||
          (p.hsnCode && p.hsnCode.includes(q)) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) => {
        const pCat = (p.categoryName || p.category || '').toLowerCase();
        return selectedCategories.some((c) => pCat.includes(c.toLowerCase()));
      });
    }

    // Subcategory filter
    if (selectedSubcategories.length > 0) {
      result = result.filter((p) => {
        const pSub = (p.subcategoryName || p.subcategory || '').toLowerCase().trim();
        return selectedSubcategories.some((s) => {
          const target = s.toLowerCase().trim();
          return pSub === target || pSub.includes(target) || target.includes(pSub);
        });
      });
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      result = result.filter((p) =>
        selectedBrands.some((b) => (p.brand || p.brandName || '').toLowerCase().includes(b.toLowerCase()))
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
    const isCurrentlySelected = selectedCategories.includes(catName);
    const nextCats = isCurrentlySelected
      ? selectedCategories.filter((c) => c !== catName)
      : [...selectedCategories, catName];
    setSelectedCategories(nextCats);

    const nextParams = new URLSearchParams(searchParams);
    if (nextCats.length === 1) {
      nextParams.set('category', nextCats[0]);
      const foundCat = categories.find((c) => c.name.toLowerCase() === nextCats[0].toLowerCase());
      if (foundCat?.categoryId) {
        nextParams.set('categoryId', String(foundCat.categoryId));
      }
    } else {
      nextParams.delete('category');
      nextParams.delete('categoryId');
    }
    // Reset subcategories when parent category toggled
    setSelectedSubcategories([]);
    nextParams.delete('subcategory');
    nextParams.delete('subcategoryId');
    setSearchParams(nextParams);
  };

  const toggleSubcategory = (subName: string, subId?: number) => {
    const isCurrentlySelected = selectedSubcategories.some(
      (s) => s.toLowerCase() === subName.toLowerCase()
    );

    let nextSubs: string[];
    if (isCurrentlySelected) {
      nextSubs = [];
    } else {
      nextSubs = [subName];
    }
    setSelectedSubcategories(nextSubs);

    const nextParams = new URLSearchParams(searchParams);
    if (nextSubs.length > 0) {
      nextParams.set('subcategory', nextSubs[0]);
      const targetSub = availableSubcategories.find(
        (s) => s.name.toLowerCase() === nextSubs[0].toLowerCase()
      );
      const targetId = subId || targetSub?.subcategoryId;
      if (targetId) {
        nextParams.set('subcategoryId', String(targetId));
      } else {
        nextParams.delete('subcategoryId');
      }

      // Check if active brands conflict with the new subcategory
      if (selectedBrands.length > 0) {
        const brandStillMatches = products.some(
          (p) =>
            (p.subcategoryName || p.subcategory || '').toLowerCase().includes(nextSubs[0].toLowerCase()) &&
            selectedBrands.some((b) => (p.brand || '').toLowerCase().includes(b.toLowerCase()))
        );
        if (!brandStillMatches) {
          setSelectedBrands([]);
          nextParams.delete('brand');
          nextParams.delete('brandId');
        }
      }
    } else {
      nextParams.delete('subcategory');
      nextParams.delete('subcategoryId');
    }

    setSearchParams(nextParams);
  };

  const clearSubcategories = () => {
    setSelectedSubcategories([]);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('subcategory');
    nextParams.delete('subcategoryId');
    setSearchParams(nextParams);
  };

  const toggleBrand = (brandName: string) => {
    const isCurrentlySelected = selectedBrands.includes(brandName);
    const nextBrands = isCurrentlySelected
      ? selectedBrands.filter((b) => b !== brandName)
      : [...selectedBrands, brandName];
    setSelectedBrands(nextBrands);

    const nextParams = new URLSearchParams(searchParams);
    if (nextBrands.length === 1) {
      nextParams.set('brand', nextBrands[0]);
    } else {
      nextParams.delete('brand');
      nextParams.delete('brandId');
    }
    setSearchParams(nextParams);
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

  // When explicitly requested via ?view=landing, render the Moglix-style Subcategory Landing Page
  if (searchParams.get('view') === 'landing') {
    return <SubcategoryLandingPage />;
  }

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
              <span>Browse Subcategories {activeCategory ? `in ${activeCategory.name}` : ''}</span>
            </div>
            {selectedSubcategories.length > 0 && (
              <button
                onClick={clearSubcategories}
                className="text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer"
              >
                Clear Subcategory Filter
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {availableSubcategories.map((sub, idx) => {
              const isSelected = selectedSubcategories.some((s) => s.toLowerCase() === sub.name.toLowerCase());
              return (
                <button
                  key={idx}
                  onClick={() => toggleSubcategory(sub.name, sub.subcategoryId)}
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
                          checked={selectedSubcategories.some((s) => s.toLowerCase() === sub.name.toLowerCase())}
                          onChange={() => toggleSubcategory(sub.name, sub.subcategoryId)}
                          className="w-3.5 h-3.5 text-brand-600 rounded focus:ring-brand-500"
                        />
                        <span className="truncate max-w-[150px]">{sub.name}</span>
                      </div>
                      {sub.count !== undefined && sub.count > 0 && (
                        <span className="text-[10px] text-industrial-400 font-mono">
                          {sub.count}
                        </span>
                      )}
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
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-industrial-200 p-12 text-center space-y-4 shadow-card">
              <div className="w-16 h-16 rounded-2xl bg-industrial-100 text-industrial-400 flex items-center justify-center mx-auto text-2xl">
                <PackageSearch className="w-8 h-8 text-industrial-400" />
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
