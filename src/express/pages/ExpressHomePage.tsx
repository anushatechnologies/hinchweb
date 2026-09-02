import React, { useState } from 'react';
import {
  Clock,
  Zap,
  Package,
  DoorOpen,
  Gift,
  Target,
  UserCheck,
  Bell,
  Monitor,
  Shirt,
  FileText,
  Pill,
  ShoppingBag,
  Cpu,
  Utensils,
  Home,
  Wrench,
  QrCode,
  Star,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BookingConsole } from '../components/BookingConsole';
import { DriverMatchingModal } from '../components/DriverMatchingModal';
import { LiveTrackingView } from '../components/LiveTrackingView';
import type { TripBooking } from '../types';

export const ExpressHomePage: React.FC = () => {
  const [activeBooking, setActiveBooking] = useState<TripBooking | null>(null);
  const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);
  const [activeLocation, setActiveLocation] = useState('Hyderabad');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  const handleBookingCreated = (booking: TripBooking) => {
    setActiveBooking(booking);
    setIsMatchingModalOpen(true);
  };

  const handleDriverAssigned = (updatedBooking: TripBooking) => {
    setActiveBooking(updatedBooking);
  };

  const hyderabadZones = [
    { name: 'Hyderabad', icon: '🏛️' },
    { name: 'HITEC City', icon: '🏙️' },
    { name: 'Gachibowli', icon: '🏢' },
    { name: 'Secunderabad', icon: '🚉' },
    { name: 'Jeedimetla', icon: '🏭' },
    { name: 'Uppal', icon: '🏗️' },
  ];

  const personas = [
    { title: 'Businesses', icon: '🏢' },
    { title: 'Households', icon: '🏠' },
    { title: 'Construction Sites', icon: '🏗️' },
    { title: 'Small Shops', icon: '🏪' },
    { title: 'Factories & Warehouses', icon: '🏭' },
  ];

  const deliveryCategories = [
    { title: 'Office Items', sub: 'Stationery & supplies', icon: Monitor },
    { title: 'Fashion & Clothes', sub: 'Apparel & accessories', icon: Shirt },
    { title: 'Gifts', sub: 'Special care delivery', icon: Gift },
    { title: 'Documents & Files', sub: 'Legal & business docs', icon: FileText },
    { title: 'Pharma', sub: 'Medicine & healthcare', icon: Pill },
    { title: 'Groceries', sub: 'Fresh daily essentials', icon: ShoppingBag },
    { title: 'Electronics', sub: 'Gadgets & gear', icon: Cpu },
    { title: 'Food & Beverages', sub: 'Packed meals & catering', icon: Utensils },
    { title: 'Home Goods', sub: 'Decor & furniture', icon: Home },
    { title: 'Industrial', sub: 'Tools, hardware & raw materials', icon: Wrench, active: true },
  ];

  const cityHubs = [
    {
      name: 'HITEC CITY',
      tag: 'IT & Commercial Hub',
      image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=300&auto=format&fit=crop&q=80',
    },
    {
      name: 'GACHIBOWLI',
      tag: 'Financial District',
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=300&auto=format&fit=crop&q=80',
    },
    {
      name: 'SECUNDERABAD',
      tag: 'Twin City Station Hub',
      image: 'https://images.unsplash.com/photo-1590496793907-49525c56782c?w=300&auto=format&fit=crop&q=80',
    },
    {
      name: 'JEEDIMETLA',
      tag: 'Industrial Corridor',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80',
    },
    {
      name: 'BALANAGAR & UPPAL',
      tag: 'Manufacturing & Freight',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80',
    },
  ];

  const testimonials = [
    {
      quote:
        'I used Hinch Express to send urgent blueprint architectural drawings and hardware samples from Madhapur to our site in Gachibowli. Booked their 2-wheeler bike courier. Same-day delivery was incredibly fast and package arrived in mint condition!',
      rating: 5,
    },
    {
      quote:
        'I recently booked a Tata Ace mini truck for a large material consignment weighing 680 KG, sent from Jeedimetla Phase 2 to Uppal Industrial Area. It was the smoothest logistics experience! Door-to-door pickup was prompt, live GPS was accurate, and fair rates with zero hidden charges.',
      rating: 5,
    },
    {
      quote:
        "I'm excited to share my experience with Hinch Express! Their door-to-door mini truck and courier service in Hyderabad is reliable and convenient. They exceeded my expectations for both urgent sample parcels and heavy bulk material transfers.",
      rating: 5,
    },
  ];

  const allFaqs = [
    {
      q: 'What is Hinch Express?',
      a: 'Hinch Express is a tech-enabled intra-city goods and courier logistics platform operated by HinchMart. We provide on-demand delivery services across Hyderabad starting from 2-wheeler bikes (up to 20 kg) to Tata Ace and 8ft/14ft trucks (up to 2.5 Tons). Just enter your pickup and drop location, calculate transparent per-km fare, and get an automated verified driver right at your doorstep.',
    },
    {
      q: 'How do I use Hinch Express?',
      a: 'Using Hinch Express is simple: (1) Select your vehicle type based on package weight (2W, 3W, or 4W Tata Ace); (2) Enter pickup and drop addresses in Hyderabad; (3) Click "Calculate Price" to view the upfront fare; (4) Confirm your booking to instantly dispatch the nearest verified commercial driver.',
    },
    {
      q: 'How do I book a tempo / mini truck / bike or courier services online from Hinch Express?',
      a: 'You can book directly from the homepage booking console or via the mobile web portal. Choose your vehicle, verify the transparent per-km rate, and confirm. Our automated dispatch radar connects to the closest driver in under 60 seconds with live GPS telemetry and security OTP verification.',
    },
    {
      q: 'Are my goods and cargo insured during transit?',
      a: 'Yes, every commercial booking made through Hinch Express is backed by our ₹10 Lakh comprehensive transit insurance coverage covering transit damage, accidental loss, and verified cargo protection.',
    },
    {
      q: 'How do I receive a GST-compliant tax invoice for Input Tax Credit (ITC)?',
      a: 'Simply check the "Include GST" option when booking and input your 15-digit GSTIN. An automated, itemized GST tax invoice with full ITC eligibility will be generated and emailed to your accounting department upon delivery completion.',
    },
    {
      q: 'What payment modes are supported?',
      a: 'We accept UPI, Credit/Debit cards, Net Banking, Cash on Pickup, and 30-day post-paid corporate credit billing for registered enterprises.',
    },
  ];

  const visibleFaqs = showAllFaqs ? allFaqs : allFaqs.slice(0, 3);

  return (
    <div className="space-y-16 sm:space-y-20 pb-20 bg-[#fafafa]">
      {/* 1. HERO SECTION WITH HYDERABAD LOCATION SELECTION */}
      <section className="pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 text-center">
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-gray-500">We are available in</div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {hyderabadZones.map((loc) => {
              const isSelected = activeLocation === loc.name;
              return (
                <button
                  type="button"
                  key={loc.name}
                  onClick={() => setActiveLocation(loc.name)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#d9232d] text-white shadow-md shadow-red-600/20'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-2xs'
                  }`}
                >
                  <span>{loc.name}</span>
                  <span>{loc.icon}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-outfit text-gray-900 leading-tight">
            Send Anything, <span className="text-[#d9232d]">Across Hyderabad</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mx-auto">
            Fast, Safe & Affordable deliveries for business, households, construction sites, shops & everyone in between.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-2">
          {personas.map((p, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 shadow-2xs text-xs font-bold text-gray-700 shrink-0 hover:border-[#d9232d] hover:text-[#d9232d] transition-colors"
            >
              <span>{p.icon}</span>
              <span>{p.title}</span>
            </div>
          ))}
        </div>

        <div className="pt-4">
          {activeBooking && activeBooking.status !== 'searching_driver' ? (
            <LiveTrackingView
              booking={activeBooking}
              onResetBooking={() => setActiveBooking(null)}
            />
          ) : (
            <BookingConsole onBookingCreated={handleBookingCreated} />
          )}
        </div>
      </section>

      {isMatchingModalOpen && activeBooking && (
        <DriverMatchingModal
          booking={activeBooking}
          onDriverAssigned={handleDriverAssigned}
          onClose={() => setIsMatchingModalOpen(false)}
        />
      )}

      {/* 2. STATS MARQUEE DARK RIBBON */}
      <section className="bg-[#111827] text-white py-4 px-4 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 text-xs sm:text-sm font-bold text-gray-200 shrink-0 min-w-max">
          <div className="flex items-center gap-1.5">
            <span className="text-orange-400 font-black">+</span>
            <span>100K+ Trips Completed</span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-1.5">
            <span>⭐</span>
            <span>4.9 Rating</span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-1.5">
            <span>🏙️</span>
            <span>Hyderabad Central Grid</span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-1.5">
            <span>⚡</span>
            <span>Same-Day Delivery</span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-1.5">
            <span>🚪</span>
            <span>Doorstep Pickup</span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-1.5">
            <span>💰</span>
            <span>Best Price Guarantee</span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-1.5">
            <span>🛡️</span>
            <span>1000+ Delivery Partners</span>
          </div>
        </div>
      </section>

      {/* 3. DISCOUNT & COUPON BANNER CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative rounded-3xl p-6 bg-gradient-to-r from-[#fbbf24] via-[#f59e0b] to-[#fbbf24] text-slate-950 shadow-lg overflow-hidden flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-md shrink-0">
              <div className="w-full h-full bg-[#d9232d] rounded-xl text-white font-black flex items-center justify-center text-lg">
                %
              </div>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-950">
                2 WHEELER OFFER
              </div>
              <div className="text-2xl font-black leading-tight">Flat ₹50 OFF</div>
              <div className="text-xs font-semibold text-amber-900">On your 1st Order</div>
            </div>
          </div>

          <div className="relative rounded-3xl p-6 bg-gradient-to-r from-[#34d399] via-[#10b981] to-[#34d399] text-white shadow-lg overflow-hidden flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-md shrink-0">
              <div className="w-full h-full bg-[#d9232d] rounded-xl text-white font-black flex items-center justify-center text-lg">
                %
              </div>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100">
                3 & 4 WHEELER OFFER
              </div>
              <div className="text-2xl font-black leading-tight">Flat ₹100 OFF</div>
              <div className="text-xs font-semibold text-emerald-100">On your 1st Order</div>
            </div>
          </div>

          <div className="relative rounded-3xl p-6 bg-gradient-to-r from-[#60a5fa] via-[#3b82f6] to-[#60a5fa] text-white shadow-lg overflow-hidden flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-md shrink-0">
              <div className="w-full h-full bg-[#d9232d] rounded-xl text-white font-black flex items-center justify-center text-lg">
                %
              </div>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100">
                ALL VEHICLE TYPE
              </div>
              <div className="text-2xl font-black leading-tight">Flat 10% OFF</div>
              <div className="text-xs font-semibold text-blue-100">On your 2nd and 3rd Order</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VEHICLE DIMENSIONS & SPECIFICATION CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-[#d9232d] text-xs font-black uppercase tracking-wider">
            TAILORED TO YOUR NEEDS
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-950 font-outfit">
            Book Delivery by Vehicle Size
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-md flex flex-col justify-between space-y-6 hover:border-[#d9232d] transition-colors">
            <div className="space-y-4">
              <div className="relative h-40 flex items-center justify-center bg-gray-50 rounded-2xl p-4">
                <span className="absolute top-2 text-[10px] font-black text-[#d9232d]">40cm ↔</span>
                <span className="absolute left-2 text-[10px] font-black text-[#d9232d]">↕ 40cm</span>
                <img
                  src="https://cdn-icons-png.flaticon.com/512/3198/3198336.png"
                  alt="2 Wheeler"
                  className="h-28 object-contain"
                />
              </div>
              <div className="space-y-1 text-center">
                <h3 className="text-xl font-black text-gray-900">2 Wheeler</h3>
                <div className="text-xs font-bold text-blue-600">(40cm x 40cm x 40cm)</div>
                <div className="text-sm font-bold text-gray-800 pt-1">Max Weight: 20 KG</div>
                <p className="text-xs font-bold text-emerald-600">Small parcels & Documents</p>
              </div>
            </div>
            <a
              href="#booking-console"
              className="w-full py-3 rounded-xl bg-gray-900 hover:bg-[#d9232d] text-white font-bold text-xs uppercase tracking-wider transition-colors inline-block text-center"
            >
              Book 2 Wheeler
            </a>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-md flex flex-col justify-between space-y-6 hover:border-[#d9232d] transition-colors">
            <div className="space-y-4">
              <div className="relative h-40 flex items-center justify-center bg-gray-50 rounded-2xl p-4">
                <span className="absolute top-2 text-[10px] font-black text-[#d9232d]">6 ft ↔</span>
                <span className="absolute left-2 text-[10px] font-black text-[#d9232d]">↕ 5 ft</span>
                <img
                  src="https://cdn-icons-png.flaticon.com/512/3774/3774278.png"
                  alt="3 Wheeler"
                  className="h-28 object-contain"
                />
              </div>
              <div className="space-y-1 text-center">
                <h3 className="text-xl font-black text-gray-900">3 Wheeler</h3>
                <div className="text-xs font-bold text-blue-600">(6*5*5 in Ft)</div>
                <div className="text-sm font-bold text-gray-800 pt-1">Max Weight: Upto 500 KG</div>
                <p className="text-xs font-bold text-emerald-600">Multiple Boxes & Stock</p>
              </div>
            </div>
            <a
              href="#booking-console"
              className="w-full py-3 rounded-xl bg-gray-900 hover:bg-[#d9232d] text-white font-bold text-xs uppercase tracking-wider transition-colors inline-block text-center"
            >
              Book 3 Wheeler
            </a>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-md flex flex-col justify-between space-y-6 hover:border-[#d9232d] transition-colors">
            <div className="space-y-4">
              <div className="relative h-40 flex items-center justify-center bg-gray-50 rounded-2xl p-4">
                <span className="absolute top-2 text-[10px] font-black text-[#d9232d]">7 ft ↔</span>
                <span className="absolute left-2 text-[10px] font-black text-[#d9232d]">↕ 5 ft</span>
                <img
                  src="https://cdn-icons-png.flaticon.com/512/2830/2830305.png"
                  alt="4 Wheeler"
                  className="h-28 object-contain"
                />
              </div>
              <div className="space-y-1 text-center">
                <h3 className="text-xl font-black text-gray-900">4 Wheeler (Tata Ace)</h3>
                <div className="text-xs font-bold text-blue-600">(7*4*5 in ft)</div>
                <div className="text-sm font-bold text-gray-800 pt-1">Max Weight: Upto 750 KG</div>
                <p className="text-xs font-bold text-emerald-600">Large Items & Shifting</p>
              </div>
            </div>
            <a
              href="#booking-console"
              className="w-full py-3 rounded-xl bg-gray-900 hover:bg-[#d9232d] text-white font-bold text-xs uppercase tracking-wider transition-colors inline-block text-center"
            >
              Book 4 Wheeler
            </a>
          </div>
        </div>
      </section>

      {/* 5. "OUR IMPACT - NUMBERS THAT SPEAK FOR THEMSELVES" RED SECTION */}
      <section className="bg-[#d9232d] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider">
              OUR IMPACT
            </div>
            <h2 className="text-3xl sm:text-5xl font-black font-outfit text-white">
              Numbers That Speak for Themselves
            </h2>
            <p className="text-xs sm:text-sm text-red-100">
              Trusted by thousands of businesses and households across Hyderabad every single day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-center space-y-1">
              <div className="text-4xl sm:text-5xl font-black text-white font-outfit">1,000+</div>
              <div className="text-sm font-bold text-red-100">Delivery Partners</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-center space-y-1">
              <div className="text-4xl sm:text-5xl font-black text-white font-outfit">2,500+</div>
              <div className="text-sm font-bold text-red-100">Happy Customers</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-center space-y-1">
              <div className="text-4xl sm:text-5xl font-black text-white font-outfit">100K+</div>
              <div className="text-sm font-bold text-red-100">Trips Completed</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-white">Instant Delivery up to 20 kg</h3>
              <p className="text-xs text-red-100 leading-relaxed">
                Same-day delivery for lightweight packages across Hyderabad.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-white">Hassle-free up to 750 kg</h3>
              <p className="text-xs text-red-100 leading-relaxed">
                Bulk freight and construction supplies handled smoothly without stress.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-white">Book a Rider in 2 Minutes</h3>
              <p className="text-xs text-red-100 leading-relaxed">
                No long forms, no queues — booking done in seconds.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <DoorOpen className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-white">Doorstep Pickup Always</h3>
              <p className="text-xs text-red-100 leading-relaxed">
                We come to your door for every pickup, every single time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. "HOW IT WORKS - BOOK A DELIVERY IN 4 EASY STEPS" */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-[#d9232d] text-xs font-black uppercase tracking-wider">
            HOW IT WORKS
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-950 font-outfit">
            Book a Delivery in <span className="text-[#d9232d]">4 Easy Steps</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
            Simple enough for everyone — whether you're 18 or 80.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="hidden md:block absolute top-9 left-16 right-16 h-1 bg-gradient-to-r from-red-500 via-orange-400 to-red-500 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
            <div className="space-y-4 flex flex-col items-center">
              <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-[#d9232d] to-[#f97316] text-white text-2xl font-black flex items-center justify-center shadow-xl shadow-red-500/30 ring-8 ring-white">
                1
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-gray-900">Choose Your Vehicle</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-[200px] mx-auto">
                  Select 2, 3, or 4 wheeler based on package size and weight.
                </p>
              </div>
            </div>

            <div className="space-y-4 flex flex-col items-center">
              <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-[#d9232d] to-[#f97316] text-white text-2xl font-black flex items-center justify-center shadow-xl shadow-red-500/30 ring-8 ring-white">
                2
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-gray-900">Enter Addresses</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-[200px] mx-auto">
                  Add pickup and delivery locations in Hyderabad. Swap them with one tap.
                </p>
              </div>
            </div>

            <div className="space-y-4 flex flex-col items-center">
              <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-[#d9232d] to-[#f97316] text-white text-2xl font-black flex items-center justify-center shadow-xl shadow-red-500/30 ring-8 ring-white">
                3
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-gray-900">Get Instant Price</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-[200px] mx-auto">
                  Transparent pricing upfront — no surprises, no hidden fees.
                </p>
              </div>
            </div>

            <div className="space-y-4 flex flex-col items-center">
              <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-[#d9232d] to-[#f97316] text-white text-2xl font-black flex items-center justify-center shadow-xl shadow-red-500/30 ring-8 ring-white">
                4
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-gray-900">Track Live</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-[200px] mx-auto">
                  Follow your delivery on a live map until it arrives safely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. "WE ARE ON THE MOVE IN THESE HUBS" */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-center">
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-950 font-outfit">
            We are on the move <span className="text-[#d9232d]">in these hubs</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Fast, reliable delivery services connecting key tech parks, industrial corridors & twin-city centers.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          {cityHubs.map((hub, idx) => (
            <div key={idx} className="flex flex-col items-center space-y-3 group cursor-pointer">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 group-hover:border-[#d9232d] transition-all">
                <img
                  src={hub.image}
                  alt={hub.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-black text-sm text-gray-900 group-hover:text-[#d9232d] transition-colors">
                  {hub.name}
                </h4>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {hub.tag}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. "THE SMARTER WAY TO SEND & TRACK DELIVERIES" */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-y border-gray-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-[280px] sm:w-[320px] rounded-[44px] bg-slate-950 p-4 shadow-2xl border-4 border-slate-800 ring-12 ring-gray-100">
              <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-3" />
              <div className="bg-[#fafafa] rounded-[32px] overflow-hidden p-4 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="font-black text-sm text-gray-900">hinch</span>
                    <span className="font-black text-sm text-[#d9232d] italic">EXpress</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-[#d9232d] text-[9px] font-bold">
                    Hyderabad
                  </span>
                </div>
                <div className="bg-[#d9232d] text-white p-3 rounded-2xl space-y-1">
                  <div className="text-[11px] font-black leading-tight">Reliable Deliveries Across Hyderabad</div>
                  <div className="text-[9px] text-red-100">Book mini-trucks & bikes instantly</div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <div className="bg-white p-2 rounded-xl border border-red-500 text-center shadow-xs">
                    <div className="text-xs">🛵</div>
                    <div className="text-[9px] font-black text-[#d9232d]">Bike</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-gray-200 text-center shadow-xs">
                    <div className="text-xs">🛺</div>
                    <div className="text-[9px] font-bold text-gray-700">3 Wheeler</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-gray-200 text-center shadow-xs">
                    <div className="text-xs">🚚</div>
                    <div className="text-[9px] font-bold text-gray-700">Tata Ace</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-[10px]">
                  <div>
                    <span className="font-bold text-amber-900">Get Flat ₹50 OFF</span>
                    <div className="text-[8px] text-amber-700">Use code HINCH50</div>
                  </div>
                  <span className="px-2 py-0.5 bg-[#d9232d] text-white font-bold rounded-md text-[9px]">
                    APPLY
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-900 text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <div className="text-[9px] font-semibold truncate">TS 09 UB 4821 • 4 min away</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-5xl font-black text-gray-950 font-outfit leading-tight">
                The Smarter Way to <span className="text-[#d9232d]">Send & Track</span> Deliveries
              </h2>
              <p className="text-sm sm:text-base text-gray-500">
                Everything in your pocket — available in Telugu, Hindi & English.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-red-100 text-[#d9232d] flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-black text-sm text-gray-900">Exclusive App Discounts</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Save more with app-only offers on every intra-city delivery.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-red-100 text-[#d9232d] flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-black text-sm text-gray-900">Real-Time GPS Tracking</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Know exactly where your commercial package is at all times.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-red-100 text-[#d9232d] flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-black text-sm text-gray-900">See Your Delivery Partner</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Name, photo, vehicle plate & rating — complete transparency.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-red-100 text-[#d9232d] flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-black text-sm text-gray-900">Instant Updates</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    SMS, WhatsApp & app telemetry at every delivery step.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => alert('Hinch Express iOS app is launching soon on the App Store!')}
                  className="px-4 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>🍎</span>
                  <div className="text-left leading-tight">
                    <div className="text-[9px] text-gray-300">Download on</div>
                    <div>App Store</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => alert('Hinch Express Android APK will be available on Google Play!')}
                  className="px-4 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>🤖</span>
                  <div className="text-left leading-tight">
                    <div className="text-[9px] text-gray-300">GET IT ON</div>
                    <div>Google Play</div>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <div className="w-9 h-9 rounded-lg bg-gray-100 p-1.5 flex items-center justify-center border border-gray-200">
                  <QrCode className="w-full h-full text-gray-800" />
                </div>
                <span>Scan to download the App</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. "WHAT WE DELIVER - YOUR PACKAGE, OUR RESPONSIBILITY" */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-[#d9232d] text-xs font-black uppercase tracking-wider">
            WHAT WE DELIVER
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-950 font-outfit">
            Your Package, <span className="text-[#d9232d]">Our Responsibility</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
            From a small courier or sample to bulk industrial and construction freight — every package is handled with utmost care.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
          {deliveryCategories.map((cat, idx) => {
            const IconComponent = cat.icon;
            return (
              <div
                key={idx}
                className={`bg-white rounded-3xl p-6 border transition-all flex flex-col items-center text-center space-y-3 cursor-pointer group ${
                  cat.active
                    ? 'border-[#d9232d] shadow-lg shadow-red-500/10'
                    : 'border-gray-200 shadow-2xs hover:border-[#d9232d] hover:shadow-md'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#d9232d] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <IconComponent className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-[#d9232d] transition-colors">
                    {cat.title}
                  </h4>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {cat.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. "REAL STORIES - TRUSTED BY ALL KINDS OF HYDERABAD CITIZENS" (Screenshot 1) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-[#d9232d] text-xs font-black uppercase tracking-wider">
            REAL STORIES
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-950 font-outfit">
            Trusted by <span className="text-[#d9232d]">All Kinds of Hyderabad Citizens</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
            From a site engineer in HITEC City to a hardware distributor in Balanagar — everyone trusts Hinch Express.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 sm:p-8 border-t-4 border-t-[#d9232d] border-x border-b border-gray-200 shadow-md space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-4xl font-serif text-red-200 leading-none select-none">“</span>
                <div className="flex items-center gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                  {t.quote}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 11. "GOT QUESTIONS? - FAQ ACCORDION" (Screenshot 2) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-950 font-outfit">
            Got Questions?
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Quick answers — no jargon, just clarity.
          </p>
        </div>

        <div className="space-y-3 text-left">
          {visibleFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen ? 'border-[#d9232d] bg-white shadow-sm' : 'border-gray-200 bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <span className="font-extrabold text-sm text-gray-900">{faq.q}</span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isOpen ? 'bg-[#d9232d] text-white' : 'bg-orange-500 text-white'
                    }`}
                  >
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Show More FAQs Button (Screenshot 3) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAllFaqs(!showAllFaqs)}
            className="px-6 py-2.5 bg-[#d9232d] hover:bg-[#b91c1c] text-white rounded-xl font-bold text-xs shadow-md shadow-red-600/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>{showAllFaqs ? 'Show Less FAQs' : 'Show More FAQs'}</span>
            {showAllFaqs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </section>

      {/* 12. SEO & INFORMATIONAL CONTENT ARTICLE SECTION (Screenshots 3 & 4) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-800 space-y-8 border-t border-gray-200 text-left">
        <div className="space-y-3">
          <h3 className="text-xl sm:text-2xl font-black text-gray-950 font-outfit">
            Hassle-Free Package Delivery Services - Book 2 Wheelers, Mini Trucks or Trucks for All Your Needs
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Hinch Express is your trusted logistics partner across Hyderabad, offering fast, cost-effective, and transparent intra-city goods transportation. For quick parcel deliveries, book a 2-wheeler bike for packages up to 20 kg, or choose a Tata Ace mini truck for heavier consignments up to 750 kg across HITEC City, Gachibowli, Secunderabad, Jeedimetla, Balanagar, Uppal, and Shamshabad. With seamless doorstep pickup, instant automated driver matching, and 100% insured transit, Hinch Express makes logistics simple, reliable, and affordable for businesses and individuals alike.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-base font-extrabold text-gray-950">
            How do you send packages/parcels through Hinch Express?
          </h4>
          <p className="text-xs text-gray-600">
            Sending packages and commercial freight is easier than ever with Hinch Express:
          </p>
          <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1 pl-2">
            <li>Open Hinch Express and select your preferred vehicle (2-Wheeler, 3-Wheeler, or Tata Ace).</li>
            <li>Enter your exact pickup and drop address in Hyderabad.</li>
            <li>Review the itemized transparent fare calculation.</li>
            <li>A verified commercial driver will be assigned to pick up your package within minutes.</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <h4 className="text-base font-extrabold text-gray-950">
              Send Packages and Courier By Bike
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              For small packages, a two-wheeler is your fastest option. Book a bike courier to transport items up to 20 kg across Hyderabad within 45 minutes. Whether it's legal documents, gifts, lab samples, or urgent small hardware spares, enjoy reliable same-day delivery without any hassle.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-base font-extrabold text-gray-950">
              Book Mini Trucks for Larger Loads
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              For commercial shipments weighing up to 750 kg, mini trucks like the TATA ACE are the perfect fit. Easily transport construction supplies, electrical cables, sanitary fixtures, timber, or site equipment with professional loading helpers.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <h4 className="text-base font-extrabold text-gray-950">
            Why Book with HinchExpress.com?
          </h4>
          <div className="space-y-2 text-xs text-gray-600">
            <p>
              <strong>1. Reliable Same-Day Deliveries:</strong> Hinch Express guarantees fast and secure intra-city delivery services across all Hyderabad zones, saving your business valuable time and transportation cost.
            </p>
            <p>
              <strong>2. Door-to-Door Convenience:</strong> Whether it is a single carton or bulk pallet freight, our drivers provide doorstep pickup and delivery with real-time GPS telemetry and digital POD verification.
            </p>
            <p>
              <strong>3. B2B GST Invoicing & ITC:</strong> Claim 100% Input Tax Credit with our itemized GST tax invoices generated instantly for every commercial delivery.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
