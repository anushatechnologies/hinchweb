import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { formatINR } from '../../utils/formatters';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingCart,
  Percent,
  ShieldCheck,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { cart, isOpen, closeCart, updateQuantity, removeItem, clearCart, fetchCart } =
    useCartStore();

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen, fetchCart]);

  if (!isOpen) return null;

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const handleViewCart = () => {
    closeCart();
    navigate('/cart');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-industrial-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-industrial-200 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 bg-industrial-900 text-white flex items-center justify-between border-b border-industrial-800">
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-5 h-5 text-brand-400" />
              <div>
                <h3 className="font-black text-sm">Procurement Cart</h3>
                <span className="text-[11px] text-industrial-400">
                  {cart.items.length} materials selected
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {cart.items.length > 0 && (
                <button
                  onClick={() => clearCart()}
                  className="text-xs text-rose-300 hover:text-white transition-colors px-2 py-1 rounded"
                >
                  Clear
                </button>
              )}
              <button
                onClick={closeCart}
                className="p-1 rounded-lg hover:bg-white/10 text-industrial-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          {cart.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-industrial-100 text-industrial-400 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-industrial-900">Your Cart is Empty</h4>
                <p className="text-xs text-industrial-500 max-w-xs">
                  Browse through our wholesale catalog and add required project materials.
                </p>
              </div>
              <button
                onClick={() => {
                  closeCart();
                  navigate('/catalog');
                }}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Browse Materials Catalog
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-industrial-100">
                {cart.items.map((item) => {
                  const itemId = String(item.productId || item.id || '');
                  const title = item.title || item.product?.title || 'Industrial Material';
                  const brand = item.brand || item.product?.brand || '';
                  const img = item.imageUrl || item.product?.imageUrl || (item.product?.images && item.product.images[0]) || '';
                  const unitPrice = item.selectedUnitPrice || item.unitPrice || item.price || 0;
                  const bulkSavings = item.bulkSavings || 0;

                  return (
                    <div key={itemId} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex gap-3">
                        {img && (
                          <img
                            src={img}
                            alt={title}
                            className="w-16 h-16 object-cover rounded-xl border border-industrial-200 shrink-0 bg-industrial-50"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-xs text-industrial-900 line-clamp-2 leading-tight">
                              {title}
                            </h4>
                            <button
                              onClick={() => removeItem(itemId)}
                              className="text-industrial-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {brand && (
                            <div className="text-[11px] text-industrial-500 mt-0.5">
                              Brand: <span className="font-semibold text-industrial-800">{brand}</span>
                            </div>
                          )}

                          {bulkSavings > 0 && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                              <Percent className="w-2.5 h-2.5" />
                              Saved {formatINR(bulkSavings)} (Wholesale Tier)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Stepper */}
                      <div className="flex items-center justify-between bg-industrial-50 p-2.5 rounded-xl border border-industrial-200">
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-industrial-950 font-mono">
                            {formatINR(item.totalPrice)}
                          </div>
                          <div className="text-[10px] text-industrial-500">
                            {formatINR(unitPrice)} / {item.unit || 'Piece'} (+{item.gstRate || 18}% GST)
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white border border-industrial-300 rounded-lg p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeItem(itemId);
                              } else {
                                updateQuantity(itemId, item.quantity - 1);
                              }
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded text-industrial-600 hover:bg-industrial-100 active:scale-95 cursor-pointer"
                            title="Decrease quantity"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity || 1}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 1) {
                                updateQuantity(itemId, val);
                              }
                            }}
                            className="w-10 text-center font-mono font-bold text-xs text-industrial-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-[10px] text-industrial-500 font-semibold pr-1">
                            {item.unit || 'Piece'}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(itemId, (item.quantity || 1) + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded text-industrial-600 hover:bg-industrial-100 active:scale-95 cursor-pointer"
                            title="Increase quantity"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Summary & Checkout */}
              <div className="p-4 bg-white border-t border-industrial-200 space-y-3 shrink-0">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-industrial-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-industrial-900">{formatINR(cart.subtotal)}</span>
                  </div>
                  {(cart.totalBulkDiscount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Bulk Tier Discount:</span>
                      <span>-{formatINR(cart.totalBulkDiscount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-industrial-600">
                    <span>Estimated GST (18% / 28%):</span>
                    <span className="font-semibold text-industrial-900 font-mono">
                      {formatINR(cart.gstTotal || cart.taxTotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-industrial-600">
                    <span>Freight / Heavy Transit:</span>
                    <span className="font-semibold text-industrial-900 font-mono">
                      {(cart.deliveryTotal || 0) === 0 ? 'FREE' : formatINR(cart.deliveryTotal || 0)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-industrial-200 flex justify-between items-baseline font-black text-sm text-industrial-950">
                    <span>Grand Total:</span>
                    <span className="text-base text-brand-700 font-mono">{formatINR(cart.grandTotal)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleViewCart}
                    className="flex-1 py-3 px-4 rounded-xl border border-industrial-300 hover:bg-industrial-50 text-industrial-800 font-bold text-xs transition-colors text-center cursor-pointer"
                  >
                    View Cart Details
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/25 flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-industrial-500 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>GST Tax Invoice & E-Way Bill auto-generated</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
