import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useAuthModalStore } from '../store/useAuthModalStore';
import { UserPlus, ShieldCheck, ArrowLeft, LogIn } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useAuthModalStore();

  const passedPhone = (location.state as { phone?: string })?.phone || '';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/account', { replace: true });
    } else {
      openAuthModal('register', passedPhone);
    }
  }, [isAuthenticated, passedPhone, navigate, openAuthModal]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-xl border border-industrial-200 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-industrial-950">
          Create HinchMart Account
        </h1>
        <p className="text-xs text-industrial-600 mt-2">
          Register your business to access wholesale prices, GST tax credits, and direct manufacturer procurement.
        </p>

        {passedPhone && (
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            No existing account for <strong className="font-mono">{passedPhone}</strong>. Proceeding to new buyer registration.
          </div>
        )}

        <div className="mt-6 space-y-3">
          <button
            onClick={() => openAuthModal('register', passedPhone)}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Open Registration Form</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 py-2.5 border border-industrial-300 text-industrial-700 hover:bg-industrial-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In Instead</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 border border-industrial-300 text-industrial-500 hover:text-industrial-800 hover:bg-industrial-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-industrial-100 flex items-center justify-center gap-2 text-[10px] text-industrial-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>GST Verified B2B Marketplace Gateway</span>
        </div>
      </div>
    </div>
  );
};
