import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingCart, X } from 'lucide-react';
import { useCartSnackbarStore } from '../../store/useCartSnackbarStore';

export const CartSnackbar: React.FC = () => {
  const { isVisible, productTitle, hideSnackbar } = useCartSnackbarStore();
  const navigate = useNavigate();
  const barRef = useRef<HTMLDivElement>(null);

  // Animate in/out by toggling a class
  useEffect(() => {
    if (!barRef.current) return;
    if (isVisible) {
      barRef.current.style.transform = 'translateY(0)';
      barRef.current.style.opacity = '1';
    } else {
      barRef.current.style.transform = 'translateY(120%)';
      barRef.current.style.opacity = '0';
    }
  }, [isVisible]);

  const handleViewCart = () => {
    hideSnackbar();
    navigate('/cart');
  };

  // Always rendered (hidden when not visible) to allow smooth transition
  return (
    <div
      ref={barRef}
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%) translateY(120%)',
        zIndex: 9999,
        transition: 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.28s ease',
        opacity: 0,
        width: 'min(480px, calc(100vw - 2rem))',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        {/* Left: icon + text */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight">
              Product added successfully
            </p>
            {productTitle && (
              <p className="text-gray-400 text-[11px] truncate mt-0.5 max-w-[200px]">
                {productTitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: VIEW CART button + close */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="cart-snackbar-view-cart-btn"
            onClick={handleViewCart}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs tracking-wider uppercase transition-all active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #ea580c, #c2410c)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(234,88,12,0.4)',
            }}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            View Cart
          </button>

          <button
            onClick={hideSnackbar}
            aria-label="Dismiss"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {isVisible && (
        <div
          className="h-0.5 rounded-full mt-1 mx-1 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <div
            className="h-full rounded-full origin-left"
            style={{
              background: 'linear-gradient(90deg, #ea580c, #f97316)',
              animation: 'snackbar-shrink 4s linear forwards',
            }}
          />
        </div>
      )}
    </div>
  );
};
