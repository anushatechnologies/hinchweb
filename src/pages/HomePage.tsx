import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { bannerApi } from '../api/bannerApi';
import { promotionApi } from '../api/promotionApi';
import type { Product, Category, Banner, ActiveVideoBanner } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { CategoryRibbon } from '../components/layout/CategoryRibbon';
import {
  ArrowRight,
  Flame,
  ChevronRight,
  ChevronLeft,
  Layers,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';

export function getCategoryImageUrl(cat: { name?: string; slug?: string; imageUrl?: string; image?: string }): string {
  if (cat.imageUrl && cat.imageUrl.trim() !== '') return cat.imageUrl;
  if (cat.image && cat.image.trim() !== '') return cat.image;

  const name = (cat.name || cat.slug || '').toLowerCase();
  if (name.includes('steel') || name.includes('tmt') || name.includes('rebar')) {
    return 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('cement') || name.includes('civil') || name.includes('concrete')) {
    return 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('electrical') || name.includes('wire') || name.includes('switch')) {
    return 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('glass') || name.includes('glazing')) {
    return 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('exterior') || name.includes('facade') || name.includes('roof')) {
    return 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('furniture') || name.includes('wood') || name.includes('interior')) {
    return 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('paint') || name.includes('finish') || name.includes('coat')) {
    return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('pipe') || name.includes('plumb')) {
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('tool') || name.includes('machine')) {
    return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('safety') || name.includes('ppe')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80';
  }
  return 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80';
}

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bulkDeals, setBulkDeals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [videoBanner, setVideoBanner] = useState<ActiveVideoBanner | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      productApi.getFeaturedProducts(),
      productApi.getBulkDeals(),
      categoryApi.getCategories({ includeSubcategories: true }),
      bannerApi.getBanners(),
      promotionApi.getActiveVideo(),
    ]).then(([featRes, dealsRes, catRes, banRes, promoRes]) => {
      if (featRes.status === 'fulfilled') setFeaturedProducts(featRes.value);
      if (dealsRes.status === 'fulfilled') setBulkDeals(dealsRes.value);
      if (catRes.status === 'fulfilled') setCategories(catRes.value);
      if (banRes.status === 'fulfilled') setBanners(banRes.value);
      if (promoRes.status === 'fulfilled' && promoRes.value) {
        setVideoBanner(promoRes.value);
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const currentBanner = banners[activeSlide % (banners.length || 1)];

  return (
    <div className="space-y-6 pb-16 bg-industrial-50/60">
      {/* 1. TOP CATEGORY RIBBON STRIP (Moglix Reference Style) */}
      <CategoryRibbon />

      {/* 2. HERO PROMOTIONAL BANNER (Active Video Banner or Banner Slider) */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12">
        {isLoading && !videoBanner && banners.length === 0 ? (
          <div className="rounded-3xl border border-industrial-200 bg-industrial-100 overflow-hidden shadow-card aspect-[16/7] sm:aspect-[21/8] lg:aspect-[25/8] min-h-[200px] sm:min-h-[280px] max-h-[440px] animate-pulse" />
        ) : videoBanner ? (
          <div className="relative rounded-3xl overflow-hidden border border-industrial-200 shadow-card bg-industrial-100 aspect-[16/7] sm:aspect-[21/8] lg:aspect-[25/8] min-h-[200px] sm:min-h-[280px] max-h-[440px] flex items-center group">
            {/* Clickable Banner Link */}
            <Link
              to={videoBanner.targetScreen || '/catalog'}
              className="absolute inset-0 w-full h-full block cursor-pointer z-10"
              aria-label={videoBanner.title || 'Promotional Banner'}
            >
              {/* Pure Video - Clean edge-to-edge, no black overlays, no text */}
              <video
                ref={videoRef}
                src={videoBanner.videoUrl}
                poster={videoBanner.posterUrl}
                autoPlay
                muted={isVideoMuted}
                loop
                playsInline
                className="w-full h-full object-cover object-center block"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </Link>

            {/* Subtle Floating Media Controls */}
            <div className="absolute right-4 bottom-4 sm:right-6 sm:bottom-6 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (videoRef.current) {
                    if (isPlaying) {
                      videoRef.current.pause();
                      setIsPlaying(false);
                    } else {
                      videoRef.current.play().catch(() => {});
                      setIsPlaying(true);
                    }
                  }
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-md"
                title={isPlaying ? 'Pause video' : 'Play video'}
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (videoRef.current) {
                    videoRef.current.muted = !isVideoMuted;
                    setIsVideoMuted(!isVideoMuted);
                  }
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-md"
                title={isVideoMuted ? 'Unmute video' : 'Mute video'}
                aria-label={isVideoMuted ? 'Unmute video' : 'Mute video'}
              >
                {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

        ) : banners.length > 0 ? (
          <div className="bg-white rounded-3xl border border-industrial-200 shadow-card overflow-hidden">
            <div className="relative bg-gradient-to-r from-industrial-950 via-slate-900 to-industrial-950 text-white p-6 sm:p-10 lg:p-12 transition-all duration-700 min-h-[300px] sm:min-h-[360px] flex flex-col justify-between overflow-hidden">
              {banners.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1))
                    }
                    aria-label="Previous Slide"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white text-white hover:text-industrial-950 backdrop-blur-md flex items-center justify-center shadow-lg transition-all z-20 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveSlide((prev) => (prev + 1) % banners.length)}
                    aria-label="Next Slide"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white text-white hover:text-industrial-950 backdrop-blur-md flex items-center justify-center shadow-lg transition-all z-20 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                <div className="lg:col-span-6 space-y-4">
                  <div className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase drop-shadow-md">
                    {currentBanner.title}
                  </div>

                  <div className="text-xl sm:text-2xl font-bold text-white/90">
                    {currentBanner.subtitle || 'Direct Mill & Manufacturer Wholesale Deals'}
                  </div>

                  <div className="pt-2">
                    <Link
                      to={currentBanner.targetUrl || '/catalog'}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-industrial-950 hover:bg-brand-50 hover:text-brand-700 rounded-xl font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl transition-all active:scale-95 group"
                    >
                      <span>SHOP NOW</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 flex items-center justify-center relative">
                  {currentBanner.imageUrl && (
                    <div className="relative w-full max-w-md h-56 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black/20 backdrop-blur-xs">
                      <img
                        src={currentBanner.imageUrl}
                        alt={currentBanner.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {banners.length > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 bg-white border-t border-industrial-200">
                {banners.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`py-3.5 px-4 text-center transition-all cursor-pointer border-r last:border-r-0 border-industrial-200 relative ${
                      activeSlide === idx
                        ? 'bg-white text-industrial-950 font-black'
                        : 'bg-industrial-50/50 hover:bg-industrial-100 text-industrial-600 font-semibold'
                    }`}
                  >
                    {activeSlide === idx && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 shadow-sm animate-in fade-in" />
                    )}
                    <div className="text-xs sm:text-sm font-extrabold tracking-tight truncate">
                      {item.title}
                    </div>
                    <div
                      className={`text-[11px] truncate ${
                        activeSlide === idx ? 'text-red-600 font-bold' : 'text-industrial-500'
                      }`}
                    >
                      {item.subtitle || 'Special B2B Pricing'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>


      {/* 3. CATEGORIES & SUBCATEGORIES DIRECTORY (Watch & Browse Subcategories) */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-industrial-200 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-industrial-100 pb-4">
            <div>
              <div className="text-xs font-extrabold text-brand-600 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-600" />
                <span>Procurement Directory</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-industrial-950 tracking-tight">
                Explore Categories & Subcategories
              </h2>
            </div>
            <Link
              to="/catalog"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View Full Materials Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading || categories.length === 0 ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="p-4 rounded-2xl border border-industrial-200 bg-white space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-industrial-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-industrial-200 rounded w-24" />
                      <div className="h-3 bg-industrial-100 rounded w-16" />
                    </div>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-industrial-100">
                    <div className="h-3 bg-industrial-100 rounded w-3/4" />
                    <div className="h-3 bg-industrial-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl border border-industrial-200 hover:border-brand-500/80 hover:shadow-card transition-all bg-white flex flex-col justify-between group space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-industrial-50 border border-industrial-200 overflow-hidden shrink-0 flex items-center justify-center p-1 group-hover:border-brand-500 transition-colors">
                      <img
                        src={getCategoryImageUrl(cat)}
                        alt={cat.name}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/category/${encodeURIComponent(cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'))}`}
                        className="font-black text-sm text-industrial-950 hover:text-brand-600 transition-colors line-clamp-1 block"
                      >
                        {cat.name}
                      </Link>
                      <span className="text-[11px] text-industrial-400 font-medium">
                        {cat.subcategories && cat.subcategories.length > 0
                          ? `${cat.subcategories.length} Subcategories`
                          : 'Explore Catalog'}
                      </span>
                    </div>
                  </div>

                  {/* Subcategories preview tags */}
                  <div className="pt-2 border-t border-industrial-100 space-y-1">
                    {cat.subcategories && cat.subcategories.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {cat.subcategories.slice(0, 4).map((sub) => (
                          <Link
                            key={sub.id || sub.name}
                            to={`/catalog?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-industrial-50 hover:bg-brand-50 text-industrial-700 hover:text-brand-700 border border-industrial-200 hover:border-brand-300 transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                        {cat.subcategories.length > 4 && (
                          <Link
                            to={`/category/${encodeURIComponent(cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'))}`}
                            className="text-[11px] font-bold text-brand-600 hover:underline px-1 py-0.5"
                          >
                            +{cat.subcategories.length - 4} more
                          </Link>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={`/category/${encodeURIComponent(cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'))}`}
                        className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Explore {cat.name} Category & Subcategories</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 4. BULK WHOLESALE DEALS */}
      {bulkDeals.length > 0 && (
        <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="bg-gradient-to-r from-industrial-950 via-slate-900 to-industrial-950 rounded-3xl p-6 sm:p-8 text-white border border-industrial-800 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6 pb-6 border-b border-industrial-800">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider mb-1">
                  <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>Direct Mill & Manufacturer Deals</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Bulk Wholesale Tier Pricing
                </h2>
                <p className="text-xs text-industrial-400 mt-1">
                  Direct factory wholesale rates with bulk volume discounts.
                </p>
              </div>

              <Link
                to="/catalog?deals=true"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-600/30"
              >
                <span>Explore All Deals</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bulkDeals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. FEATURED PRODUCTS (With Skeletons while loading) */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-xs font-extrabold text-brand-600 uppercase tracking-wider mb-1">
              Primary B2B Inventory
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-industrial-950">
              Verified Wholesale Catalog
            </h2>
          </div>

          <Link
            to="/catalog"
            className="text-xs font-bold text-industrial-600 hover:text-industrial-900 flex items-center gap-1"
          >
            <span>View Full Catalog</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading || featuredProducts.length === 0 ? (
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-industrial-200 p-4 space-y-4 animate-pulse h-96"
              >
                <div className="bg-industrial-200 rounded-xl aspect-4/3" />
                <div className="h-4 bg-industrial-200 rounded w-3/4" />
                <div className="h-3 bg-industrial-200 rounded w-1/2" />
                <div className="h-10 bg-industrial-100 rounded-xl mt-6" />
              </div>
            ))
          ) : (
            featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>
    </div>
  );
};
