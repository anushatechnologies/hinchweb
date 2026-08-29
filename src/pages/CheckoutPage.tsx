import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { orderApi } from '../api/orderApi';
import type { PaymentMethod, Address } from '../types';
import { formatINR } from '../utils/formatters';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Plus,
  QrCode,
  Landmark,
  Lock,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart } = useCartStore();
  const { user, addresses, addAddress } = useAuthStore();
  const { showToast } = useToastStore();

  const [deliveryAddressId, setDeliveryAddressId] = useState<string>(
    addresses[0]?.id || 'addr_1'
  );
  const [billingAddressId, setBillingAddressId] = useState<string>(
    addresses[2]?.id || addresses[0]?.id || 'addr_3'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pay_later');
  const [isProcessing, setIsProcessing] = useState(false);

  // New address modal state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrType, setNewAddrType] = useState<Address['addressType']>('Site / Project');
  const [newContactName, setNewContactName] = useState(user.name);
  const [newMobile, setNewMobile] = useState(user.phone);
  const [newCompany, setNewCompany] = useState(user.companyName);
  const [newGstin, setNewGstin] = useState(user.gstin);
  const [newLine1, setNewLine1] = useState('');
  const [newCity, setNewCity] = useState('Hyderabad');
  const [newState, setNewState] = useState('Telangana');
  const [newPincode, setNewPincode] = useState('500081');

  if (cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-industrial-900">Your Cart is Empty</h2>
        <p className="text-xs text-industrial-500">Please add materials to your cart before proceeding to checkout.</p>
        <Link
          to="/catalog"
          className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLine1.trim() || !newPincode.trim()) {
      showToast('error', 'Please fill in required address fields', 'Missing Details');
      return;
    }

    try {
      const added = await addAddress({
        contactName: newContactName,
        mobile: newMobile,
        companyName: newCompany,
        gstin: newGstin,
        addressLine1: newLine1,
        city: newCity,
        state: newState,
        pincode: newPincode,
        addressType: newAddrType,
        isDefaultDelivery: true,
        isDefaultBilling: false,
      });

      setDeliveryAddressId(added.id);
      setIsAddingAddress(false);
      showToast('success', `Added new site address: ${newCity} (${newPincode})`, 'Site Address Saved');
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to add address', 'Error');
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      const newOrder = await orderApi.placeOrder({
        addressId: selectedDelivery?.addressId || deliveryAddressId || 1,
        paymentMethod: (paymentMethod || 'RAZORPAY').toUpperCase(),
        deliverySlot: '2026-08-31 Morning (08:00 - 12:00)',
        deliveryInstructions: 'Deliver to project site with heavy vehicle trailer access.',
        poNumber: 'PO-APEX-2026-001',
        requiresCraneUnloading: true,
      });

      // Trigger Confetti Celebration
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast(
        'success',
        `Purchase Order #${newOrder.orderNumber} confirmed! E-Way bill & MTC allocated.`,
        'Order Placed Successfully'
      );

      navigate(`/order-confirmation/${newOrder.id}`);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      showToast('error', 'Failed to place order. Please try again.', 'Error');
    }
  };

  const selectedDelivery = addresses.find((a) => a.id === deliveryAddressId) || addresses[0];
  const selectedBilling = addresses.find((a) => a.id === billingAddressId) || addresses[2] || addresses[0];

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* Breadcrumbs & Header */}
      <div className="pb-4 border-b border-industrial-200">
        <div className="flex items-center gap-2 text-xs text-industrial-500 mb-1">
          <Link to="/" className="hover:text-industrial-900">Home</Link>
          <span>/</span>
          <Link to="/cart" className="hover:text-industrial-900">Cart</Link>
          <span>/</span>
          <span className="font-semibold text-industrial-800">B2B Checkout & Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-industrial-950">
          Enterprise B2B Checkout
        </h1>
        <p className="text-xs text-industrial-500 mt-0.5">
          GST-compliant material procurement with automated e-invoicing and direct site transit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Checkout Steps (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Select Delivery Site */}
          <div className="bg-white rounded-3xl border border-industrial-200 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-industrial-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-sm text-industrial-950">Delivery Destination / Project Site</h3>
                  <p className="text-[11px] text-industrial-500">
                    Heavy transport trailer accessible destination
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingAddress(true)}
                className="px-3 py-1.5 rounded-lg border border-brand-300 bg-brand-50 hover:bg-brand-100 text-brand-800 font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project Site</span>
              </button>
            </div>

            {/* Address Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map((addr) => {
                const isSelected = deliveryAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => setDeliveryAddressId(addr.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                        : 'border-industrial-200 hover:border-industrial-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-industrial-100 text-industrial-800">
                        {addr.addressType}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-600" />}
                    </div>

                    <div className="font-bold text-xs text-industrial-900">{addr.companyName}</div>
                    <div className="text-xs text-industrial-600 leading-relaxed">
                      {addr.addressLine1}, {addr.city}, {addr.state} - <strong className="font-mono text-industrial-900">{addr.pincode}</strong>
                    </div>
                    <div className="text-[11px] text-industrial-500 pt-1 border-t border-industrial-100 flex items-center justify-between">
                      <span>Attn: {addr.contactName}</span>
                      <span>Ph: {addr.mobile}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: GSTIN Billing Address for ITC Claim */}
          <div className="bg-white rounded-3xl border border-industrial-200 p-6 shadow-card space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-industrial-100">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h3 className="font-bold text-sm text-industrial-950">GSTIN Billing Details (for ITC)</h3>
                <p className="text-[11px] text-industrial-500">
                  Input Tax Credit (ITC) will be credited to this registered business GSTIN
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map((addr) => {
                const isSelected = billingAddressId === addr.id;
                return (
                  <div
                    key={`bill_${addr.id}`}
                    onClick={() => setBillingAddressId(addr.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-industrial-200 hover:border-industrial-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {addr.addressType}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>

                    <div className="font-bold text-xs text-industrial-900">{addr.companyName}</div>
                    <div className="text-xs font-mono font-bold text-brand-700">
                      GSTIN: {addr.gstin || user.gstin}
                    </div>
                    <div className="text-xs text-industrial-600 truncate">
                      {addr.addressLine1}, {addr.city}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Payment Options */}
          <div className="bg-white rounded-3xl border border-industrial-200 p-6 shadow-card space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-industrial-100">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <h3 className="font-bold text-sm text-industrial-950">Payment & Financing Terms</h3>
                <p className="text-[11px] text-industrial-500">
                  Select payment method or utilize your approved enterprise revolving credit
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Option 1: HinchMart PayLater (Recommended) */}
              <div
                onClick={() => setPaymentMethod('pay_later')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                  paymentMethod === 'pay_later'
                    ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20'
                    : 'border-industrial-200 hover:border-industrial-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-industrial-950">
                          HinchMart Enterprise PayLater (45 Days Credit)
                        </span>
                        <span className="text-[10px] font-extrabold bg-brand-500 text-white px-2 py-0.5 rounded-full">
                          APPROVED BUYER
                        </span>
                      </div>
                      <p className="text-[11px] text-industrial-500">
                        0% interest for 45 days. Automatic invoice factoring upon delivery.
                      </p>
                    </div>
                  </div>
                  {paymentMethod === 'pay_later' && (
                    <CheckCircle2 className="w-5 h-5 text-brand-600" />
                  )}
                </div>

                <div className="p-3 bg-white/90 rounded-xl border border-brand-200 text-xs space-y-2">
                  <div className="flex justify-between text-industrial-700">
                    <span>Revolving Credit Limit:</span>
                    <span className="font-bold">{formatINR(user.creditLimit)}</span>
                  </div>
                  <div className="flex justify-between text-industrial-700">
                    <span>Available Credit Balance:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatINR(user.creditAvailable)}
                    </span>
                  </div>
                  <div className="w-full bg-industrial-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${(user.creditAvailable / user.creditLimit) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Option 2: Corporate Netbanking & RTGS / NEFT */}
              <div
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20'
                    : 'border-industrial-200 hover:border-industrial-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-industrial-800 text-white flex items-center justify-center">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-industrial-950">
                        Corporate Netbanking & RTGS / NEFT (Dedicated Virtual Account)
                      </span>
                      <p className="text-[11px] text-industrial-500">
                        Generates unique HDFC / ICICI Virtual Escrow Account for your company
                      </p>
                    </div>
                  </div>
                  {paymentMethod === 'bank_transfer' && (
                    <CheckCircle2 className="w-5 h-5 text-brand-600" />
                  )}
                </div>
              </div>

              {/* Option 3: UPI / QR Code Instant Pay */}
              <div
                onClick={() => setPaymentMethod('upi')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20'
                    : 'border-industrial-200 hover:border-industrial-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-industrial-800 text-white flex items-center justify-center">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-industrial-950">
                        UPI QR Code (Google Pay, PhonePe, Paytm, BHIM)
                      </span>
                      <p className="text-[11px] text-industrial-500">
                        Instant payment confirmation with GST invoice generation
                      </p>
                    </div>
                  </div>
                  {paymentMethod === 'upi' && (
                    <CheckCircle2 className="w-5 h-5 text-brand-600" />
                  )}
                </div>
              </div>

              {/* Option 4: Business Credit / Debit Cards */}
              <div
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'card'
                    ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20'
                    : 'border-industrial-200 hover:border-industrial-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-industrial-800 text-white flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-industrial-950">
                        Corporate / Business Credit Cards (Visa, Mastercard, RuPay Corporate)
                      </span>
                      <p className="text-[11px] text-industrial-500">
                        Secure 256-bit encrypted checkout with commercial card rewards
                      </p>
                    </div>
                  </div>
                  {paymentMethod === 'card' && (
                    <CheckCircle2 className="w-5 h-5 text-brand-600" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Review & Confirmation Box (4 cols) */}
        <div className="lg:col-span-4 space-y-4 sticky top-24">
          <div className="bg-white p-6 rounded-3xl border border-industrial-200 shadow-card space-y-4">
            <h3 className="font-bold text-sm text-industrial-950 pb-2 border-b border-industrial-200">
              Procurement Order Summary
            </h3>

            {/* Line Items Preview */}
            <div className="max-h-48 overflow-y-auto divide-y divide-industrial-100 space-y-2 pr-1">
              {cart.items.map((item) => {
                const title = item.title || item.product?.title || 'Industrial Material';
                const unitPrice = item.selectedUnitPrice || item.unitPrice || item.price || 0;
                return (
                  <div key={item.id || item.productId} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-industrial-900 truncate">{title}</div>
                      <div className="text-[11px] text-industrial-500">
                        {item.quantity} {item.unit || 'Piece'} @ {formatINR(unitPrice)}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-industrial-950 shrink-0">
                      {formatINR(item.totalPrice)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Tax Breakdown */}
            <div className="space-y-2 text-xs pt-3 border-t border-industrial-200">
              <div className="flex justify-between text-industrial-600">
                <span>Taxable Value:</span>
                <span className="font-semibold text-industrial-900">{formatINR(cart.taxableAmount)}</span>
              </div>
              <div className="flex justify-between text-industrial-600">
                <span>Total GST (100% ITC Eligible):</span>
                <span className="font-semibold text-industrial-900">{formatINR(cart.totalGst)}</span>
              </div>
              <div className="flex justify-between text-industrial-600">
                <span>Site Transit Freight:</span>
                <span className="font-semibold text-emerald-700">
                  {cart.estimatedFreight === 0 ? 'FREE' : formatINR(cart.estimatedFreight)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-industrial-950 pt-2 border-t border-industrial-200">
                <span>Total Payable:</span>
                <span className="text-brand-600 font-mono text-xl">{formatINR(cart.grandTotal)}</span>
              </div>
            </div>

            {/* Selected Addresses Snapshot */}
            <div className="p-3 bg-industrial-50 rounded-xl border border-industrial-200/70 text-[11px] space-y-1">
              <div>
                <strong className="text-industrial-800">Dispatch Site:</strong>{' '}
                <span className="text-industrial-600">{selectedDelivery.city} ({selectedDelivery.pincode})</span>
              </div>
              <div>
                <strong className="text-industrial-800">ITC Claim GSTIN:</strong>{' '}
                <span className="font-mono text-brand-700 font-bold">{selectedBilling.gstin || user.gstin}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full py-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-xl shadow-brand-600/25 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              {isProcessing ? (
                <>Processing Purchase Order...</>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Place Order ({formatINR(cart.grandTotal)})</span>
                </>
              )}
            </button>

            <div className="text-[10px] text-center text-industrial-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant Tax Invoice & Mill Test Certificate Generation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Project Site Address */}
      {isAddingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-industrial-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-industrial-200">
            <div className="bg-industrial-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">Add New Project Site / Factory Address</h3>
              <button
                onClick={() => setIsAddingAddress(false)}
                className="text-industrial-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewAddress} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-industrial-700">Address Category</label>
                <select
                  value={newAddrType}
                  onChange={(e) => setNewAddrType(e.target.value as any)}
                  className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl font-medium"
                >
                  <option value="Site / Project">Site / Project Construction</option>
                  <option value="Warehouse / Factory">Warehouse / Factory Stockyard</option>
                  <option value="Office / Commercial">Commercial Corporate Office</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-industrial-700">Project / Company Name</label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-industrial-700">Site GSTIN (Optional)</label>
                <input
                  type="text"
                  value={newGstin}
                  onChange={(e) => setNewGstin(e.target.value)}
                  className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl font-medium font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-industrial-700">Address Line (Street, Site Gate, Plot)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plot 45, Industrial Mega Park Phase 3"
                  value={newLine1}
                  onChange={(e) => setNewLine1(e.target.value)}
                  className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-industrial-700">City</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-industrial-700">State</label>
                  <input
                    type="text"
                    required
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-industrial-700">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-industrial-700">Site Contact Person</label>
                  <input
                    type="text"
                    required
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-industrial-700">Site Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="px-4 py-2 rounded-xl border border-industrial-300 text-industrial-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold shadow-md shadow-brand-600/20"
                >
                  Save Site Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
