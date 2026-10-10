import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/layout/CartDrawer';
import { ChatDrawer } from './components/common/ChatDrawer';
import { RFQModal } from './components/common/RFQModal';
import { PincodeModal } from './components/common/PincodeModal';
import { AuthModal } from './components/common/AuthModal';
import { ToastContainer } from './components/common/ToastContainer';
import { VariantSelectModal } from './components/common/VariantSelectModal';
import { CartSnackbar } from './components/common/CartSnackbar';
import { StoreMismatchModal } from './components/common/StoreMismatchModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { CategoryLandingPage } from './pages/CategoryLandingPage';
import { SubcategoryLandingPage } from './pages/SubcategoryLandingPage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { RFQPage } from './pages/RFQPage';
import { OrdersPage } from './pages/OrdersPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { AccountPage } from './pages/AccountPage';
import { WishlistPage } from './pages/WishlistPage';
import { SupportPage } from './pages/SupportPage';
import { EstimationsPage } from './pages/EstimationsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { AdminPanel } from './pages/AdminPanel';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';

import { useCartStore } from './store/useCartStore';
import { useAuthStore } from './store/useAuthStore';
import { useWishlistStore } from './store/useWishlistStore';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const { fetchCart } = useCartStore();
  const { initAuth } = useAuthStore();
  const { fetchWishlist } = useWishlistStore();

  useEffect(() => {
    fetchCart();
    initAuth();
    fetchWishlist();
  }, [fetchCart, initAuth, fetchWishlist]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-industrial-50 text-industrial-900 font-sans selection:bg-brand-500 selection:text-white">
        {/* Global Header */}
        <Header />

        {/* Global Modals & Drawers */}
        <CartDrawer />
        <ChatDrawer />
        <RFQModal />
        <PincodeModal />
        <AuthModal />
        <VariantSelectModal />
        <CartSnackbar />
        <StoreMismatchModal />
        <ToastContainer />

        {/* Main Routed Content */}
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/category/:categorySlug" element={<CategoryLandingPage />} />
            <Route path="/category/:categorySlug/:subcategorySlug" element={<SubcategoryLandingPage />} />
            <Route path="/subcategory/:subcategorySlug" element={<SubcategoryLandingPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/product/slug/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/rfq" element={<RFQPage />} />
            <Route path="/estimations" element={<EstimationsPage />} />
            <Route path="/estimations/:id" element={<EstimationsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/signup" element={<RegisterPage />} />
            <Route path="/access-denied" element={<AccessDeniedPage />} />

            {/* Authenticated Customer Routes */}
            <Route
              path="/account"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'BUYER', 'SELLER', 'ADMIN']}>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'BUYER', 'SELLER', 'ADMIN']}>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'BUYER', 'SELLER', 'ADMIN']}>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-confirmation/:id"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'BUYER', 'SELLER', 'ADMIN']}>
                  <OrderConfirmationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-confirmation/:orderId"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'BUYER', 'SELLER', 'ADMIN']}>
                  <OrderConfirmationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'BUYER', 'SELLER', 'ADMIN']}>
                  <InvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'BUYER', 'SELLER', 'ADMIN']}>
                  <WishlistPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'BUYER', 'SELLER', 'ADMIN']}>
                  <SupportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/help"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'BUYER', 'SELLER', 'ADMIN']}>
                  <SupportPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
