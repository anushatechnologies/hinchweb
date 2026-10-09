import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useAuthModalStore } from '../store/useAuthModalStore';
import { ShieldCheck, Building2, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useAuthModalStore();

  const destination = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(destination, { replace: true });
    } else {
      openAuthModal();
    }
  }, [isAuthenticated, destination, navigate, openAuthModal]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-xl border border-industrial-200 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-industrial-950">
          Sign In to HinchMart
        </h1>
        <p className="text-xs text-industrial-600 mt-2">
          Access your verified B2B procurement account, past orders, GST tax invoices, and wholesale catalogs.
        </p>

        <div className="mt-6">
          <button
            onClick={() => openAuthModal()}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Open Authentication Window</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-industrial-100 flex items-center justify-center gap-2 text-[10px] text-industrial-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secured by Firebase & HinchMart Backend Gateway</span>
        </div>
      </div>
    </div>
  );
};
