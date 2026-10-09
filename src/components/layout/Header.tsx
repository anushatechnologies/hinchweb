import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useRFQModalStore } from '../../store/useRFQModalStore';
import { useChatStore } from '../../store/useChatStore';
import { categoryApi } from '../../api/categoryApi';
import { searchApi } from '../../api/searchApi';
import { notificationApi } from '../../api/notificationApi';
import { productApi } from '../../api/productApi';
import type { Notification, Category, SearchSuggestions } from '../../types';
import { useAuthModalStore } from '../../store/useAuthModalStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import {
  Search,
  MapPin,
  FileText,
  MessageSquare,
  Bell,
  ShoppingCart,
  ChevronDown,
  Package,
  Truck,
  Sparkles,
  User,
  Tag,
  Layers,
  Heart,
  Briefcase,
  ClipboardList,
  LogOut,
} from 'lucide-react';

export const Header: React.FC = () => {
  const navigate = useNavigate();

  const { cart, openCart } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const isUserLoggedIn = Boolean(isAuthenticated && (user.id || user.phone || user.email));
  const { pincode, city, openPincodeModal } = useLocationStore();
  const { openRFQModal } = useRFQModalStore();
  const { openChatWithSeller } = useChatStore();
  const { openAuthModal } = useAuthModalStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({
    suggestions: [],
    matchingCategories: [],
    matchingBrands: [],
  });
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      notificationApi
        .getNotifications()
        .then(setNotifications)
        .catch(console.error);
    } else {
      setNotifications([]);
    }

    categoryApi
      .getCategories()
      .then(setCategories)
      .catch(console.error);

    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search suggestions fetching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions({ suggestions: [], matchingCategories: [], matchingBrands: [] });
      setIsSuggestionsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      Promise.all([
        searchApi.getSuggestions(searchQuery).catch(() => ({ suggestions: [], matchingCategories: [], matchingBrands: [] })),
        productApi.getSearchSuggestions(searchQuery).catch(() => []),
      ]).then(([searchData, productItems]) => {
        const extraSuggestions = productItems.map((p) => p.title).filter(Boolean);
        const combinedSuggestions = Array.from(new Set([...(searchData.suggestions || []), ...extraSuggestions]));
        const mergedData: SearchSuggestions = {
          ...searchData,
          suggestions: combinedSuggestions,
        };
        setSuggestions(mergedData);
        const hasResults =
          mergedData.suggestions.length > 0 ||
          (mergedData.matchingCategories && mergedData.matchingCategories.length > 0) ||
          (mergedData.matchingBrands && mergedData.matchingBrands.length > 0);
        setIsSuggestionsOpen(hasResults);
      }).catch(() => setIsSuggestionsOpen(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSuggestionsOpen(false);
    navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSelectSuggestion = (type: 'query' | 'category' | 'brand', value: string) => {
    setIsSuggestionsOpen(false);
    if (type === 'category') {
      navigate(`/category/${encodeURIComponent(value.toLowerCase().replace(/\s+/g, '-'))}`);
    } else if (type === 'brand') {
      navigate(`/catalog?brand=${encodeURIComponent(value)}`);
    } else {
      setSearchQuery(value);
      navigate(`/catalog?search=${encodeURIComponent(value)}`);
    }
  };

  const { items: wishlistItems } = useWishlistStore();

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkSingleRead = async (notifId: string, link?: string) => {
    try {
      await notificationApi.markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.warn('Backend markAsRead warning:', err);
    }
    if (link) {
      setIsNotifOpen(false);
      navigate(link);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-industrial-200 shadow-subtle">
      {/* 0. Top Enterprise Business Bar */}
      <div className="bg-gradient-to-r from-red-950 via-industrial-950 to-red-950 text-white text-xs py-1.5 px-4 sm:px-8 lg:px-12 flex items-center justify-between border-b border-red-900/40">
        <div className="flex items-center gap-2 overflow-hidden text-[11px] sm:text-xs">
          <span className="font-extrabold text-brand-400 tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
            <span className="text-white font-black text-sm tracking-tight">hinchmart</span>
            <span className="text-red-400 font-black italic">Business</span>
          </span>
          <span className="text-industrial-600 hidden sm:inline">|</span>
          <span className="text-industrial-300 hidden md:inline truncate">
            AI-Powered Procurement for Your Business. Move Faster. Source Smarter. Scale Seamlessly.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/estimations"
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-[11px] font-extrabold rounded-full transition-all shrink-0 shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>AI Estimate & Quotation</span>
          </Link>
          <Link
            to="/account"
            className="hidden sm:inline-block px-3 py-1 bg-white text-red-700 hover:bg-brand-50 text-[11px] font-extrabold rounded-full transition-all shrink-0 shadow-sm"
          >
            Explore Business
          </Link>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Location */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="HINCHMART"
              className="h-10 sm:h-12 w-auto object-contain group-hover:scale-102 transition-transform"
            />
          </Link>

          {/* Location Delivery Selector */}
          <button
            onClick={openPincodeModal}
            className="hidden md:flex flex-col text-left pl-3 border-l border-industrial-200 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="flex items-center gap-1 text-[10px] font-bold text-industrial-500 uppercase tracking-wide">
              <MapPin className="w-3 h-3 text-red-600" />
              <span>Deliver to:</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-industrial-900">
              <span className="text-red-700 underline underline-offset-2">{city} ({pincode})</span>
              <ChevronDown className="w-3 h-3 text-industrial-400" />
            </div>
          </button>
        </div>

        {/* Center: Search Bar with Live Instant Suggestions */}
        <div className="flex-1 max-w-2xl hidden md:block relative" ref={searchContainerRef}>
          <form
            onSubmit={handleSearch}
            className="flex items-center bg-white border-2 border-industrial-200 focus-within:border-red-600 rounded-xl overflow-hidden shadow-2xs transition-all"
          >
            <input
              type="text"
              placeholder="Search Product, Category, Brand, HSN, Power Tools, Cement, TMT Steel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.suggestions.length > 0) setIsSuggestionsOpen(true);
              }}
              className="flex-1 px-4 py-2.5 text-xs text-industrial-900 placeholder:text-industrial-400 bg-transparent focus:outline-none font-medium"
            />

            <button
              type="submit"
              aria-label="Search catalog"
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Search Suggestions Dropdown */}
          {isSuggestionsOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-industrial-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 text-xs divide-y divide-industrial-100">
              {suggestions.matchingCategories.length > 0 && (
                <div className="p-2.5 bg-industrial-50/70">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-industrial-400 px-2 mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-brand-600" />
                    <span>Categories</span>
                  </div>
                  {suggestions.matchingCategories.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestion('category', cat)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-brand-50 hover:text-brand-700 font-semibold text-industrial-800 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>{cat}</span>
                      <span className="text-[10px] text-industrial-400">Category</span>
                    </button>
                  ))}
                </div>
              )}

              {suggestions.matchingBrands.length > 0 && (
                <div className="p-2.5 bg-industrial-50/40">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-industrial-400 px-2 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-red-600" />
                    <span>Brands</span>
                  </div>
                  {suggestions.matchingBrands.map((brand, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestion('brand', brand)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-brand-50 hover:text-brand-700 font-semibold text-industrial-800 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>{brand}</span>
                      <span className="text-[10px] text-industrial-400">Brand</span>
                    </button>
                  ))}
                </div>
              )}

              {suggestions.suggestions.length > 0 && (
                <div className="p-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-industrial-400 px-2 mb-1">
                    Keyword Suggestions
                  </div>
                  {suggestions.suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestion('query', sug)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-industrial-100 text-industrial-800 font-medium transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 text-industrial-400" />
                      <span>{sug}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Action Widgets */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Post RFQ Button */}
          <button
            onClick={() => openRFQModal()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-industrial-100 hover:bg-industrial-200 text-industrial-800 font-bold text-xs border border-industrial-300 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-brand-600" />
            <span>Post RFQ</span>
          </button>

          {/* Track Order */}
          <Link
            to="/orders"
            className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-industrial-700 hover:text-red-600 transition-colors"
          >
            <Truck className="w-4 h-4 text-industrial-500" />
            <span>Track Order</span>
          </Link>

          {/* Chat with Supplier Trigger */}
          <button
            onClick={() => openChatWithSeller((categories[0] || { name: 'Direct Technical Support' }) as any)}
            className="p-2 rounded-xl border border-industrial-200 hover:bg-industrial-100 text-industrial-700 hover:text-industrial-900 relative transition-colors cursor-pointer"
            title="Direct Supplier Chat"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="w-2 h-2 bg-emerald-500 rounded-full absolute top-1.5 right-1.5 ring-2 ring-white"></span>
          </button>

          {/* Saved Wishlist Icon Button */}
          <button
            onClick={() => {
              if (!isUserLoggedIn) openAuthModal();
              else navigate('/wishlist');
            }}
            className="p-2 rounded-xl border border-industrial-200 hover:bg-industrial-100 text-industrial-700 hover:text-industrial-900 relative transition-colors cursor-pointer"
            title="Saved Wishlist"
            aria-label="Wishlist"
          >
            <Heart className="w-4 h-4" />
            {wishlistItems.length > 0 && (
              <span className="w-4 h-4 bg-[#d9232d] text-white text-[9px] font-bold rounded-full absolute -top-1 -right-1 flex items-center justify-center border-2 border-white">
                {wishlistItems.length}
              </span>
            )}
          </button>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-xl border border-industrial-200 hover:bg-industrial-100 text-industrial-700 hover:text-industrial-900 relative transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full absolute -top-1 -right-1 flex items-center justify-center border-2 border-white">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 sm:hidden"
                  onClick={() => setIsNotifOpen(false)}
                />

                <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 sm:w-96 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-industrial-200 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                  <div className="p-3.5 bg-industrial-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-brand-400" />
                      <span className="font-bold text-xs sm:text-sm">Procurement Updates</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {unreadNotifs.length > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] sm:text-xs text-brand-300 hover:text-white font-semibold cursor-pointer transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setIsNotifOpen(false)}
                        className="sm:hidden text-industrial-400 hover:text-white text-xs px-1 py-0.5 rounded cursor-pointer"
                        aria-label="Close notifications"
                      >
                        ?
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[65vh] sm:max-h-80 overflow-y-auto divide-y divide-industrial-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-industrial-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkSingleRead(notif.id, notif.link)}
                          className={`p-3.5 text-xs space-y-1 hover:bg-industrial-50 transition-colors cursor-pointer ${
                            !notif.isRead ? 'bg-brand-50/50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-industrial-900 gap-2">
                            <span className="truncate">{notif.title}</span>
                            <span className="text-[10px] font-normal text-industrial-400 shrink-0">
                              {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                            </span>
                          </div>
                          <p className="text-industrial-600 text-[11px] leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Account / Login Dropdown (Moglix Reference Style) */}
          <div className="relative" ref={userMenuRef}>
            {isUserLoggedIn ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-industrial-100 hover:bg-industrial-200 text-industrial-900 font-bold text-xs transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-6 h-6 rounded-full bg-[#d9232d] text-white font-black text-[10px] flex items-center justify-center">
                  {(user.companyName || user.fullName || user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="truncate max-w-[100px]">
                  {(user.fullName || user.name || user.companyName || 'User').split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-industrial-500" />
              </button>
            ) : (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-industrial-100/90 hover:bg-industrial-200 text-industrial-800 font-bold text-xs transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-5 h-5 rounded-full bg-industrial-200 text-industrial-700 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span>Login Now</span>
              </button>
            )}

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/20 backdrop-blur-2xs z-40 sm:hidden"
                  onClick={() => setIsUserMenuOpen(false)}
                />

                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-industrial-100 py-3 z-50 animate-in fade-in zoom-in-95 text-xs">
                  {/* Upward Triangle Pointer */}
                  <div className="w-3 h-3 bg-white border-t border-l border-industrial-200 rotate-45 absolute -top-1.5 right-6" />

                  {/* Header Row: New Customer? Sign-Up OR Logged in User */}
                  {isUserLoggedIn ? (
                    <div className="px-4 pb-2.5 border-b border-industrial-100">
                      <div className="font-extrabold text-sm text-industrial-950 truncate">
                        {user.companyName || user.fullName || user.name || 'Enterprise Buyer'}
                      </div>
                      <div className="text-[10px] text-industrial-500 truncate">
                        {user.gstin ? `GSTIN: ${user.gstin}` : user.email || user.phone || 'Verified Account'}
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 pb-2.5 flex items-center justify-between font-bold border-b border-industrial-100">
                      <span className="text-industrial-600">New Customer?</span>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          openAuthModal();
                        }}
                        className="text-[#d9232d] hover:underline font-black cursor-pointer"
                      >
                        Sign-Up
                      </button>
                    </div>
                  )}

                  {/* Moglix Exact Menu Items */}
                  <div className="py-1 space-y-0.5 font-semibold text-industrial-700">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (!isUserLoggedIn) openAuthModal();
                        else navigate('/account');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-industrial-50 hover:text-[#d9232d] transition-colors text-left cursor-pointer"
                    >
                      <User className="w-4 h-4 text-industrial-500" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (!isUserLoggedIn) openAuthModal();
                        else navigate('/orders');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-industrial-50 hover:text-[#d9232d] transition-colors text-left cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4 text-industrial-500" />
                      <span>My Orders</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (!isUserLoggedIn) openAuthModal();
                        else navigate('/rfq');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-industrial-50 hover:text-[#d9232d] transition-colors text-left cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-industrial-500" />
                      <span>My RFQ's</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/estimations');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-industrial-50 hover:text-[#d9232d] transition-colors text-left cursor-pointer font-bold text-brand-700"
                    >
                      <Sparkles className="w-4 h-4 text-brand-600" />
                      <span>AI Estimations & Quotes</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (!isUserLoggedIn) openAuthModal();
                        else navigate('/account');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-industrial-50 hover:text-[#d9232d] transition-colors text-left cursor-pointer"
                    >
                      <Briefcase className="w-4 h-4 text-industrial-500" />
                      <span>My Business Details</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (!isUserLoggedIn) openAuthModal();
                        else navigate('/wishlist');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-industrial-50 hover:text-[#d9232d] transition-colors text-left cursor-pointer"
                    >
                      <Heart className="w-4 h-4 text-industrial-500" />
                      <span>My WishList</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (!isUserLoggedIn) openAuthModal();
                        else navigate('/account');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-industrial-50 hover:text-[#d9232d] transition-colors text-left cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-industrial-500" />
                      <span>My Address</span>
                    </button>

                    {isUserLoggedIn && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 font-bold border-t border-industrial-100 transition-colors text-left cursor-pointer mt-1"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span>Logout</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Cart Icon with count */}
          <button
            onClick={openCart}
            aria-label="Open Procurement Cart"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-industrial-950 text-white hover:bg-industrial-800 transition-all font-bold text-xs shadow-sm cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Cart</span>
            {cart.items.length > 0 && (
              <span className="w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {cart.items.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
