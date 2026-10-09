import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { formatINR } from '../utils/formatters';
import { couponApi } from '../api/couponApi';
import type { EligibleCoupon, CustomerDiscount, Coupon } from '../types';
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
  Sparkles,
  AlertCircle,
  Award,
  Store,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon, fetchCart } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [eligibleCoupons, setEligibleCoupons] = useState<EligibleCoupon[]>([]);
  const [customerDiscounts, setCustomerDiscounts] = useState<CustomerDiscount[]>([]);
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    couponApi.getEligibleCoupons(cart.subtotal).then(setEligibleCoupons).catch(() => {});
    couponApi.getCustomerDiscounts().then(setCustomerDiscounts).catch(() => {});
    couponApi.getCoupons().then(setAllCoupons).catch(() => {});
  }, [cart.subtotal]);

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
          {cart.storeName && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 mt-2">
              <Store className="w-3.5 h-3.5" />
              <span>Fulfillment Hub: {cart.storeName}</span>
            </div>
          )}
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
              const itemId = item.cartItemId ? String(item.cartItemId) : String(item.productId || item.id || '');
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
                          type="button"
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeItem(itemId);
                            } else {
                              updateQuantity(itemId, item.quantity - 1);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-industrial-600 hover:bg-industrial-100 active:scale-95 cursor-pointer"
                          title="Decrease quantity"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
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
                          className="w-12 text-center font-mono font-bold text-sm text-industrial-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-xs text-industrial-500 font-semibold pr-1.5">
                          {item.unit || 'Piece'}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemId, (item.quantity || 1) + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-industrial-600 hover:bg-industrial-100 active:scale-95 cursor-pointer"
                          title="Increase quantity"
                          aria-label="Increase quantity"
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
                        {item.originalPrice && item.originalPrice > unitPrice && (
                          <span className="line-through text-industrial-400 mr-1.5 font-mono">
                            {formatINR(item.originalPrice)}
                          </span>
                        )}
                        <span className="font-mono">{formatINR(unitPrice)}</span> / {item.unit || 'Piece'} (+{item.gstRate || 18}% GST)
                      </div>
                      {item.appliedTier && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.appliedTier}
                          </span>
                        </div>
                      )}
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

            {/* Active Evaluated Cart Coupons */}
            {eligibleCoupons.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-industrial-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>Eligible Cart Promos & Discounts</span>
                </div>
                <div className="space-y-2">
                  {eligibleCoupons.map((coupon) => {
                    const isApplied =
                      cart.appliedCoupon?.code === coupon.code ||
                      cart.appliedCoupon === coupon.code;
                    return (
                      <div
                        key={coupon.code}
                        className={`p-3 rounded-2xl border transition-all text-xs flex flex-col gap-2 ${
                          isApplied
                            ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                            : coupon.isApplicable
                            ? 'bg-industrial-50/70 border-industrial-200 hover:border-brand-300'
                            : 'bg-industrial-50/40 border-industrial-200/60 opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded text-[11px]">
                                {coupon.code}
                              </span>
                              <span className="font-bold text-industrial-950 truncate">
                                {coupon.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-industrial-600">
                              {coupon.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={isApplied || !coupon.isApplicable}
                            onClick={async () => {
                              setCouponInput(coupon.code);
                              const res = await applyCoupon(coupon.code);
                              if (res.success) {
                                setCouponMessage({ text: res.message, isError: false });
                                setCouponInput('');
                              } else {
                                setCouponMessage({ text: res.message, isError: true });
                              }
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                              isApplied
                                ? 'bg-emerald-600 text-white cursor-default'
                                : coupon.isApplicable
                                ? 'bg-industrial-900 hover:bg-brand-600 text-white shadow-sm'
                                : 'bg-industrial-200 text-industrial-400 cursor-not-allowed'
                            }`}
                          >
                            {isApplied ? 'Applied' : 'Apply'}
                          </button>
                        </div>

                        {/* Status Note: Savings vs Shortfall */}
                        <div className="pt-1.5 border-t border-industrial-100 flex items-center justify-between text-[10px]">
                          {coupon.isApplicable ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Eligible for {formatINR(coupon.estimatedDiscount)} discount</span>
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Add {formatINR(coupon.shortfallAmount)} more to unlock</span>
                            </span>
                          )}
                          <span className="text-industrial-400 font-mono">
                            Min Order: {formatINR(coupon.minOrderAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Approved Buyer Commercial Discounts */}
            {customerDiscounts.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-industrial-100">
                <div className="text-[11px] font-bold text-industrial-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Approved Buyer Commercial Discounts</span>
                </div>
                <div className="space-y-2">
                  {customerDiscounts.map((disc) => {
                    const isApplied =
                      cart.appliedCoupon?.code === disc.code ||
                      cart.appliedCoupon === disc.code;
                    const isMinMet = (cart.subtotal || 0) >= (disc.minimumOrderAmount || 0);

                    return (
                      <div
                        key={disc.code || disc.discountId}
                        className={`p-3 rounded-2xl border transition-all text-xs flex flex-col gap-2 ${
                          isApplied
                            ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                            : isMinMet
                            ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                            : 'bg-industrial-50/40 border-industrial-200/60 opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-[11px]">
                                {disc.code}
                              </span>
                              <span className="font-bold text-industrial-950 truncate">
                                {disc.discountType === 'PERCENTAGE'
                                  ? `${disc.discountValue}% Commercial Discount`
                                  : `${formatINR(disc.discountValue)} Flat Discount`}
                              </span>
                            </div>
                            <p className="text-[11px] text-industrial-600">
                              {disc.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={isApplied || !isMinMet}
                            onClick={async () => {
                              setCouponInput(disc.code);
                              const res = await applyCoupon(disc.code);
                              if (res.success) {
                                setCouponMessage({ text: res.message, isError: false });
                                setCouponInput('');
                              } else {
                                setCouponMessage({ text: res.message, isError: true });
                              }
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                              isApplied
                                ? 'bg-emerald-600 text-white cursor-default'
                                : isMinMet
                                ? 'bg-industrial-900 hover:bg-brand-600 text-white shadow-sm'
                                : 'bg-industrial-200 text-industrial-400 cursor-not-allowed'
                            }`}
                          >
                            {isApplied ? 'Applied' : 'Apply'}
                          </button>
                        </div>

                        <div className="pt-1.5 border-t border-industrial-100 flex items-center justify-between text-[10px]">
                          <span className="text-industrial-500">
                            Min Order: {formatINR(disc.minimumOrderAmount)}
                          </span>
                          <span className="text-emerald-700 font-bold">
                            Max Benefit: {formatINR(disc.maxDiscountAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Store Coupons */}
            {allCoupons.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-industrial-100">
                <div className="text-[11px] font-bold text-industrial-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-600" />
                  <span>All Store Coupons ({allCoupons.length})</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {allCoupons.map((coupon) => {
                    const isApplied =
                      cart.appliedCoupon?.code === coupon.code ||
                      cart.appliedCoupon === coupon.code;
                    const isMinMet = (cart.subtotal || 0) >= (coupon.minimumOrderAmount || 0);

                    return (
                      <div
                        key={coupon.couponId || coupon.code}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
                          isApplied
                            ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                            : 'bg-white border-industrial-200 hover:border-brand-300'
                        }`}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded text-[10px]">
                              {coupon.code}
                            </span>
                            <span className="text-[11px] font-semibold text-industrial-800">
                              {coupon.discountType === 'PERCENTAGE'
                                ? `${coupon.discountValue}% OFF`
                                : `${formatINR(coupon.discountValue)} OFF`}
                            </span>
                          </div>
                          <p className="text-[10px] text-industrial-500 truncate">
                            {coupon.description || `Min spend ${formatINR(coupon.minimumOrderAmount)}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isApplied}
                          onClick={async () => {
                            setCouponInput(coupon.code);
                            const res = await applyCoupon(coupon.code);
                            if (res.success) {
                              setCouponMessage({ text: res.message, isError: false });
                              setCouponInput('');
                            } else {
                              setCouponMessage({ text: res.message, isError: true });
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all ${
                            isApplied
                              ? 'bg-emerald-600 text-white cursor-default'
                              : isMinMet
                              ? 'bg-brand-600 hover:bg-brand-700 text-white'
                              : 'bg-industrial-100 text-industrial-600 hover:bg-industrial-200'
                          }`}
                        >
                          {isApplied ? 'Applied' : 'Apply'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs pt-2 border-t border-industrial-100">
              <div className="flex justify-between text-industrial-600">
                <span>Subtotal (Base Value):</span>
                <span className="font-semibold text-industrial-900 font-mono">{formatINR(cart.subtotal)}</span>
              </div>

              {((cart.couponDiscount || cart.discountTotal || 0) > 0 || cart.appliedCoupon) && (
                <div className="flex justify-between items-center text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      Coupon {cart.appliedCoupon?.code || (typeof cart.appliedCoupon === 'string' ? cart.appliedCoupon : 'Discount')}:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">-{formatINR(cart.couponDiscount || cart.discountTotal || 0)}</span>
                    <button
                      type="button"
                      onClick={() => removeCoupon()}
                      className="text-[10px] text-rose-500 hover:text-rose-700 underline font-normal cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {(cart.totalBulkDiscount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Bulk Tier Savings:</span>
                  <span className="font-mono">-{formatINR(cart.totalBulkDiscount || 0)}</span>
                </div>
              )}

              <div className="flex justify-between text-industrial-600">
                <span>GST Tax (CGST + SGST):</span>
                <span className="font-semibold text-industrial-900 font-mono">
                  {formatINR(cart.totalGst || cart.gstTotal || cart.taxTotal || 0)}
                </span>
              </div>

              <div className="flex justify-between text-industrial-600">
                <span>Freight & Transit Insurance:</span>
                <span className="font-semibold text-industrial-900 font-mono">
                  {(cart.deliveryCharge || cart.deliveryTotal || 0) === 0 ? 'FREE' : formatINR(cart.deliveryCharge || cart.deliveryTotal || 0)}
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
