import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useLocationStore } from '../store/useLocationStore';
import { formatINR } from '../utils/formatters';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Percent,
  ShoppingBag,
  ArrowLeft,
  MapPin,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeItem, clearCart } = useCartStore();
  const { city, pincode, openPincodeModal, isInterState } = useLocationStore();
  const navigate = useNavigate();

  if (cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-industrial-100 text-industrial-400 flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-industrial-950">Your Procurement Cart is Empty</h2>
          <p className="text-xs text-industrial-500 max-w-sm mx-auto">
            You currently have no industrial materials or equipment staged in your procurement cart.
          </p>
        </div>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-brand-600/25 transition-all"
        >
          <span>Explore Product Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* 1. Header & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-industrial-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-industrial-500 mb-1">
            <Link to="/" className="hover:text-industrial-900">Home</Link>
            <span>/</span>
            <span className="font-semibold text-industrial-800">Procurement Cart</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-industrial-950">
            Procurement Cart ({cart.items.length} {cart.items.length === 1 ? 'Material' : 'Materials'})
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={clearCart}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline"
          >
            Clear Entire Cart
          </button>
          <Link
            to="/catalog"
            className="px-4 py-2 bg-industrial-100 hover:bg-industrial-200 text-industrial-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Add More Items</span>
          </Link>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-industrial-200 p-5 shadow-card space-y-4"
            >
              <div className="flex gap-4">
                <img
                  src={item.product.images[0]}
                  alt={item.product.title}
                  className="w-24 h-24 object-cover rounded-xl border border-industrial-200 bg-industrial-50 shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                        {item.product.brand}
                      </span>
                      <h3 className="font-bold text-sm text-industrial-900 line-clamp-1 mt-0.5">
                        {item.product.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-industrial-400 hover:text-rose-600 p-1.5 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-industrial-500">
                    <span>HSN: <strong className="font-mono text-industrial-800">{item.product.hsnCode}</strong></span>
                    <span>•</span>
                    <span>GST Bracket: <strong className="text-industrial-800">{item.gstRate}%</strong></span>
                    <span>•</span>
                    <span>MOQ: {item.product.moq} {item.unit}s</span>
                  </div>

                  {item.bulkSavings > 0 && (
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <Percent className="w-3 h-3" />
                      Bulk Tier Discount: Saved {formatINR(item.bulkSavings)}
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity Stepper & Price Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-industrial-100 bg-industrial-50/60 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-industrial-700">Quantity:</span>
                  <div className="flex items-center bg-white border border-industrial-300 rounded-xl p-0.5 shadow-2xs">
                    <button
                      onClick={() => {
                        if (item.quantity <= 1) {
                          removeItem(item.id);
                        } else {
                          updateQuantity(item.id, item.quantity - 1);
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center text-industrial-700 hover:bg-industrial-100 rounded-lg cursor-pointer"
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
                      className="w-12 text-center font-mono font-bold text-xs text-industrial-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs font-semibold text-industrial-500 pr-2">
                      {item.unit}s
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-industrial-700 hover:bg-industrial-100 rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[11px] text-industrial-500">
                    @ {formatINR(item.selectedUnitPrice)} / {item.unit}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-industrial-500 block">Item Subtotal (Excl. Tax)</span>
                  <span className="text-base font-black text-industrial-950 font-mono">
                    {formatINR(item.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Order Summary & GST Breakdown (4 cols) */}
        <div className="lg:col-span-4 space-y-4 sticky top-24">
          {/* Destination Lead Time Card */}
          <div className="bg-white p-4 rounded-2xl border border-industrial-200 shadow-card flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
              <div>
                <div className="font-bold text-industrial-900">Delivery Destination</div>
                <div className="text-industrial-500 text-[11px]">{city} ({pincode})</div>
              </div>
            </div>
            <button
              onClick={openPincodeModal}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 underline"
            >
              Change
            </button>
          </div>

          {/* Tax Breakdown Card */}
          <div className="bg-white p-6 rounded-2xl border border-industrial-200 shadow-card space-y-4">
            <h3 className="font-bold text-sm text-industrial-950 pb-2 border-b border-industrial-200">
              Taxable Amount & GST Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-industrial-600">
                <span>Taxable Material Value:</span>
                <span className="font-mono font-semibold text-industrial-900">
                  {formatINR(cart.taxableAmount)}
                </span>
              </div>

              {cart.totalBulkDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <span>Total Volume Discount:</span>
                  <span className="font-mono">-{formatINR(cart.totalBulkDiscount)}</span>
                </div>
              )}

              {isInterState ? (
                <div className="flex justify-between text-industrial-600">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-mono font-semibold text-industrial-900">
                    {formatINR(cart.totalGst)}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-industrial-600">
                    <span>Central GST (CGST):</span>
                    <span className="font-mono font-semibold text-industrial-900">
                      {formatINR(cart.cgst)}
                    </span>
                  </div>
                  <div className="flex justify-between text-industrial-600">
                    <span>State GST (SGST):</span>
                    <span className="font-mono font-semibold text-industrial-900">
                      {formatINR(cart.sgst)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-industrial-600">
                <span>Estimated Freight & Handling:</span>
                <span className="font-semibold text-emerald-700">
                  {cart.estimatedFreight === 0 ? 'FREE SITE TRANSIT' : formatINR(cart.estimatedFreight)}
                </span>
              </div>

              <div className="flex justify-between text-base font-bold text-industrial-950 pt-3 border-t border-industrial-200">
                <span>Total Amount (INR):</span>
                <span className="text-brand-600 font-mono text-xl">{formatINR(cart.grandTotal)}</span>
              </div>
            </div>

            {/* B2B Input Tax Credit info */}
            <div className="p-3 bg-brand-50/70 border border-brand-200 rounded-xl text-[11px] text-brand-950 space-y-1">
              <div className="font-bold flex items-center gap-1 text-brand-800">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>100% GST Input Tax Credit (ITC)</span>
              </div>
              <p className="text-brand-900/80 leading-relaxed">
                Eligible for full ITC rebate of {formatINR(cart.totalGst)} with authentic GSTR-1 auto-populated e-invoice.
              </p>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>Proceed to B2B Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
