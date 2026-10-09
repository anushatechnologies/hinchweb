import React, { useEffect } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { Store, ArrowRight, AlertTriangle, X, Package, ShieldCheck } from 'lucide-react';

export const StoreMismatchModal: React.FC = () => {
  const {
    isStoreMismatchOpen,
    storeMismatchConflict,
    confirmSwitchStore,
    closeStoreMismatch,
    isLoading,
  } = useCartStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isStoreMismatchOpen) {
        closeStoreMismatch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStoreMismatchOpen, closeStoreMismatch]);

  if (!isStoreMismatchOpen || !storeMismatchConflict) {
    return null;
  }

  const { currentStore, newStore, pendingQuantity } = storeMismatchConflict;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-industrial-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-industrial-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-mismatch-title"
      >
        {/* Header / Accent Bar */}
        <div className="bg-amber-500/10 border-b border-amber-200/60 p-5 sm:p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 pr-6">
            <h2 id="store-mismatch-title" className="text-lg font-black text-industrial-950">
              Switch Fulfillment Store?
            </h2>
            <p className="text-xs text-industrial-600 mt-1 leading-relaxed">
              Your cart currently contains items from a different fulfillment store.
            </p>
          </div>
          <button
            onClick={closeStoreMismatch}
            className="absolute top-5 right-5 text-industrial-400 hover:text-industrial-700 p-1.5 rounded-xl hover:bg-industrial-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store Comparison Visual */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
            {/* Current Store Box */}
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-1.5">
              <div className="text-[10px] font-bold tracking-wider uppercase text-rose-600">
                Active Cart Hub
              </div>
              <div className="flex items-center gap-2 text-industrial-950 font-bold text-sm">
                <Store className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="truncate">{currentStore?.name || 'Current Store'}</span>
              </div>
              <p className="text-[11px] text-rose-700 font-medium">
                Current cart items will be cleared
              </p>
            </div>

            {/* Destination Store Box */}
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
              <div className="text-[10px] font-bold tracking-wider uppercase text-emerald-600">
                New Target Hub
              </div>
              <div className="flex items-center gap-2 text-industrial-950 font-bold text-sm">
                <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{newStore?.name || 'New Store'}</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <Package className="w-3 h-3" />
                <span>Adds {pendingQuantity} units to fresh cart</span>
              </p>
            </div>
          </div>

          {/* Explanation Callout */}
          <div className="p-3.5 rounded-2xl bg-industrial-50 border border-industrial-200/80 text-xs text-industrial-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-industrial-800">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Why store-scoped carts?</span>
            </div>
            <p className="text-[11px] leading-relaxed text-industrial-500">
              HinchMart aggregates heavy industrial supplies directly from certified regional depots to ensure scheduled dispatch, bulk pricing tiers, and combined road freight delivery.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeStoreMismatch}
              disabled={isLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-industrial-300 text-industrial-700 hover:bg-industrial-100 font-bold text-xs transition-colors cursor-pointer"
            >
              Keep Current Cart
            </button>
            <button
              type="button"
              onClick={confirmSwitchStore}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Switching Store...</span>
              ) : (
                <>
                  <span>Switch Store & Add Item</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
