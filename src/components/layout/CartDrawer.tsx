import React from 'react';
import { useCartStore } from '../../store/useCartStore';
import { useLocationStore } from '../../store/useLocationStore';
import { formatINR } from '../../utils/formatters';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Percent,
  ShoppingBag,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const { cart, isOpen, closeCart, updateQuantity, removeItem } = useCartStore();
  const { city, pincode } = useLocationStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-industrial-950/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-industrial-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="bg-industrial-900 text-white p-5 flex items-center justify-between border-b border-industrial-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Procurement Cart</h3>
                <span className="text-xs bg-brand-500 text-white font-bold px-2 py-0.5 rounded-full">
                  {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-industrial-300">
                GST Invoice & Bulk Tier Rates Applied
              </p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 text-industrial-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Destination alert */}
        <div className="bg-industrial-100 px-4 py-2 text-xs flex items-center justify-between text-industrial-700 border-b border-industrial-200">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-brand-600" />
            <span>Delivering to: <strong>{city} ({pincode})</strong></span>
          </div>
          <span className="text-emerald-700 font-semibold">Priority Fleet</span>
        </div>

        {/* Cart Items List */}
        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-industrial-100 text-industrial-400 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-industrial-900 text-base">Your Cart is Empty</h4>
              <p className="text-xs text-industrial-500 max-w-xs mt-1">
                Browse our catalog of verified construction materials, steel, electricals, and industrial machinery.
              </p>
            </div>
            <button
              onClick={() => {
                closeCart();
                navigate('/catalog');
              }}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/20"
            >
              Explore Catalog
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-industrial-100">
              {cart.items.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex gap-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-16 h-16 object-cover rounded-xl border border-industrial-200 shrink-0 bg-industrial-50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-xs text-industrial-900 line-clamp-2 leading-tight">
                          {item.product.title}
                        </h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-industrial-400 hover:text-rose-600 p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-[11px] text-industrial-500 mt-0.5">
                        Brand: <span className="font-semibold text-industrial-800">{item.product.brand}</span> • HSN: {item.product.hsnCode}
                      </div>

                      {/* Bulk Savings Pill */}
                      {item.bulkSavings > 0 && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                          <Percent className="w-2.5 h-2.5" />
                          Saved {formatINR(item.bulkSavings)} (Wholesale Tier Rate)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Stepper */}
                  <div className="flex items-center justify-between bg-industrial-50 p-2.5 rounded-xl border border-industrial-200">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-industrial-950">
                        {formatINR(item.totalPrice)}
                      </div>
                      <div className="text-[10px] text-industrial-500">
                        {formatINR(item.selectedUnitPrice)} / {item.unit} (+{item.gstRate}% GST)
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white border border-industrial-300 rounded-lg p-0.5 shadow-2xs">
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) {
                            removeItem(item.id);
                          } else {
                            updateQuantity(item.id, item.quantity - 1);
                          }
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded text-industrial-600 hover:bg-industrial-100 active:scale-95 cursor-pointer"
                        title={item.quantity <= 1 ? "Remove item" : "Decrease quantity"}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1) {
                            updateQuantity(item.id, val);
                          }
                        }}
                        className="w-10 text-center font-mono font-bold text-xs text-industrial-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[10px] text-industrial-500 font-semibold pr-1">
                        {item.unit}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded text-industrial-600 hover:bg-industrial-100 active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Summary & Checkout */}
            <div className="p-4 bg-white border-t border-industrial-200 space-y-3 shrink-0">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-industrial-600">
                  <span>Subtotal (Taxable):</span>
                  <span className="font-semibold text-industrial-900">{formatINR(cart.taxableAmount)}</span>
                </div>
                {cart.totalBulkDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Bulk Tier Discount:</span>
                    <span>-{formatINR(cart.totalBulkDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-industrial-600">
                  <span>GST (CGST + SGST / IGST):</span>
                  <span className="font-semibold text-industrial-900">{formatINR(cart.totalGst)}</span>
                </div>
                <div className="flex justify-between text-industrial-600">
                  <span>Estimated Site Freight:</span>
                  <span className="font-semibold text-emerald-700">
                    {cart.estimatedFreight === 0 ? 'FREE' : formatINR(cart.estimatedFreight)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-industrial-950 pt-2 border-t border-industrial-200">
                  <span>Estimated Total (Incl. Taxes):</span>
                  <span className="text-brand-600 font-mono text-base">{formatINR(cart.grandTotal)}</span>
                </div>
              </div>

              {/* PayLater banner */}
              <div className="flex items-center gap-2 p-2 bg-brand-50 border border-brand-200 rounded-xl text-[11px] text-brand-900 font-medium">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Eligible for <strong>45-Day Enterprise PayLater</strong> (Credit Line Available)</span>
              </div>

              {/* Checkout button */}
              <div className="flex gap-2">
                <Link
                  to="/cart"
                  onClick={closeCart}
                  className="flex-1 py-3 text-center border border-industrial-300 hover:bg-industrial-50 text-industrial-800 rounded-xl font-bold text-xs transition-colors"
                >
                  View Full Cart
                </Link>
                <button
                  onClick={handleCheckout}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-brand-600/25 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
