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

import { HomePage } from './pages/HomePage';
import { CategoryLandingPage } from './pages/CategoryLandingPage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { RFQPage } from './pages/RFQPage';
import { OrdersPage } from './pages/OrdersPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { AccountPage } from './pages/AccountPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';

import { useCartStore } from './store/useCartStore';
import { useAuthStore } from './store/useAuthStore';

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
  const { fetchUser, fetchAddresses } = useAuthStore();

  useEffect(() => {
    fetchCart();
    fetchUser();
    fetchAddresses();
  }, [fetchCart, fetchUser, fetchAddresses]);

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
        <ToastContainer />

        {/* Main Routed Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/category/:categorySlug" element={<CategoryLandingPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
            <Route path="/rfq" element={<RFQPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
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
