import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { categoryApi } from '../api/categoryApi';
import { productApi } from '../api/productApi';
import type { Category, Subcategory, Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { CategoryRibbon } from '../components/layout/CategoryRibbon';
import { CategoryPageSkeleton } from '../components/common/SkeletonLoaders';
import { useRFQModalStore } from '../store/useRFQModalStore';
import { getCategoryImageUrl } from './HomePage';
import {
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Truck,
  Sparkles,
  FileText,
  Layers,
  ArrowLeft,
} from 'lucide-react';

interface SubcategoryShowcase {
  subcategory: Subcategory;
  products: Product[];
  brands: { name: string; count: number }[];
}

export const CategoryLandingPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { openRFQModal } = useRFQModalStore();

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!categorySlug) return;
    setIsLoading(true);

    async function fetchCat() {
      let cat = await categoryApi.getCategoryBySlug(categorySlug!);
      if (!cat) {
        const resolvedId = await categoryApi.resolveCategoryId(categorySlug!);
        if (resolvedId) {
          try {
            cat = await categoryApi.getCategoryById(resolvedId);
          } catch {}
        }
      }
      return cat;
    }

    fetchCat()
      .then(async (cat) => {
        if (!cat) {
          setIsLoading(false);
          return;
        }
        setCategory(cat);

        // Fetch subcategories and category products in parallel
        const [subsRes, prodsRes] = await Promise.allSettled([
          cat.categoryId ? categoryApi.getSubcategories({ categoryId: cat.categoryId }) : Promise.resolve([]),
          productApi.getProducts({
            categoryId: cat.categoryId,
            category: cat.name,
            limit: 100,
          }),
        ]);

        let allSubs: Subcategory[] = cat.subcategories || [];
        if (subsRes.status === 'fulfilled' && subsRes.value.length > 0) {
          allSubs = subsRes.value;
        }

        let catProducts: Product[] = [];
        if (prodsRes.status === 'fulfilled') {
          catProducts = prodsRes.value.products;
          setProducts(catProducts);
        }

        // If subcategories were not returned directly by backend, derive any mentioned in products
        const uniqueSubNames = new Set(allSubs.map((s) => s.name.toLowerCase()));
        catProducts.forEach((p) => {
          if (p.subcategory && !uniqueSubNames.has(p.subcategory.toLowerCase())) {
            uniqueSubNames.add(p.subcategory.toLowerCase());
            allSubs.push({
              id: `sub_${p.subcategory}`,
              subcategoryId: typeof p.subcategoryId === 'number' ? p.subcategoryId : 0,
              categoryId: cat.categoryId,
              name: p.subcategory,
              slug: p.subcategory.toLowerCase().replace(/\s+/g, '-'),
              active: true,
              sortOrder: 1,
              productCount: 1,
            });
          }
        });

        setSubcategories(allSubs);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error loading category landing page:', err);
        setIsLoading(false);
      });
  }, [categorySlug]);

  // Group products into subcategory showcases
  const showcases: SubcategoryShowcase[] = useMemo(() => {
    if (!category) return [];

    return subcategories.map((sub) => {
      const subProds = products.filter(
        (p) =>
          (p.subcategory && p.subcategory.toLowerCase() === sub.name.toLowerCase()) ||
          (p.subcategoryId && sub.subcategoryId && p.subcategoryId === sub.subcategoryId)
      );

      // Extract unique brands for this subcategory
      const brandMap = new Map<string, number>();
      subProds.forEach((p) => {
        if (p.brand) {
          brandMap.set(p.brand, (brandMap.get(p.brand) || 0) + 1);
        }
      });

      const brands = Array.from(brandMap.entries()).map(([name, count]) => ({
        name,
        count,
      }));

      return {
        subcategory: sub,
        products: subProds,
        brands,
      };
    });
  }, [category, subcategories, products]);

  // Fallback scroll refs helper for carousel rows
  const scrollRow = (elementId: string, direction: 'left' | 'right') => {
    const el = document.getElementById(elementId);
    if (el) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return <CategoryPageSkeleton />;
  }

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-industrial-100 text-industrial-400 flex items-center justify-center mx-auto text-2xl">
          ??
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-industrial-950">Category Not Found</h2>
          <p className="text-xs text-industrial-500 max-w-sm mx-auto">
            The requested category could not be located in our wholesale directory.
          </p>
        </div>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Materials</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 bg-industrial-50/60">
      {/* Category Navigation Ribbon (Moglix Reference Style with Active Underline) */}
      <CategoryRibbon activeSlug={categorySlug} activeName={category?.name} />

      {/* 1. BREADCRUMBS & CATEGORY HERO */}
      <section className="bg-white border-b border-industrial-200">
        <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-6 space-y-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-industrial-500">
            <Link to="/" className="hover:text-industrial-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/catalog" className="hover:text-industrial-900 transition-colors">
              Categories
            </Link>
            <span>/</span>
            <span className="font-bold text-industrial-950">{category.name}</span>
          </div>

          {/* Hero Banner Container */}
          <div className="relative bg-gradient-to-r from-industrial-950 via-slate-900 to-industrial-950 text-white rounded-3xl p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xl border border-industrial-800">
            {/* Background pattern decor */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-black uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Wholesale Procurement Category</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
                  {category.name}
                </h1>

                <p className="text-sm sm:text-base text-industrial-300 max-w-2xl leading-relaxed">
                  {category.description || `Industrial ${category.name} products for business procurement with factory wholesale pricing, 100% GST ITC, and direct site dispatch.`}
                </p>

                {/* Value Props Row */}
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-industrial-300">
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>100% Verified Mill Test Certificates</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                    <Truck className="w-4 h-4 text-brand-400" />
                    <span>Heavy Transit Site Logistics</span>
                  </div>
                </div>
              </div>

              {/* Category Showcase Image */}
              <div className="lg:col-span-4 flex justify-center lg:justify-end">
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-white/5 backdrop-blur-xs p-2">
                  <img
                    src={getCategoryImageUrl(category)}
                    alt={category.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SHOP BY CATEGORIES (Visual Subcategories Cards Grid) */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 space-y-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-industrial-200 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-industrial-100 pb-4">
            <div>
              <div className="text-xs font-extrabold text-brand-600 uppercase tracking-wider mb-0.5">
                Subcategory Navigation
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-industrial-950 tracking-tight">
                Shop by Categories
              </h2>
            </div>
            <Link
              to={`/catalog?category=${encodeURIComponent(category.name)}`}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All {category.name} Products</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {subcategories.length === 0 ? (
            <div className="p-8 text-center text-xs text-industrial-400 space-y-2">
              <p>No subcategories registered under {category.name} yet.</p>
              <Link
                to={`/catalog?category=${encodeURIComponent(category.name)}`}
                className="text-brand-600 font-bold underline"
              >
                Browse all products in this category ?
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {subcategories.map((sub) => {
                const subImage = sub.imageUrl && sub.imageUrl.trim() !== '' ? sub.imageUrl : getCategoryImageUrl({ name: sub.name });
                const count = sub.productCount || products.filter((p) => p.subcategory?.toLowerCase() === sub.name.toLowerCase()).length;

                return (
                  <Link
                    key={sub.id || sub.name}
                    to={`/category/${encodeURIComponent(category.slug || category.name.toLowerCase().replace(/\s+/g, '-'))}/${encodeURIComponent(sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-'))}`}
                    className="group bg-white rounded-2xl border border-industrial-200 hover:border-brand-500 hover:shadow-card p-3 flex flex-col items-center text-center transition-all cursor-pointer space-y-2.5"
                  >
                    <div className="w-full aspect-square rounded-xl bg-industrial-50 border border-industrial-100 overflow-hidden flex items-center justify-center p-1 group-hover:border-brand-300 transition-colors">
                      <img
                        src={subImage}
                        alt={sub.name}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="space-y-0.5 w-full">
                      <div className="text-[11px] font-bold text-industrial-400">
                        {count > 0 ? `${count} Products` : 'Browse SKUs'}
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-industrial-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-tight">
                        {sub.name}
                      </h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 3. SUBCATEGORY SHOWCASE SECTIONS (Brands + Top Products Carousels) */}
      {showcases.map((showcase, sIdx) => {
        const { subcategory, products: subProds, brands } = showcase;
        const brandRowId = `brand_row_${sIdx}`;
        const prodRowId = `prod_row_${sIdx}`;

        return (
          <section
            key={subcategory.id || subcategory.name}
            className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 space-y-4"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-industrial-200 shadow-card space-y-6">
              {/* Showcase Row Header */}
              <div className="flex items-center justify-between border-b border-industrial-100 pb-4">
                <div className="space-y-0.5">
                  <h2 className="text-xl sm:text-2xl font-black text-industrial-950 tracking-tight">
                    {subcategory.name}
                  </h2>
                  <p className="text-xs text-industrial-500">
                    {subProds.length > 0
                      ? `${subProds.length} Products Available with Bulk Wholesale Rates`
                      : 'Explore specialized manufacturer catalog'}
                  </p>
                </div>

                <Link
                  to={`/category/${encodeURIComponent(category.slug || category.name.toLowerCase().replace(/\s+/g, '-'))}/${encodeURIComponent(subcategory.slug || subcategory.name.toLowerCase().replace(/\s+/g, '-'))}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <span>VIEW ALL</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Brand Carousel Row */}
              {brands.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-industrial-700">
                    <span className="uppercase tracking-wider text-[11px] text-industrial-500">
                      Popular Brands in {subcategory.name}
                    </span>
                    {brands.length > 5 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => scrollRow(brandRowId, 'left')}
                          className="w-7 h-7 rounded-lg border border-industrial-300 hover:bg-industrial-100 flex items-center justify-center text-industrial-700 cursor-pointer"
                          aria-label="Scroll brands left"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => scrollRow(brandRowId, 'right')}
                          className="w-7 h-7 rounded-lg border border-industrial-300 hover:bg-industrial-100 flex items-center justify-center text-industrial-700 cursor-pointer"
                          aria-label="Scroll brands right"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    id={brandRowId}
                    className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1"
                  >
                    {brands.map((brand, bIdx) => (
                      <Link
                        key={bIdx}
                        to={`/catalog?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(subcategory.name)}&brand=${encodeURIComponent(brand.name)}`}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border border-industrial-200 hover:border-brand-500 hover:bg-brand-50/30 transition-all shrink-0 min-w-[100px] text-center group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-full bg-industrial-100 border border-industrial-200 flex items-center justify-center text-xs font-black text-industrial-800 uppercase group-hover:scale-105 group-hover:bg-brand-100 group-hover:text-brand-700 transition-all shadow-xs">
                          {brand.name.slice(0, 3)}
                        </div>
                        <span className="text-xs font-bold text-industrial-900 group-hover:text-brand-700 line-clamp-1 max-w-[90px]">
                          {brand.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Carousel Row / Empty state */}
              {subProds.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-industrial-700">
                    <span className="uppercase tracking-wider text-[11px] text-industrial-500">
                      Top Products & Wholesale SKUs
                    </span>
                    {subProds.length > 4 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => scrollRow(prodRowId, 'left')}
                          className="w-8 h-8 rounded-xl border border-industrial-300 hover:bg-industrial-100 flex items-center justify-center text-industrial-700 cursor-pointer shadow-2xs"
                          aria-label="Scroll products left"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => scrollRow(prodRowId, 'right')}
                          className="w-8 h-8 rounded-xl border border-industrial-300 hover:bg-industrial-100 flex items-center justify-center text-industrial-700 cursor-pointer shadow-2xs"
                          aria-label="Scroll products right"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    id={prodRowId}
                    className="flex gap-4 overflow-x-auto no-scrollbar py-2"
                  >
                    {subProds.map((prod) => (
                      <div key={prod.id} className="w-64 sm:w-72 shrink-0">
                        <ProductCard product={prod} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-industrial-50 rounded-2xl border border-industrial-200 text-center space-y-3">
                  <div className="text-xs text-industrial-600">
                    No products currently listed under <strong>{subcategory.name}</strong>.
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => openRFQModal()}
                      className="px-4 py-2 bg-industrial-900 hover:bg-industrial-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Post RFQ for {subcategory.name}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* 4. OVERALL ZERO-PRODUCTS CATEGORY RFQ CARD */}
      {products.length === 0 && (
        <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-industrial-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Custom Procurement Desk</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black">
                Need {category.name} Materials for Your Project?
              </h3>
              <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">
                Can't find the exact specification you need? Upload your Bill of Quantities (BOQ) and broadcast your requirement directly to verified primary manufacturers.
              </p>
            </div>

            <button
              onClick={() => openRFQModal()}
              className="px-6 py-3.5 bg-white text-brand-700 hover:bg-brand-50 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-brand-600" />
              <span>Broadcast RFQ in 60 Seconds</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
