import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { BRANDS } from '../api/mockData';
import type { Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { useRFQModalStore } from '../store/useRFQModalStore';
import {
  FileText,
  Sparkles,
  ArrowRight,
  Flame,
  ChevronRight,
  ChevronLeft,
  Award,
} from 'lucide-react';

// 1. Moglix-style Category Navigation Strip Items
const TOP_NAV_CATEGORIES = [
  {
    id: '24hr',
    name: '24 hrs Delivery',
    tag: 'FAST',
    iconUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=120&q=80',
    link: '/catalog?fastDelivery=true',
    badge: 'Express',
    badgeColor: 'bg-rose-500',
  },
  {
    id: 'electrical',
    name: 'Electrical & Appliances',
    iconUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=120&q=80',
    link: '/catalog?category=Industrial+Electrical',
  },
  {
    id: 'office',
    name: 'Office Supplies',
    iconUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=120&q=80',
    link: '/catalog?category=Safety+%26+PPE+Equipment',
  },
  {
    id: 'tools',
    name: 'Industrial Tools',
    iconUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=120&q=80',
    link: '/catalog?category=Power+Tools+%26+Machinery',
  },
  {
    id: 'agri',
    name: 'Agri & Gardening',
    iconUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910a451?auto=format&fit=crop&w=120&q=80',
    link: '/catalog',
  },
  {
    id: 'medical',
    name: 'Medical & Lab Supplies',
    iconUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=120&q=80',
    link: '/catalog',
  },
  {
    id: 'safety',
    name: 'Safety Supplies',
    iconUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=120&q=80',
    link: '/catalog?category=Safety+%26+PPE+Equipment',
  },
  {
    id: 'construction',
    name: 'Construction Materials',
    iconUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=120&q=80',
    link: '/catalog?category=TMT+Steel+%26+Rebars',
  },
  {
    id: 'automotive',
    name: 'Automotive',
    iconUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=120&q=80',
    link: '/catalog',
  },
  {
    id: 'packaging',
    name: 'Packaging & Handling',
    iconUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=120&q=80',
    link: '/catalog',
  },
  {
    id: 'express',
    name: 'Mogli Express',
    iconUrl: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=120&q=80',
    link: '/catalog?deals=true',
    badge: 'NEW',
    badgeColor: 'bg-amber-500',
  },
];

// 2. Moglix-style Hero Slides with Brand Tabs
const HERO_SLIDES = [
  {
    id: 'pantum',
    tabName: 'PANTUM',
    tabDiscount: 'Upto 40% OFF',
    brandTitle: 'PANTUM',
    subtitle: 'Versatile Connectivity',
    discountText: 'UPTO 40% OFF',
    ctaText: 'SHOP NOW',
    ctaLink: '/catalog?category=Industrial+Electrical',
    bgGradient: 'from-[#0b2b5c] via-[#10488f] to-[#0d346b]',
    themeColor: 'text-sky-300',
    productImage: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'eecocool',
    tabName: 'EECOCOOL',
    tabDiscount: 'Upto 70% OFF',
    brandTitle: 'EECOCOOL',
    subtitle: 'Heavy Industrial Air Coolers & Ventilation',
    discountText: 'UPTO 70% OFF',
    ctaText: 'SHOP NOW',
    ctaLink: '/catalog?category=Power+Tools+%26+Machinery',
    bgGradient: 'from-[#0c3931] via-[#115e50] to-[#093029]',
    themeColor: 'text-emerald-300',
    productImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'ultratech',
    tabName: 'ULTRATECH',
    tabDiscount: 'Upto 50% OFF',
    brandTitle: 'ULTRATECH CEMENT',
    subtitle: 'Weather Plus Waterproofing & 53 Grade OPC',
    discountText: 'UPTO 50% OFF',
    ctaText: 'SHOP NOW',
    ctaLink: '/catalog?category=Cement+%26+Ready+Mix',
    bgGradient: 'from-[#2b1604] via-[#592d07] to-[#1f0f03]',
    themeColor: 'text-amber-300',
    productImage: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'hillson',
    tabName: 'HILLSON',
    tabDiscount: 'Upto 30% OFF',
    brandTitle: 'HILLSON SAFETY',
    subtitle: 'ISI Certified Steel Toe Heavy Duty Safety Footwear',
    discountText: 'UPTO 30% OFF',
    ctaText: 'SHOP NOW',
    ctaLink: '/catalog?category=Safety+%26+PPE+Equipment',
    bgGradient: 'from-[#21123a] via-[#412470] to-[#1a0e2e]',
    themeColor: 'text-purple-300',
    productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'powerpac',
    tabName: 'JEW POWERPAC',
    tabDiscount: 'Upto 40% OFF',
    brandTitle: 'JEW POWERPAC',
    subtitle: 'High Output Diesel Generators & Silent Power Plants',
    discountText: 'UPTO 40% OFF',
    ctaText: 'SHOP NOW',
    ctaLink: '/catalog?category=Power+Tools+%26+Machinery',
    bgGradient: 'from-[#381010] via-[#6e1e1e] to-[#2b0c0c]',
    themeColor: 'text-rose-300',
    productImage: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=500&q=80',
  },
];

// 3. Moglix-style 4-Column Feature Promotion Grid
const FEATURE_PROMOTIONS = [
  {
    id: 'schneider',
    title: 'Bring Home Smarter Living',
    subtitle: 'Schneider Electric Smart Switchgears & Distribution',
    ctaText: 'SHOP NOW',
    ctaLink: '/catalog?category=Industrial+Electrical',
    bgColor: 'bg-emerald-900',
    badge: 'Schneider',
    badgeColor: 'bg-emerald-600',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'powertools',
    title: 'Up to 70% OFF',
    subtitle: 'Industrial Spray Guns, Demolition Hammers & Rotary Drills',
    ctaText: 'SHOP NOW',
    ctaLink: '/catalog?category=Power+Tools+%26+Machinery',
    bgColor: 'bg-neutral-900',
    badge: 'Power Tools',
    badgeColor: 'bg-amber-600',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'furniture',
    title: 'UPTO 45% OFF',
    subtitle: 'High Living Ergonomic Office & Executive Mesh Chairs',
    ctaText: 'SHOP NOW',
    ctaLink: '/catalog',
    bgColor: 'bg-stone-800',
    badge: 'HIGH LIVING',
    badgeColor: 'bg-orange-600',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'skf',
    title: 'Choose SKF',
    subtitle: 'Trusted by leaders worldwide. Now available on HinchMart',
    ctaText: 'Shop Now',
    ctaLink: '/catalog?category=Power+Tools+%26+Machinery',
    bgColor: 'bg-blue-900',
    badge: 'SKF Bearings',
    badgeColor: 'bg-blue-600',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
  },
];

// 4. Moglix-style "Related To Items You Have Viewed" Horizontal Category Carousel
const VIEWED_CATEGORIES = [
  {
    name: 'pH Meter',
    count: '310',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80',
    link: '/catalog',
  },
  {
    name: 'Drone Frames',
    count: '20',
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=300&q=80',
    link: '/catalog',
  },
  {
    name: 'Weed Control Mats',
    count: '74',
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6910a451?auto=format&fit=crop&w=300&q=80',
    link: '/catalog',
  },
  {
    name: 'Weighing Scales',
    count: '1886',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80',
    link: '/catalog',
  },
  {
    name: 'Earth Augers',
    count: '336',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=300&q=80',
    link: '/catalog',
  },
  {
    name: 'Fe550D TMT Rebars',
    count: '452',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=300&q=80',
    link: '/catalog?category=TMT+Steel+%26+Rebars',
  },
  {
    name: 'OPC 53 Cement Bags',
    count: '620',
    image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=300&q=80',
    link: '/catalog?category=Cement+%26+Ready+Mix',
  },
  {
    name: 'Demolition Hammers',
    count: '148',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80',
    link: '/catalog?category=Power+Tools+%26+Machinery',
  },
];

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bulkDeals, setBulkDeals] = useState<Product[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const { openRFQModal } = useRFQModalStore();

  useEffect(() => {
    productApi.getFeaturedProducts().then(setFeaturedProducts).catch(console.error);
    productApi.getBulkDeals().then(setBulkDeals).catch(console.error);
  }, []);

  // Auto slide carousel every 6s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[activeSlide];

  return (
    <div className="space-y-6 pb-16 bg-industrial-50/60">
      {/* ========================================================================= */}
      {/* 1. TOP MOGLIX-STYLE ICON CATEGORY RIBBON STRIP                            */}
      {/* ========================================================================= */}
      <section className="bg-white border-b border-industrial-200 py-3 px-4 sm:px-8 lg:px-12 shadow-2xs">
        <div className="max-w-[1720px] w-full mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          {TOP_NAV_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={cat.link}
              className="flex flex-col items-center gap-1.5 shrink-0 group min-w-[76px] sm:min-w-[90px] text-center"
            >
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-industrial-50 border border-industrial-200 group-hover:border-brand-500 group-hover:shadow-md transition-all flex items-center justify-center overflow-hidden p-1">
                <img
                  src={cat.iconUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
                />
                {cat.badge && (
                  <span
                    className={`absolute -top-1 -right-1 text-[8px] font-black text-white px-1.5 py-0.2 rounded-full shadow-xs ${
                      cat.badgeColor || 'bg-brand-600'
                    }`}
                  >
                    {cat.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-industrial-800 group-hover:text-brand-600 transition-colors line-clamp-1 max-w-[85px]">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. HERO BANNER SLIDER + INTERACTIVE BRAND TABS (EXACT MOGLIX HERO)        */}
      {/* ========================================================================= */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12">
        <div className="bg-white rounded-3xl border border-industrial-200 shadow-card overflow-hidden">
          {/* Main Hero Visual Area */}
          <div
            className={`relative bg-gradient-to-r ${slide.bgGradient} text-white p-6 sm:p-10 lg:p-12 transition-all duration-700 min-h-[300px] sm:min-h-[360px] flex flex-col justify-between overflow-hidden`}
          >
            {/* Left/Right Carousel Control Arrows */}
            <button
              onClick={() =>
                setActiveSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))
              }
              aria-label="Previous Slide"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white text-white hover:text-industrial-950 backdrop-blur-md flex items-center justify-center shadow-lg transition-all z-20 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
              aria-label="Next Slide"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white text-white hover:text-industrial-950 backdrop-blur-md flex items-center justify-center shadow-lg transition-all z-20 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Slide Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Left Text Information */}
              <div className="lg:col-span-6 space-y-4">
                <div className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase drop-shadow-md">
                  {slide.brandTitle}
                </div>

                <div className="text-xl sm:text-2xl font-bold text-white/90">
                  {slide.subtitle}
                </div>

                <div className="text-2xl sm:text-4xl font-black text-amber-300 tracking-tight">
                  {slide.discountText}
                </div>

                <div className="pt-2">
                  <Link
                    to={slide.ctaLink}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-industrial-950 hover:bg-brand-50 hover:text-brand-700 rounded-xl font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl transition-all active:scale-95 group"
                  >
                    <span>{slide.ctaText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Right Product Showcase Images */}
              <div className="lg:col-span-6 flex items-center justify-center gap-4 relative">
                <div className="relative w-full max-w-md h-56 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black/20 backdrop-blur-xs">
                  <img
                    src={slide.productImage}
                    alt={slide.brandTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
                {slide.secondaryImage && (
                  <div className="hidden sm:block w-36 h-44 rounded-xl overflow-hidden shadow-xl border border-white/20 -ml-8 mt-12 bg-black/30 backdrop-blur-xs">
                    <img
                      src={slide.secondaryImage}
                      alt={slide.subtitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bank Instant Discount Ribbon (Bottom Right Overlay like Moglix) */}
            <div className="mt-6 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-300 text-xs sm:text-sm">
                  10% Instant Discount*
                </span>
                <span className="text-white/60">|</span>
                <div className="flex items-center gap-2 font-semibold text-white/90 text-[11px] sm:text-xs">
                  <span className="bg-white/20 px-2 py-0.5 rounded font-bold">HDFC BANK</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded font-bold">FEDERAL BANK</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded font-bold">JUPITER</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded font-bold">DBS BANK</span>
                  <span className="text-[10px] text-white/70 hidden md:inline">on Credit Card EMIs *T&C Apply</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Brand Switcher Tabs (Row below Hero like Moglix) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 bg-white border-t border-industrial-200">
            {HERO_SLIDES.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setActiveSlide(idx)}
                className={`py-3.5 px-4 text-center transition-all cursor-pointer border-r last:border-r-0 border-industrial-200 relative ${
                  activeSlide === idx
                    ? 'bg-white text-industrial-950 font-black'
                    : 'bg-industrial-50/50 hover:bg-industrial-100 text-industrial-600 font-semibold'
                }`}
              >
                {/* Active Red/Brand Underline Indicator */}
                {activeSlide === idx && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 shadow-sm animate-in fade-in" />
                )}
                <div className="text-xs sm:text-sm font-extrabold tracking-tight">
                  {item.tabName}
                </div>
                <div
                  className={`text-[11px] ${
                    activeSlide === idx ? 'text-red-600 font-bold' : 'text-industrial-500'
                  }`}
                >
                  {item.tabDiscount}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MOGLIX-STYLE 4-COLUMN PROMOTIONAL FEATURE GRID                         */}
      {/* ========================================================================= */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURE_PROMOTIONS.map((promo) => (
            <Link
              key={promo.id}
              to={promo.ctaLink}
              className={`${promo.bgColor} rounded-2xl overflow-hidden p-4 text-white flex items-center justify-between gap-3 shadow-card hover:shadow-lg transition-all group relative border border-white/10`}
            >
              <div className="flex-1 min-w-0 space-y-1.5 z-10">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-white ${promo.badgeColor}`}
                >
                  {promo.badge}
                </span>
                <h3 className="font-black text-sm sm:text-base leading-tight drop-shadow-xs line-clamp-1">
                  {promo.title}
                </h3>
                <p className="text-[11px] text-white/80 line-clamp-1 leading-snug">
                  {promo.subtitle}
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-white bg-white/20 group-hover:bg-white group-hover:text-industrial-950 px-2.5 py-1 rounded-lg transition-all">
                    <span>{promo.ctaText}</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>

              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-black/30 shadow-md">
                <img
                  src={promo.image}
                  alt={promo.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. "RELATED TO ITEMS YOU HAVE VIEWED" / POPULAR CATEGORIES (MOGLIX STYLE) */}
      {/* ========================================================================= */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12">
        <div className="bg-white rounded-3xl p-6 border border-industrial-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-industrial-950 tracking-tight">
              Related To Items You Have Viewed & Popular Procurement Categories
            </h2>
            <Link
              to="/catalog"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {VIEWED_CATEGORIES.map((cat, idx) => (
              <Link
                key={idx}
                to={cat.link}
                className="group flex flex-col items-center text-center space-y-2 p-2 rounded-2xl hover:bg-industrial-50 transition-colors"
              >
                <div className="relative w-full aspect-square rounded-2xl bg-white border border-industrial-200 group-hover:border-brand-500 overflow-hidden shadow-2xs transition-all flex items-center justify-center p-2">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
                  />
                  {/* Moglix-style Dark Count Badge at Bottom */}
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-industrial-950/85 backdrop-blur-xs text-white text-[10px] font-bold py-0.5 rounded-lg flex items-center justify-center gap-1 shadow-xs">
                    <span>📷</span>
                    <span>{cat.count}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-industrial-800 group-hover:text-brand-600 transition-colors line-clamp-1">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BULK WHOLESALE DEALS & BEST SELLERS (PRODUCT GRID)                     */}
      {/* ========================================================================= */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12">
        <div className="bg-gradient-to-r from-industrial-950 via-slate-900 to-industrial-950 rounded-3xl p-6 sm:p-8 text-white border border-industrial-800 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6 pb-6 border-b border-industrial-800">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Direct Mill & Manufacturer Flash Deals</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Bulk Wholesale Tier Pricing
              </h2>
              <p className="text-xs text-industrial-400 mt-1">
                Unlock tiered discounts up to 12% on full trailer loads & bulk site contracts.
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
            {bulkDeals.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. POST RFQ IN 60 SECONDS INTERACTIVE BOQ BANNER                         */}
      {/* ========================================================================= */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12">
        <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-industrial-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase text-white">
              <Sparkles className="w-4 h-4" />
              <span>Broadcast RFQ in 60 Seconds</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black leading-tight">
              Have a Custom Project BOQ or Bar Bending Schedule?
            </h2>

            <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">
              Upload your material bill of quantities and receive competing wholesale bids from 500+ primary manufacturers with Mill Test Certificates.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => openRFQModal()}
                className="px-6 py-3 rounded-xl bg-white text-brand-700 hover:bg-brand-50 font-black text-xs uppercase tracking-wider shadow-lg shadow-black/10 transition-all active:scale-98 cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-brand-600" />
                <span>Upload BOQ & Request Quotes</span>
              </button>

              <Link
                to="/account"
                className="px-5 py-3 rounded-xl bg-brand-800/80 hover:bg-brand-800 text-white font-bold text-xs border border-brand-500/40 transition-colors flex items-center gap-2"
              >
                <Award className="w-4 h-4 text-brand-300" />
                <span>Check ₹50 Lakhs Credit Line</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FEATURED INDUSTRIAL CATALOG PRODUCTS                                   */}
      {/* ========================================================================= */}
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
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. VERIFIED AUTHORIZED BRANDS SHOWCASE                                    */}
      {/* ========================================================================= */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-industrial-200 shadow-subtle space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold text-brand-600 uppercase tracking-wider mb-1">
                Authorized Brand Distributorships
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-industrial-950">
                Direct Mill & Factory Alliances
              </h2>
            </div>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              100% Genuine MTC Certified
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {BRANDS.map((brand) => (
              <Link
                key={brand.id}
                to={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                className="group flex flex-col items-center justify-center p-4 rounded-2xl border border-industrial-200 hover:border-brand-500 hover:bg-brand-50/20 hover:shadow-card transition-all"
              >
                <span className="font-mono font-black text-xs text-industrial-900 group-hover:text-brand-600 tracking-wider uppercase text-center">
                  {brand.name}
                </span>
                <span className="text-[10px] text-industrial-400 mt-1">
                  {brand.productCount} SKUs in Stock
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
