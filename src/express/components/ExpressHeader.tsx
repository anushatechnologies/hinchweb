import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Phone,
  Search,
  UserCheck,
  Building,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { ExpressLoginModal } from './ExpressLoginModal';

export const ExpressHeader: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; phone: string } | null>(() => {
    const saved = localStorage.getItem('hinch_express_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isActive = (path: string) => location.pathname === path;

  const handleLoginSuccess = (user: { name: string; phone: string }) => {
    setCurrentUser(user);
    localStorage.setItem('hinch_express_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hinch_express_user');
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-2xs">
      {/* Top Red Notification Bar */}
      <div className="bg-[#d9232d] text-white text-[11px] font-bold py-1.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span>🚀 Book a delivery in under 2 minutes • Doorstep pickup guaranteed • Now live across <strong>Hyderabad</strong></span>
            <span className="hidden md:inline text-red-200">| Helpline: 040-4462-4390</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold">
            <a href="tel:18004462439" className="flex items-center gap-1 hover:underline text-white">
              <Phone className="w-3.5 h-3.5" />
              <span>Toll Free: 1800-446-2439</span>
            </a>
            <a
              href="http://localhost:5175"
              className="inline-flex items-center gap-1 text-red-100 hover:text-white underline underline-offset-2"
            >
              <span>HinchMart Marketplace ↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo (mogliExpress Style) */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex items-center">
              <span className="text-2xl sm:text-3xl font-black tracking-tighter text-[#1e293b] font-outfit">
                hinch
              </span>
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#d9232d] font-outfit italic ml-0.5">
                EXpress
              </span>
              <div className="flex items-center gap-0.5 ml-1.5 self-end mb-1.5">
                <div className="w-2 h-2 rounded-full bg-[#d9232d]" />
                <div className="w-2 h-2 rounded-full bg-[#d9232d]" />
              </div>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-gray-700">
            <Link
              to="/"
              className={`transition-colors hover:text-[#d9232d] ${
                isActive('/') ? 'text-[#d9232d] font-bold' : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/services"
              className={`transition-colors hover:text-[#d9232d] ${
                isActive('/services') ? 'text-[#d9232d] font-bold' : ''
              }`}
            >
              Services & Pricing
            </Link>
            <Link
              to="/track"
              className={`transition-colors hover:text-[#d9232d] flex items-center gap-1.5 ${
                isActive('/track') ? 'text-[#d9232d] font-bold' : ''
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </Link>
            <Link
              to="/driver"
              className={`transition-colors hover:text-[#d9232d] flex items-center gap-1.5 ${
                isActive('/driver') ? 'text-[#d9232d] font-bold' : ''
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Become a Driver</span>
            </Link>
            <Link
              to="/business"
              className={`transition-colors hover:text-[#d9232d] flex items-center gap-1.5 ${
                isActive('/business') ? 'text-[#d9232d] font-bold' : ''
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Business</span>
            </Link>
          </nav>

          {/* Right Action: Login / User Profile Pill Button */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-gray-300 hover:border-[#d9232d] text-gray-800 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-[#d9232d] text-white flex items-center justify-center text-[10px]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span>{currentUser.phone}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 text-xs space-y-1 animate-in fade-in">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="font-bold text-gray-900">{currentUser.name}</div>
                      <div className="text-[10px] text-gray-500">{currentUser.phone}</div>
                    </div>
                    <Link
                      to="/track"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      My Bookings & Invoices
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="px-6 py-2 rounded-full border-2 border-[#d9232d] text-[#d9232d] hover:bg-[#d9232d] hover:text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Login Now
              </button>
            )}

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-2 shadow-xl">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-bold text-gray-800 hover:bg-gray-100"
          >
            Home
          </Link>
          <Link
            to="/services"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-bold text-gray-800 hover:bg-gray-100"
          >
            Services & Rate Card
          </Link>
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-bold text-gray-800 hover:bg-gray-100"
          >
            Track Consignment
          </Link>
          <Link
            to="/driver"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-bold text-gray-800 hover:bg-gray-100"
          >
            Become a Driver Partner
          </Link>
          <Link
            to="/business"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-bold text-gray-800 hover:bg-gray-100"
          >
            Enterprise & B2B Solutions
          </Link>
          <div className="pt-2 border-t border-gray-200">
            <a
              href="http://localhost:5175"
              className="block text-center py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-700"
            >
              HinchMart Material Store ↗
            </a>
          </div>
        </div>
      )}

      {/* Full 2-Column Login/Signup Modal Matching Screenshot */}
      <ExpressLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </header>
  );
};
