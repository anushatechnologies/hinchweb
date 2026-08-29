import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { formatINR } from '../utils/formatters';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  ArrowLeft,
  Percent,
  CheckCircle2,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeItem, clearCart, applyCoupon, fetchCart } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    const res = await applyCoupon(couponInput.trim());
    if (res.success) {
      setCouponMessage({ text: res.message, isError: false });
      setCouponInput('');
    } else {
      setCouponMessage({ text: res.message, isError: true });
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-industrial-100 text-industrial-400 flex items-center justify-center mx-auto shadow-inner">
          <span className="text-3xl">??</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-industrial-950">Your Cart is Empty</h2>
          <p className="text-xs text-industrial-500 max-w-sm mx-auto">
            You don't have any items in your procurement cart yet. Browse our wholesale catalog to get started.
          </p>
        </div>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/25 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore Materials Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-industrial-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-industrial-500 mb-1">
            <Link to="/" className="hover:text-industrial-900">Home</Link>
            <span>/</span>
            <span className="font-semibold text-industrial-800">Procurement Cart</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-industrial-950">
            Project Procurement Cart ({cart.items.length} SKUs)
          </h1>
        </div>

        <button
          onClick={() => clearCart()}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline self-start sm:self-auto cursor-pointer"
        >
          Clear All Items
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-industrial-200 shadow-card divide-y divide-industrial-100 overflow-hidden">
            {cart.items.map((item) => {
              const itemId = String(item.productId || item.id || '');
              const title = item.title || item.product?.title || 'Industrial Material';
              const brand = item.brand || item.product?.brand || '';
              const img = item.imageUrl || item.product?.imageUrl || (item.product?.images && item.product.images[0]) || '';
              const unitPrice = item.selectedUnitPrice || item.unitPrice || item.price || 0;
              const bulkSavings = item.bulkSavings || 0;

              return (
                <div key={itemId} className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex gap-4">
                      {img && (
                        <img
                          src={img}
                          alt={title}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border border-industrial-200 shrink-0 bg-industrial-50"
                        />
                      )}
                      <div className="space-y-1">
                        <h3 className="font-black text-sm sm:text-base text-industrial-950 leading-snug">
                          {title}
                        </h3>
                        {brand && (
                          <div className="text-xs text-industrial-500">
                            Brand: <strong className="text-industrial-800">{brand}</strong>
                          </div>
                        )}
                        {bulkSavings > 0 && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-1">
                            <Percent className="w-3 h-3" />
                            <span>Bulk Savings: {formatINR(bulkSavings)} (Wholesale Tier Rate)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(itemId)}
                      className="text-industrial-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors self-end sm:self-start cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Quantity & Unit Pricing Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-industrial-50 bg-industrial-50/50 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-industrial-600">Quantity:</span>
                      <div className="flex items-center gap-2 bg-white border border-industrial-300 rounded-xl p-1 shadow-2xs">
                        <button
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeItem(itemId);
                            } else {
                              updateQuantity(itemId, item.quantity - 1);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-industrial-600 hover:bg-industrial-100 active:scale-95 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1) {
                              updateQuantity(itemId, val);
                            }
                          }}
                          className="w-12 text-center font-mono font-bold text-sm text-industrial-900 bg-transparent focus:outline-none"
                        />
                        <span className="text-xs text-industrial-500 font-semibold pr-1.5">
                          {item.unit || 'Piece'}
                        </span>
                        <button
                          onClick={() => updateQuantity(itemId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-industrial-600 hover:bg-industrial-100 active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-industrial-950 font-mono">
                        {formatINR(item.totalPrice)}
                      </div>
                      <div className="text-xs text-industrial-500">
                        {formatINR(unitPrice)} / {item.unit || 'Piece'} (+{item.gstRate || 18}% GST)
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-industrial-900 text-white rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full GST Input Tax Credit (ITC) with Automated Tax Invoices</span>
            </div>
            <span className="text-industrial-400">100% Genuine MTC Verified</span>
          </div>
        </div>

        {/* Right Column: Order Summary & Coupon (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-industrial-200 p-6 shadow-card space-y-6">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-100 pb-3">
              Procurement Summary
            </h2>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label className="block text-xs font-semibold text-industrial-700">
                Corporate Discount / Project Coupon
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. INFRA5, BUILD10"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-industrial-900 hover:bg-industrial-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Apply</span>
                </button>
              </div>

              {couponMessage && (
                <div
                  className={`text-xs font-semibold flex items-center gap-1 ${
                    couponMessage.isError ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {!couponMessage.isError && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{couponMessage.text}</span>
                </div>
              )}
            </form>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs pt-2 border-t border-industrial-100">
              <div className="flex justify-between text-industrial-600">
                <span>Subtotal (Base Value):</span>
                <span className="font-semibold text-industrial-900 font-mono">{formatINR(cart.subtotal)}</span>
              </div>

              {(cart.totalBulkDiscount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Bulk Tier Savings:</span>
                  <span className="font-mono">-{formatINR(cart.totalBulkDiscount || 0)}</span>
                </div>
              )}

              <div className="flex justify-between text-industrial-600">
                <span>GST Tax (CGST + SGST):</span>
                <span className="font-semibold text-industrial-900 font-mono">
                  {formatINR(cart.gstTotal || cart.taxTotal || 0)}
                </span>
              </div>

              <div className="flex justify-between text-industrial-600">
                <span>Freight & Transit Insurance:</span>
                <span className="font-semibold text-industrial-900 font-mono">
                  {(cart.deliveryTotal || 0) === 0 ? 'FREE' : formatINR(cart.deliveryTotal || 0)}
                </span>
              </div>

              <div className="pt-3 border-t border-industrial-200 flex justify-between items-baseline font-black text-base text-industrial-950">
                <span>Grand Total:</span>
                <span className="text-xl text-brand-700 font-mono">{formatINR(cart.grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <span>Proceed to Enterprise Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
