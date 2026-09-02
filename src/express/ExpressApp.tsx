import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ExpressHeader } from './components/ExpressHeader';
import { ExpressFooter } from './components/ExpressFooter';
import { ExpressHomePage } from './pages/ExpressHomePage';
import { TrackPage } from './pages/TrackPage';
import { ServicesPage } from './pages/ServicesPage';
import { DriverOnboardingPage } from './pages/DriverOnboardingPage';
import { BusinessPage } from './pages/BusinessPage';
import { HelpPage } from './pages/HelpPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export const ExpressApp: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
        <ExpressHeader />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ExpressHomePage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/driver" element={<DriverOnboardingPage />} />
            <Route path="/business" element={<BusinessPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <ExpressFooter />
      </div>
    </BrowserRouter>
  );
};
