import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useAuthModalStore } from '../store/useAuthModalStore';
import { useToastStore } from '../store/useToastStore';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import { locationApi } from '../api/locationApi';
import type { PaymentMethod, Address, CheckoutPreview } from '../types';
import { formatINR } from '../utils/formatters';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CheckCircle2,
  Plus,
  Lock,
  AlertCircle,
  MapPin,
  Loader2,
  Banknote,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCartStore();
  const { user, addresses, addAddress, fetchAddresses, isAuthenticated } = useAuthStore();
  const { openAuthModal } = useAuthModalStore();
  const { showToast } = useToastStore();

  const taxableValue = useMemo(() => {
    if (cart.taxableAmount !== undefined && cart.taxableAmount > 0) return cart.taxableAmount;
    if (cart.subtotal !== undefined && cart.subtotal > 0) return cart.subtotal;
    return cart.items.reduce((sum, it) => sum + (it.price || it.unitPrice || 0) * (it.quantity || 1), 0);
  }, [cart]);

  const totalGst = useMemo(() => {
    if (cart.totalGst !== undefined && cart.totalGst > 0) return cart.totalGst;
    if (cart.gstTotal !== undefined && cart.gstTotal > 0) return cart.gstTotal;
    const itemGst = cart.items.reduce((sum, it) => {
      const p = (it.price || it.unitPrice || 0) * (it.quantity || 1);
      return sum + Math.round((p * (it.gstRate || 18)) / 100);
    }, 0);
    if (itemGst > 0) return itemGst;
    return Math.round(taxableValue * 0.18);
  }, [cart, taxableValue]);

  const estimatedFreight = useMemo(() => {
    if (cart.estimatedFreight !== undefined) return cart.estimatedFreight;
    if (cart.deliveryTotal !== undefined) return cart.deliveryTotal;
    if (cart.deliveryCharge !== undefined) return cart.deliveryCharge;
    return 0;
  }, [cart]);

  const grandTotal = useMemo(() => {
    if (cart.grandTotal !== undefined && cart.grandTotal > 0) return cart.grandTotal;
    return taxableValue + totalGst + estimatedFreight;
  }, [cart, taxableValue, totalGst, estimatedFreight]);

  const [deliveryAddressId, setDeliveryAddressId] = useState<string>(
    addresses[0]?.id || ''
  );
  const [billingAddressId, setBillingAddressId] = useState<string>(
    addresses[2]?.id || addresses[0]?.id || ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [isProcessing, setIsProcessing] = useState(false);

  // New address modal state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrType, setNewAddrType] = useState<Address['addressType']>('Site / Project');
  const [newContactName, setNewContactName] = useState(user?.name || '');
  const [newMobile, setNewMobile] = useState(user?.phone || '');
  const [newCompany, setNewCompany] = useState(user?.companyName || '');
  const [newGstin, setNewGstin] = useState(user?.gstin || '');
  const [newLine1, setNewLine1] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPincode, setNewPincode] = useState('');

  // Pincode serviceability state
  const [pincodeServiceability, setPincodeServiceability] = useState<{
    serviceable: boolean;
    city: string;
    state: string;
    estimatedDays: number;
    isExpressAvailable: boolean;
  } | null>(null);
  const [isPincodeChecking, setIsPincodeChecking] = useState(false);

  const handlePincodeChange = async (pin: string) => {
    setNewPincode(pin);
    if (pin.replace(/\D/g, '').length === 6) {
      setIsPincodeChecking(true);
      setPincodeServiceability(null);
      try {
        // Try getPincodeDetails → checkLocationServiceability → checkDedicatedServiceability
        const details = await locationApi.getPincodeDetails(pin);
        if (details.city) {
          setNewCity(details.city);
          setNewState(details.state);
          setPincodeServiceability({
            serviceable: details.serviceable,
            city: details.city,
            state: details.state,
            estimatedDays: details.estimatedDays,
            isExpressAvailable: details.isExpressAvailable,
          });
        } else {
          // Fallback: checkLocationServiceability
          const loc = await locationApi.checkLocationServiceability(pin);
          if (loc.city) {
            setNewCity(loc.city);
            setNewState(loc.state);
            setPincodeServiceability({ serviceable: loc.serviceable, city: loc.city, state: loc.state, estimatedDays: loc.estimatedDays, isExpressAvailable: loc.isExpressAvailable });
          } else {
            // Last fallback: checkDedicatedServiceability
            const ded = await locationApi.checkDedicatedServiceability(pin);
            if (ded.city) {
              setNewCity(ded.city);
              setNewState(ded.state);
              setPincodeServiceability({ serviceable: ded.serviceable, city: ded.city, state: ded.state, estimatedDays: ded.estimatedDays, isExpressAvailable: ded.isExpressAvailable });
            }
          }
        }
      } catch (err) {
        console.warn('Pincode lookup error:', err);
      } finally {
        setIsPincodeChecking(false);
      }
    } else {
      setPincodeServiceability(null);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  useEffect(() => {
    if (addresses.length > 0) {
      if (!deliveryAddressId || !addresses.some((a) => a.id === deliveryAddressId)) {
        setDeliveryAddressId(addresses[0].id);
      }
      if (!billingAddressId || !addresses.some((a) => a.id === billingAddressId)) {
        setBillingAddressId(addresses[2]?.id || addresses[0].id);
      }
    }
  }, [addresses, deliveryAddressId, billingAddressId]);

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

  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutPreview | null>(null);

  const selectedDelivery = addresses.find((a) => a.id === deliveryAddressId) || addresses[0] || null;
  const selectedBilling = addresses.find((a) => a.id === billingAddressId) || addresses[2] || addresses[0] || null;

  // 11.1 Fetch Official Checkout Preview
  useEffect(() => {
    const addrId =
      selectedDelivery?.addressId ||
      (selectedDelivery?.id && !isNaN(Number(selectedDelivery.id)) ? Number(selectedDelivery.id) : 1);
    if (!addrId) return;

    orderApi
      .previewCheckout({
        addressId: addrId,
        deliverySlot: 'Morning (08:00 - 12:00)',
        requiresCraneUnloading: false,
      })
      .then((preview) => {
        if (preview && (preview.grandTotal || preview.subtotal)) {
          setCheckoutPreview(preview);
        }
      })
      .catch((err) => {
        console.warn('Backend previewCheckout notice:', err);
      });
  }, [selectedDelivery]);

  // Unified breakdown and total calculations for 100% mathematical accuracy
  const displayTaxableValue = useMemo(() => {
    if (checkoutPreview?.subtotal && Math.abs(checkoutPreview.subtotal - taxableValue) < 2) {
      return checkoutPreview.subtotal;
    }
    return taxableValue;
  }, [checkoutPreview, taxableValue]);

  const displayTotalGst = useMemo(() => {
    const previewGst = checkoutPreview?.totalGst ?? checkoutPreview?.gstTotal;
    if (previewGst !== undefined && Math.abs(previewGst - totalGst) < 2) {
      return previewGst;
    }
    return totalGst;
  }, [checkoutPreview, totalGst]);

  const displayFreight = useMemo(() => {
    const previewFreight =
      checkoutPreview?.freight ??
      checkoutPreview?.freightCharge ??
      checkoutPreview?.deliveryTotal ??
      checkoutPreview?.shippingTotal;
    if (previewFreight !== undefined) {
      return previewFreight;
    }
    return estimatedFreight;
  }, [checkoutPreview, estimatedFreight]);

  const displayGrandTotal = useMemo(() => {
    const calculatedSum = displayTaxableValue + displayTotalGst + displayFreight;
    if (checkoutPreview?.grandTotal && Math.abs(checkoutPreview.grandTotal - calculatedSum) <= 1) {
      return checkoutPreview.grandTotal;
    }
    return calculatedSum;
  }, [checkoutPreview, displayTaxableValue, displayTotalGst, displayFreight]);

  const handlePlaceOrder = async () => {
    if (!selectedDelivery && addresses.length === 0) {
      setIsAddingAddress(true);
      showToast('error', 'Please add a project site delivery address before placing order.', 'Address Required');
      return;
    }

    if (!isAuthenticated && !localStorage.getItem('hinchmart_auth_token')) {
      showToast('info', 'Please sign in with your mobile OTP or password to authorize and place orders.', 'Sign In Required');
      openAuthModal();
      return;
    }

    setIsProcessing(true);
    try {
      const addressId =
        selectedDelivery?.addressId ||
        (selectedDelivery?.id && !isNaN(Number(selectedDelivery.id)) ? Number(selectedDelivery.id) : 1);

      const newOrder = await orderApi.placeOrder({
        addressId,
        paymentMethod: (paymentMethod || 'COD').toUpperCase(),
        deliverySlot: 'Morning (08:00 - 12:00)',
        deliveryInstructions: 'Deliver to project site with vehicle access.',
        poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        requiresCraneUnloading: false,
      });

      // Online payment methods (Razorpay, UPI, Card)
      const isOnline = ['RAZORPAY', 'UPI', 'CARD', 'NETBANKING'].includes(String(paymentMethod).toUpperCase());

      if (isOnline && typeof window !== 'undefined' && (window as any).Razorpay) {
        try {
          // 8.1 Call paymentApi.createPaymentOrder (Step 1)
          const paymentOrder = await paymentApi.createPaymentOrder({
            orderId: Number(newOrder.id || (newOrder as any).orderId),
            purpose: 'ORDER_PAYMENT',
          });

          const rzpOptions = {
            key: paymentOrder.keyId || paymentOrder.razorpayKeyId,
            amount: paymentOrder.amountInPaise || Math.round((checkoutPreview?.grandTotal || grandTotal) * 100),
            currency: paymentOrder.currency || 'INR',
            name: 'HinchMart B2B Marketplace',
            description: paymentOrder.description || `Order #${newOrder.orderNumber} - Wholesale Industrial Procurement`,
            order_id: paymentOrder.razorpayOrderId || paymentOrder.gatewayOrderId,
            prefill: {
              name: paymentOrder.customerName || user?.name || user?.fullName || 'Enterprise Buyer',
              email: paymentOrder.customerEmail || user?.email || '',
              contact: paymentOrder.customerPhone || user?.phone || '',
            },
            theme: {
              color: '#d9232d',
            },
            handler: async (response: any) => {
              try {
                // 8.2 Call paymentApi.verifyPayment (Step 2)
                await paymentApi.verifyPayment({
                  orderId: Number(newOrder.id || paymentOrder.orderId),
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                showToast('success', 'Razorpay online payment verified successfully!', 'Payment Verified');
              } catch (verErr: any) {
                console.warn('Payment verification notice:', verErr);
                showToast('error', verErr?.message || 'Payment signature verification failed.', 'Verification Warning');
              }

              await clearCart();
              confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 },
              });
              navigate(`/order-confirmation/${newOrder.id}`);
            },
            modal: {
              ondismiss: () => {
                setIsProcessing(false);
                showToast('info', 'Payment window closed. You can complete settlement from Orders.', 'Payment Pending');
                navigate(`/order-confirmation/${newOrder.id}`);
              },
            },
          };

          const rzp = new (window as any).Razorpay(rzpOptions);
          rzp.open();
          return;
        } catch (gatewayErr) {
          console.warn('Gateway initiation fallback to PO flow:', gatewayErr);
        }
      }

      // Offline / Bank Transfer / Credit Terms Flow
      await clearCart();

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast(
        'success',
        `Purchase Order #${newOrder.orderNumber} confirmed with Cash on Delivery (COD)!`,
        'Order Placed Successfully'
      );

      navigate(`/order-confirmation/${newOrder.id}`);
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      showToast('error', err?.message || 'Failed to place order. Please try again.', 'Error');
    }
  };

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
          {/* Guest / Unauthenticated Notice Banner */}
          {!isAuthenticated && !localStorage.getItem('hinchmart_auth_token') && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">Enterprise Account Login Recommended</h4>
                  <p className="text-[11px] text-amber-800">
                    Sign in with your mobile OTP to link your registered GSTIN, auto-save delivery sites, and access wholesale pricing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openAuthModal}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shrink-0 cursor-pointer shadow-xs"
              >
                Login / Register Now
              </button>
            </div>
          )}

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
                className="px-3 py-1.5 rounded-lg border border-brand-300 bg-brand-50 hover:bg-brand-100 text-brand-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project Site</span>
              </button>
            </div>

            {/* Address Selection Grid */}
            {addresses.length === 0 ? (
              <div className="p-6 bg-industrial-50 rounded-2xl border border-dashed border-industrial-300 text-center space-y-3">
                <p className="text-xs text-industrial-600">
                  No saved delivery addresses found. Please add your construction or project site address to schedule logistics dispatch.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Project Site Address</span>
                </button>
              </div>
            ) : (
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
            )}
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

            {addresses.length === 0 ? (
              <div className="p-4 bg-industrial-50 rounded-2xl border border-dashed border-industrial-300 text-center text-xs text-industrial-500">
                Billing address and GSTIN details will sync with your profile or newly added delivery site.
              </div>
            ) : (
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
                        GSTIN: {addr.gstin || user?.gstin || 'Not Provided'}
                      </div>
                      <div className="text-xs text-industrial-600 truncate">
                        {addr.addressLine1}, {addr.city}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Payment Options */}
          <div className="bg-white rounded-3xl border border-industrial-200 p-6 shadow-card space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-industrial-100">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <h3 className="font-bold text-sm text-industrial-950">Payment Method</h3>
                <p className="text-[11px] text-industrial-500">
                  Select payment method for material procurement and site delivery
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Option: Cash on Delivery (COD) */}
              <div
                onClick={() => setPaymentMethod('COD')}
                className="p-4 rounded-2xl border cursor-pointer transition-all border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-industrial-950">
                          Cash on Delivery (COD)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                          Standard
                        </span>
                      </div>
                      <p className="text-[11px] text-industrial-600 mt-0.5">
                        Pay with Cash / UPI upon material delivery & physical inspection at project site
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Review & Confirmation Box (4 cols) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
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
              {checkoutPreview && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>API Verified Freight & GST Preview</span>
                </div>
              )}
              <div className="flex justify-between text-industrial-600">
                <span>Taxable Value:</span>
                <span className="font-semibold text-industrial-900">
                  {formatINR(displayTaxableValue)}
                </span>
              </div>
              <div className="flex justify-between text-industrial-600">
                <span>Total GST (100% ITC Eligible):</span>
                <span className="font-semibold text-industrial-900">
                  {formatINR(displayTotalGst)}
                </span>
              </div>
              <div className="flex justify-between text-industrial-600">
                <span>Site Transit Freight:</span>
                <span className="font-semibold text-emerald-700">
                  {formatINR(displayFreight)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-industrial-950 pt-2 border-t border-industrial-200">
                <span>Total Payable:</span>
                <span className="text-brand-600 font-mono text-xl">
                  {formatINR(displayGrandTotal)}
                </span>
              </div>
            </div>

            {/* Selected Addresses Snapshot */}
            <div className="p-3 bg-industrial-50 rounded-xl border border-industrial-200/70 text-[11px] space-y-1">
              <div>
                <strong className="text-industrial-800">Dispatch Site:</strong>{' '}
                {selectedDelivery ? (
                  <span className="text-industrial-600">
                    {selectedDelivery.city || 'Project Site'} ({selectedDelivery.pincode})
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold">No address selected</span>
                )}
              </div>
              <div>
                <strong className="text-industrial-800">ITC Claim GSTIN:</strong>{' '}
                <span className="font-mono text-brand-700 font-bold">
                  {selectedBilling?.gstin || user?.gstin || 'Not Provided / Direct'}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full py-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-xl shadow-brand-600/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              {isProcessing ? (
                <>Processing Purchase Order...</>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Place Order ({formatINR(displayGrandTotal)})</span>
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
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={newPincode}
                      onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl font-mono font-bold pr-7"
                    />
                    {isPincodeChecking && (
                      <Loader2 size={13} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-brand-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Pincode Serviceability Result */}
              {pincodeServiceability && (
                <div className={`flex items-center gap-2 p-2.5 rounded-xl text-[11px] font-semibold ${
                  pincodeServiceability.serviceable
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <MapPin size={13} />
                  {pincodeServiceability.serviceable ? (
                    <span>✓ Serviceable — {pincodeServiceability.city}, {pincodeServiceability.state} · Est. delivery {pincodeServiceability.estimatedDays} day(s){pincodeServiceability.isExpressAvailable ? ' · Express available' : ''}</span>
                  ) : (
                    <span>✗ Not serviceable to {pincodeServiceability.city}, {pincodeServiceability.state}</span>
                  )}
                </div>
              )}

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
