import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useRFQModalStore } from '../../store/useRFQModalStore';
import { useChatStore } from '../../store/useChatStore';
import { CATEGORIES } from '../../api/mockData';
import { notificationApi } from '../../api/notificationApi';
import type { Notification } from '../../types';
import { useAuthModalStore } from '../../store/useAuthModalStore';
import {
  Search,
  MapPin,
  FileText,
  MessageSquare,
  Bell,
  ShoppingCart,
  ChevronDown,
  Building2,
  ShieldCheck,
  Package,
  LogIn,
  Truck,
  Sparkles,
  User,
} from 'lucide-react';

export const Header: React.FC = () => {
  const navigate = useNavigate();

  const { cart, openCart } = useCartStore();
  const { user } = useAuthStore();
  const { pincode, city, openPincodeModal } = useLocationStore();
  const { openRFQModal } = useRFQModalStore();
  const { openChatWithSeller } = useChatStore();
  const { openAuthModal } = useAuthModalStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationApi
      .getNotifications()
      .then(setNotifications)
      .catch(console.error);

    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-industrial-200 shadow-subtle">
      {/* 0. Top Enterprise Business Bar (like Moglix Business) */}
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
        <Link
          to="/account"
          className="px-3.5 py-1 bg-white text-red-700 hover:bg-brand-50 text-[11px] font-extrabold rounded-full transition-all shrink-0 shadow-sm"
        >
          Explore HinchMart Business
        </Link>
      </div>

      {/* Main Navigation Row (Moglix layout) */}
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

          {/* Location Delivery Selector (Moglix style) */}
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

        {/* Center: Search Bar with Red Moglix-style search button */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-2xl hidden md:flex items-center bg-white border-2 border-industrial-200 focus-within:border-red-600 rounded-xl overflow-hidden shadow-2xs transition-all"
        >
          <input
            type="text"
            placeholder="Search Product, Category, Brand, HSN, Power Tools, Cement, TMT Steel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Right Action Widgets (Post RFQ, Track Order, Supplier Chat, Notifications, User/Login, Cart) */}
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
            onClick={() => openChatWithSeller(CATEGORIES[0] as any)}
            className="p-2 rounded-xl border border-industrial-200 hover:bg-industrial-100 text-industrial-700 hover:text-industrial-900 relative transition-colors cursor-pointer"
            title="Direct Supplier Chat"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="w-2 h-2 bg-emerald-500 rounded-full absolute top-1.5 right-1.5 ring-2 ring-white"></span>
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
                {/* Mobile Backdrop */}
                <div
                  className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 sm:hidden"
                  onClick={() => setIsNotifOpen(false)}
                />

                {/* Dropdown Container: Fixed & centered on mobile, right-aligned on desktop */}
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
                        ✕
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
                          className={`p-3.5 text-xs space-y-1 hover:bg-industrial-50 transition-colors ${
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

          {/* User Account / Login */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-industrial-100 transition-colors text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-industrial-900 text-white font-black text-xs flex items-center justify-center">
                  {user.companyName.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-industrial-900 leading-tight">
                    {user.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-industrial-500">Enterprise Buyer</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-industrial-400" />
              </button>

              {isUserMenuOpen && (
                <>
                  {/* Mobile Backdrop */}
                  <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 sm:hidden"
                    onClick={() => setIsUserMenuOpen(false)}
                  />

                  {/* Dropdown Container */}
                  <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 sm:w-64 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-industrial-200 py-2 z-50 animate-in fade-in zoom-in-95 text-xs text-industrial-800">
                    <div className="px-4 py-2 border-b border-industrial-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-industrial-950">{user.companyName}</div>
                        <div className="text-[11px] text-industrial-500">GSTIN: {user.gstin}</div>
                      </div>
                      <button
                        onClick={() => setIsUserMenuOpen(false)}
                        className="sm:hidden text-industrial-400 hover:text-industrial-700 text-xs px-1 py-0.5"
                        aria-label="Close menu"
                      >
                        ✕
                      </button>
                    </div>

                    <Link
                      to="/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-industrial-50 font-medium"
                    >
                      <Building2 className="w-4 h-4 text-industrial-400" />
                      Enterprise Account & Credit
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-industrial-50 font-medium"
                    >
                      <Package className="w-4 h-4 text-industrial-400" />
                      Purchase Orders & Tracking
                    </Link>
                    <Link
                      to="/rfq"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-industrial-50 font-medium"
                    >
                      <FileText className="w-4 h-4 text-industrial-400" />
                      My RFQs & Quotations
                    </Link>
                    <Link
                      to="/invoices"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-industrial-50 font-medium"
                    >
                      <ShieldCheck className="w-4 h-4 text-industrial-400" />
                      GST Tax Invoices
                    </Link>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openAuthModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-brand-50 text-brand-600 font-bold border-t border-industrial-100 text-left cursor-pointer transition-colors"
                    >
                      <LogIn className="w-4 h-4 text-brand-600" />
                      <span>Switch / OTP Login</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 text-xs font-bold text-industrial-800 hover:text-red-600 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-industrial-600" />
              <span>Login Now</span>
            </button>
          )}

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
