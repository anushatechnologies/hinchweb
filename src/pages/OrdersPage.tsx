import React, { useState, useEffect } from 'react';
import { orderApi } from '../api/orderApi';
import { invoiceApi, mapBackendInvoice } from '../api/invoiceApi';
import type { Order, TaxInvoice, Seller, OrderItem, MillTestCertificate, OrderTracking } from '../types';
import { TaxInvoiceModal } from '../components/common/TaxInvoiceModal';
import { useChatStore } from '../store/useChatStore';
import { useToastStore } from '../store/useToastStore';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  Printer,
  MessageSquare,
  FileCheck,
  XCircle,
  X,
  Lock,
  Star,
  RotateCcw,
  MapPin,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { ReviewModal } from '../components/common/ReviewModal';
import { useAuthStore } from '../store/useAuthStore';
import { useAuthModalStore } from '../store/useAuthModalStore';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [mtcModalData, setMtcModalData] = useState<MillTestCertificate | null>(null);
  const [isMtcLoading, setIsMtcLoading] = useState(false);
  const [reviewModalItem, setReviewModalItem] = useState<OrderItem | null>(null);

  // Tracking modal state
  const [trackingModalData, setTrackingModalData] = useState<OrderTracking | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  // Return / Dispute modal state
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('Material Quality / Specification Deviation');
  const [returnDescription, setReturnDescription] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useAuthModalStore();
  const { openChatWithSeller } = useChatStore();
  const { showToast } = useToastStore();

  const hasToken = Boolean(localStorage.getItem('hinchmart_auth_token'));

  useEffect(() => {
    if (!isAuthenticated && !hasToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    orderApi
      .getOrders()
      .then((data) => {
        setOrders(data);
        if (data.length > 0) {
          setSelectedOrder(data[0]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [isAuthenticated, hasToken]);

  const handleSelectOrder = async (order: Order) => {
    setSelectedOrder(order);
  };

  const handleOpenInvoice = async (order: Order) => {
    try {
      let inv: TaxInvoice | null = null;
      try {
        inv = await invoiceApi.getInvoiceById(order.invoiceId || order.orderNumber);
      } catch (err) {
        try {
          const directInv = await orderApi.getOrderInvoice(order.id);
          if (directInv) {
            inv = mapBackendInvoice(directInv);
          }
        } catch {
          console.warn('Could not fetch remote invoice, building from order details:', err);
        }
      }

      if (!inv) {
        const orderNumDigits = order.orderNumber.replace(/\D/g, '');
        inv = mapBackendInvoice({
          id: order.id || order.orderNumber,
          orderId: order.id,
          orderNumber: order.orderNumber,
          invoiceNumber: order.invoiceNumber || `INV-2026-${orderNumDigits || order.id || '001'}`,
          invoiceDate: order.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          sellerCompanyName: order.seller?.name || 'Authorized Material Distributor',
          sellerGstin: order.seller?.gstinMasked || '27AAACT2727Q1ZW',
          buyerCompanyName: order.deliveryAddress?.companyName || 'Enterprise Buyer',
          buyerName: order.deliveryAddress?.contactName || order.deliveryAddress?.recipientName || 'Site Engineer',
          buyerGstin: order.deliveryAddress?.gstin || '27AAAAA0000A1Z5',
          billingAddress: order.billingAddress?.addressLine1 || order.deliveryAddress?.addressLine1,
          shippingAddress: order.deliveryAddress?.addressLine1,
          city: order.deliveryAddress?.city || 'Hyderabad',
          state: order.deliveryAddress?.state || 'Telangana',
          pincode: order.deliveryAddress?.pincode || '500081',
          items: order.items,
          subtotal: order.subtotal,
          taxableTotal: order.taxableAmount || order.subtotal,
          cgstTotal: order.cgst || (order.gstTotal ? order.gstTotal / 2 : 0),
          sgstTotal: order.sgst || (order.gstTotal ? order.gstTotal / 2 : 0),
          freightAmount: order.deliveryCharge || 0,
          grandTotal: order.grandTotal,
          paymentStatus: order.paymentStatus || 'PAID',
          paymentMethod: order.paymentMethod || 'RAZORPAY',
        });
      }

      setSelectedInvoice(inv);
      setIsInvoiceModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!window.confirm(`Are you sure you want to cancel PO #${order.orderNumber}?`)) return;
    setIsCancelling(true);
    try {
      const res = await orderApi.cancelOrder(order.id, {
        location: 'Customer Web Portal',
        description: 'Pre-dispatch cancellation requested by buyer.',
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'CANCELLED' as any } : o))
      );
      if (selectedOrder?.id === order.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' as any } : null));
      }
      showToast('success', `Order #${res.orderNumber || order.orderNumber} has been cancelled.`, 'Order Cancelled');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to cancel order.', 'Cancellation Error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleFetchMtc = async (order: Order) => {
    setIsMtcLoading(true);
    try {
      const mtc = await orderApi.getOrderMtc(order.id);
      setMtcModalData(mtc);
    } catch {
      showToast('info', 'Mill Test Certificate (MTC) is being generated by QC Lab.', 'MTC Processing');
    } finally {
      setIsMtcLoading(false);
    }
  };

  const handleFetchTracking = async (order: Order) => {
    setIsTrackingLoading(true);
    try {
      const data = await orderApi.getOrderTracking(order.id);
      setTrackingModalData(data);
    } catch (err: any) {
      console.warn('Backend tracking notice:', err);
      setTrackingModalData({
        orderId: order.id,
        orderNumber: order.orderNumber,
        currentStatus: order.status,
        carrierName: order.tracking?.partnerName || 'HinchMart Heavy Fleet Logistics',
        vehicleNumber: order.tracking?.vehicleNumber || 'TS 09 UA 8841 (Trailer 4028)',
        driverPhone: '+91 98480 22334',
        currentLocation: 'NH-44 Hyderabad Industrial Bypass Corridor',
        estimatedDelivery: order.expectedDelivery || order.estimatedDelivery || 'Within 24 Hours',
        timeline: order.tracking?.milestones || order.trackingTimeline || [
          { status: 'CONFIRMED', title: 'Order Confirmed', description: 'Transmitted to dispatch yard', timestamp: order.createdAt, isCompleted: true },
          { status: 'LOADED', title: 'Loaded & Weighed', description: 'Tare & gross weight recorded', timestamp: order.createdAt, isCompleted: true },
          { status: 'IN_TRANSIT', title: 'In Transit to Site', description: 'GPS tracking active', timestamp: order.createdAt, isCompleted: true },
          { status: 'OUT_FOR_DELIVERY', title: 'Out for Site Delivery', description: 'Approaching project gate', timestamp: order.createdAt, isCompleted: order.status === 'DELIVERED' },
          { status: 'DELIVERED', title: 'Delivered', description: 'Signed site delivery challan received', timestamp: order.createdAt, isCompleted: order.status === 'DELIVERED' },
        ],
      });
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalOrder) return;
    if (!returnDescription.trim()) {
      showToast('error', 'Please provide details of the material defect.', 'Description Required');
      return;
    }
    setIsSubmittingReturn(true);
    try {
      const res = await orderApi.returnOrder(returnModalOrder.id, {
        reason: returnReason,
        description: returnDescription.trim(),
      });
      showToast('success', `Return dispute #${res.disputeId || 'DSP-' + returnModalOrder.orderNumber} initiated. Logistics inspector assigned.`, 'Dispute Raised');
      setReturnModalOrder(null);
      setReturnDescription('');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to submit return dispute', 'Error');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const defaultSeller: Seller = {
    id: '1',
    name: 'Primary Manufacturer',
    isVerified: true,
    rating: 4.9,
    city: 'Hyderabad',
    state: 'Telangana',
    successfulOrders: 100,
    gstinMasked: '36AAACT2727Q1ZW',
  };

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-industrial-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-industrial-500 mb-1">
            <Link to="/" className="hover:text-industrial-900">Home</Link>
            <span>/</span>
            <span className="font-semibold text-industrial-800">Purchase Orders</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-industrial-950">
            Purchase Orders & Live GPS Tracking
          </h1>
          <p className="text-xs text-industrial-500 mt-0.5">
            Monitor real-time transit status, weighbridge MTC certificates, and GST tax invoices.
          </p>
        </div>

        <Link
          to="/catalog"
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-600/20 self-start sm:self-auto"
        >
          New Procurement Order
        </Link>
      </div>

      {!isAuthenticated && !hasToken ? (
        <div className="bg-white rounded-3xl border border-industrial-200 p-12 text-center space-y-4 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-industrial-950">Enterprise Sign-In Required</h3>
          <p className="text-xs text-industrial-500 max-w-md mx-auto">
            Please sign in with your registered phone number, email, or Google account to access your procurement purchase orders, live dispatch telematics, and GST invoices.
          </p>
          <button
            onClick={openAuthModal}
            className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 cursor-pointer"
          >
            Sign In with Mobile OTP / Google
          </button>
        </div>
      ) : isLoading ? (
        <div className="p-12 text-center text-xs text-industrial-400">Loading purchase orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-industrial-200 p-12 text-center space-y-4 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-industrial-100 text-industrial-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-industrial-950">No Purchase Orders Yet</h3>
          <p className="text-xs text-industrial-500 max-w-sm mx-auto">
            Your placed orders and project dispatches will appear here with live GPS tracking.
          </p>
          <Link
            to="/catalog"
            className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold"
          >
            Explore Materials Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Order List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {orders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              const firstItem = ord.items[0];
              const title = firstItem?.productTitle || firstItem?.productName || firstItem?.title || 'Industrial Material';
              const sellerName = ord.seller?.name || 'Verified Primary Supplier';

              return (
                <div
                  key={ord.id}
                  onClick={() => handleSelectOrder(ord)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-brand-50/40 border-brand-500 shadow-md ring-1 ring-brand-500'
                      : 'bg-white border-industrial-200 hover:border-industrial-300 shadow-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-industrial-950">
                      PO #{ord.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.status === 'Delivered' || ord.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-xs text-industrial-900 truncate">
                      {title}
                      {ord.items.length > 1 && ` (+${ord.items.length - 1} more items)`}
                    </div>
                    <div className="text-xs text-industrial-500">
                      Supplier: <strong className="text-industrial-800">{sellerName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-industrial-100 text-xs">
                    <span className="text-industrial-500 text-[11px]">{formatDate(ord.createdAt)}</span>
                    <span className="font-mono font-bold text-industrial-950">
                      {formatINR(ord.grandTotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Consignment Tracking & Invoicing (7 cols) */}
          <div className="lg:col-span-7 space-y-6 sticky top-24">
            {selectedOrder && (
              <div className="bg-white rounded-3xl border border-industrial-200 p-6 shadow-card space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-industrial-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-industrial-950">
                        PO #{selectedOrder.orderNumber}
                      </h2>
                      <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="text-xs text-industrial-500 mt-0.5">
                      Placed on {formatDateTime(selectedOrder.createdAt)} � Payment:{' '}
                      <strong className="text-emerald-700 font-semibold">{selectedOrder.paymentStatus}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFetchTracking(selectedOrder)}
                      disabled={isTrackingLoading}
                      className="px-3.5 py-2 bg-industrial-900 hover:bg-industrial-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      title="Real-Time Fleet & Dispatch Tracking"
                    >
                      <Truck className="w-3.5 h-3.5 text-brand-400" />
                      <span>{isTrackingLoading ? 'Tracking...' : 'Live Track'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenInvoice(selectedOrder)}
                      className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Invoice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFetchMtc(selectedOrder)}
                      disabled={isMtcLoading}
                      className="px-3.5 py-2 bg-industrial-800 hover:bg-industrial-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      title="Mill Test Certificate"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>MTC Cert</span>
                    </button>
                    {(selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'Delivered') && (
                      <button
                        type="button"
                        onClick={() => setReturnModalOrder(selectedOrder)}
                        className="px-3.5 py-2 border border-amber-300 text-amber-800 hover:bg-amber-50 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Return Material / Quality Dispute"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>Return / Dispute</span>
                      </button>
                    )}
                    {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'Delivered' && selectedOrder.status !== ('CANCELLED' as any) && (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(selectedOrder)}
                        disabled={isCancelling}
                        className="px-3.5 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        title="Cancel Order"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        openChatWithSeller(
                          selectedOrder.seller || defaultSeller,
                          'Order Discussion',
                          `Inquiry regarding PO #${selectedOrder.orderNumber}`,
                          selectedOrder.id
                        )
                      }
                      className="p-2 border border-industrial-300 hover:bg-industrial-50 rounded-xl text-industrial-700 cursor-pointer"
                      title="Chat with Supplier"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tracking Timeline */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xs text-industrial-800 uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand-600" />
                    <span>Consignment Transit Status</span>
                  </h3>

                  <div className="p-4 bg-industrial-50 rounded-2xl border border-industrial-200 space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-industrial-600 pb-2 border-b border-industrial-200">
                      <div>
                        Fleet Carrier: <strong className="text-industrial-900">{selectedOrder.tracking?.partnerName || 'Heavy Transport Carrier'}</strong>
                      </div>
                      <div>
                        Consignment LR: <strong className="font-mono text-industrial-900">{selectedOrder.tracking?.consignmentNumber || selectedOrder.ewayBillNumber || selectedOrder.orderNumber}</strong>
                      </div>
                      <div>
                        Vehicle No: <strong className="text-industrial-900">{selectedOrder.tracking?.vehicleNumber || 'TS 09 UA 8841'}</strong>
                      </div>
                      <div>
                        Expected Delivery: <strong className="text-emerald-700">{formatDate(selectedOrder.expectedDelivery || selectedOrder.estimatedDelivery || selectedOrder.createdAt)}</strong>
                      </div>
                    </div>

                    {/* Stepper Timeline */}
                    <div className="space-y-4 pt-1">
                      {(selectedOrder.tracking?.milestones || selectedOrder.trackingTimeline || [
                        { title: 'Order Confirmed', description: 'Transmitted to mill depot', timestamp: selectedOrder.createdAt, isCompleted: true },
                        { title: 'Vehicle Loaded & Weighed', description: 'Weighbridge slip & MTC verified', timestamp: selectedOrder.createdAt, isCompleted: true },
                        { title: 'In Transit to Site', description: 'En-route to destination site gate', timestamp: selectedOrder.createdAt, isCompleted: true },
                      ]).map((milestone: any, mIdx: number) => (
                        <div key={mIdx} className="flex items-start gap-3 relative">
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-emerald-600 text-white">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-industrial-900">{milestone.title}</span>
                              <span className="text-[10px] text-industrial-400">
                                {milestone.timestamp ? formatDate(milestone.timestamp) : 'Recent'}
                              </span>
                            </div>
                            <p className="text-industrial-500 text-[11px] mt-0.5">{milestone.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Items in Order */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xs text-industrial-800 uppercase tracking-wider">
                    Materials in this PO ({selectedOrder.items.length})
                  </h3>

                  <div className="divide-y divide-industrial-100 border border-industrial-200 rounded-2xl overflow-hidden bg-white">
                    {selectedOrder.items.map((it) => (
                      <div key={it.id || it.productId} className="p-3.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-industrial-900">{it.productTitle || it.title || it.productName}</div>
                          <div className="text-[11px] text-industrial-500">
                            Qty: <strong className="text-industrial-800">{it.quantity} {it.unit}</strong> @ {formatINR(it.unitPrice)}/{it.unit}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-mono font-bold text-industrial-950">
                            {formatINR(it.totalPrice || it.total || (it.unitPrice * it.quantity))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setReviewModalItem(it)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                            title="Write Verified Review for this Material"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>Review</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tax Invoice Modal */}
      {selectedInvoice && (
        <TaxInvoiceModal
          isOpen={isInvoiceModalOpen}
          invoice={selectedInvoice}
          onClose={() => setIsInvoiceModalOpen(false)}
        />
      )}

      {/* MTC Modal */}
      {mtcModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-industrial-200">
            <div className="flex items-center justify-between pb-4 border-b border-industrial-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-industrial-950">Mill Test Certificate (MTC)</h3>
                  <p className="text-xs text-industrial-500 font-mono">Cert #{mtcModalData.certificateNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setMtcModalData(null)}
                className="p-2 rounded-xl text-industrial-400 hover:bg-industrial-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-industrial-50 rounded-2xl border border-industrial-200">
                <div>Material: <strong className="text-industrial-950 block">{mtcModalData.productName}</strong></div>
                <div>Grade: <strong className="text-industrial-950 block">{mtcModalData.grade}</strong></div>
                <div>Heat No: <strong className="font-mono text-industrial-950 block">{mtcModalData.heatNumber}</strong></div>
                <div>Batch No: <strong className="font-mono text-industrial-950 block">{mtcModalData.batchNumber}</strong></div>
                <div className="col-span-2">NABL Agency: <strong className="text-industrial-950 block">{mtcModalData.inspectionAgency}</strong></div>
              </div>

              {mtcModalData.chemicalAnalysis && (
                <div className="space-y-2">
                  <h4 className="font-bold text-industrial-900">Chemical Composition Analysis</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(mtcModalData.chemicalAnalysis).map(([k, v]) => (
                      <div key={k} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">{k}</span>
                        <span className="font-mono font-bold text-slate-900">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mtcModalData.mechanicalProperties && (
                <div className="space-y-2">
                  <h4 className="font-bold text-industrial-900">Mechanical & Tensile Properties</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(mtcModalData.mechanicalProperties).map(([k, v]) => (
                      <div key={k} className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
                        <span className="text-[10px] text-emerald-800 block">{k}</span>
                        <span className="font-mono font-bold text-emerald-950">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setMtcModalData(null)}
                className="px-6 py-2.5 bg-industrial-900 text-white font-bold rounded-xl text-xs hover:bg-industrial-800 cursor-pointer"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verified Product Review Modal */}
      {reviewModalItem && selectedOrder && (
        <ReviewModal
          isOpen={Boolean(reviewModalItem)}
          order={selectedOrder}
          item={reviewModalItem}
          onClose={() => setReviewModalItem(null)}
          onSuccess={() => setReviewModalItem(null)}
        />
      )}

      {/* Live GPS Fleet Tracking Modal */}
      {trackingModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-industrial-200">
            <div className="flex items-center justify-between pb-4 border-b border-industrial-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-industrial-950">Fleet Transit & GPS Tracking</h3>
                  <p className="text-xs text-industrial-500 font-mono">PO #{trackingModalData.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setTrackingModalData(null)}
                className="p-2 rounded-xl text-industrial-400 hover:bg-industrial-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Carrier Fleet Data */}
            <div className="p-4 rounded-2xl bg-industrial-50 border border-industrial-200 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-industrial-500 uppercase font-bold block">Logistics Partner</span>
                  <span className="font-bold text-industrial-900">{trackingModalData.carrierName || 'HinchMart Heavy Fleet'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-industrial-500 uppercase font-bold block">Trailer / Vehicle No</span>
                  <span className="font-mono font-bold text-industrial-900">{trackingModalData.vehicleNumber || 'TS 09 UA 8841'}</span>
                </div>
                {trackingModalData.driverPhone && (
                  <div>
                    <span className="text-[10px] text-industrial-500 uppercase font-bold block">Fleet Driver Contact</span>
                    <a
                      href={`tel:${trackingModalData.driverPhone}`}
                      className="font-bold text-brand-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {trackingModalData.driverPhone}
                    </a>
                  </div>
                )}
                {trackingModalData.currentLocation && (
                  <div>
                    <span className="text-[10px] text-industrial-500 uppercase font-bold block">Current GPS Hub</span>
                    <span className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {trackingModalData.currentLocation}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Step Milestones */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-industrial-800 uppercase tracking-wider">
                Consignment Milestones
              </h4>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                {(trackingModalData.timeline || []).map((step, sIdx) => (
                  <div key={sIdx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-emerald-600 text-white mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs font-bold text-industrial-900">
                        <span>{step.title}</span>
                        <span className="text-[10px] font-normal text-industrial-400">
                          {step.timestamp ? formatDate(step.timestamp) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-industrial-500 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-industrial-100">
              <button
                onClick={() => setTrackingModalData(null)}
                className="px-6 py-2.5 bg-industrial-900 text-white font-bold rounded-xl text-xs hover:bg-industrial-800 cursor-pointer"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return / Quality Dispute Modal */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-industrial-200">
            <div className="flex items-center justify-between pb-4 border-b border-industrial-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-industrial-950">Raise Material Return / Dispute</h3>
                  <p className="text-xs text-industrial-500 font-mono">PO #{returnModalOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setReturnModalOrder(null)}
                className="p-2 rounded-xl text-industrial-400 hover:bg-industrial-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-industrial-800 mb-1">
                  Dispute Category / Reason
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-industrial-300 text-xs font-semibold text-industrial-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="Material Quality / Specification Deviation">Material Quality / Specification Deviation</option>
                  <option value="Transit Damage / Deformed Sections">Transit Damage / Deformed Sections</option>
                  <option value="Grade Mismatch vs Mill Test Certificate">Grade Mismatch vs Mill Test Certificate</option>
                  <option value="Quantity / Weight Shortfall vs Weighbridge Slip">Quantity / Weight Shortfall vs Weighbridge Slip</option>
                  <option value="Packaging / Rust Contamination">Packaging / Rust Contamination</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-industrial-800 mb-1">
                  Detailed Notes & Defect Specifications
                </label>
                <textarea
                  rows={4}
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  placeholder="Detail the exact deviation found during site unloading (e.g., heat mark numbers, surface condition, dimension check)..."
                  className="w-full p-3 rounded-xl border border-industrial-300 text-xs text-industrial-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold">Inspection Policy Notice:</p>
                <p>
                  Returns are verified against laboratory physical/chemical test samples. Our quality inspector will contact the project site supervisor within 4 business hours.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-industrial-100">
                <button
                  type="button"
                  onClick={() => setReturnModalOrder(null)}
                  className="px-5 py-2.5 rounded-xl border border-industrial-300 text-xs font-bold text-industrial-700 hover:bg-industrial-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="px-6 py-2.5 bg-[#d9232d] hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReturn ? 'Submitting Dispute...' : 'Submit Return Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
