import React, { useState, useEffect } from 'react';
import { orderApi } from '../api/orderApi';
import { invoiceApi, mapBackendInvoice } from '../api/invoiceApi';
import type { Order, TaxInvoice } from '../types';
import { TaxInvoiceModal } from '../components/common/TaxInvoiceModal';
import { useChatStore } from '../store/useChatStore';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  Printer,
  MessageSquare,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { openChatWithSeller } = useChatStore();

  useEffect(() => {
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
  }, []);

  const handleSelectOrder = async (order: Order) => {
    setSelectedOrder(order);
  };

  const handleOpenInvoice = async (order: Order) => {
    try {
      let inv: TaxInvoice | null = null;
      try {
        inv = await invoiceApi.getInvoiceById(order.invoiceId || order.orderNumber);
      } catch (err) {
        console.warn('Could not fetch remote invoice, building from order details:', err);
      }

      if (!inv) {
        const orderNumDigits = order.orderNumber.replace(/\D/g, '');
        inv = mapBackendInvoice({
          id: order.id || order.orderNumber,
          orderId: order.id,
          orderNumber: order.orderNumber,
          invoiceNumber: `INV-2026-${orderNumDigits.slice(-6) || '000115'}`,
          invoiceDate: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : '2026-08-22',
          taxableValue: order.taxableAmount || order.subtotal,
          cgstAmount: order.cgst,
          sgstAmount: order.sgst,
          igstAmount: order.igst,
          grandTotal: order.grandTotal,
          paymentStatus: order.paymentStatus || 'PAID',
          paymentMethod: order.paymentMethod || 'UPI Instant Verification',
          buyerCompanyName: order.billingAddress?.companyName || 'Apex Infra Projects Pvt Ltd',
          buyerName: order.billingAddress?.contactName || 'Rajesh Sharma',
          buyerGstin: order.billingAddress?.gstin || '27AAAAA0000A1Z5',
          shippingAddress: order.deliveryAddress?.addressLine1 || 'Plot 45, MIDC Industrial Area, Phase 2, Pune',
          billingAddress: order.billingAddress?.addressLine1 || 'Plot 45, MIDC Industrial Area, Phase 2, Pune',
          sellerCompanyName: order.seller?.name || 'Tata Steel Distribution Hub Pvt Ltd',
          sellerGstin: order.seller?.gstinMasked || '27AAACT2727Q1ZW',
          city: order.deliveryAddress?.city || 'Pune',
          state: order.deliveryAddress?.state || 'Maharashtra',
          pincode: order.deliveryAddress?.pincode || '411057',
        });
      }

      setSelectedInvoice(inv);
      setIsInvoiceModalOpen(true);
    } catch (e) {
      console.error('Invoice open failed:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-semibold text-industrial-500">Loading purchase orders & live tracking data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* 1. Header */}
      <div className="pb-4 border-b border-industrial-200">
        <div className="flex items-center gap-2 text-xs text-industrial-500 mb-1">
          <Link to="/" className="hover:text-industrial-900">Home</Link>
          <span>/</span>
          <span className="font-semibold text-industrial-800">Purchase Orders & Consignment Tracking</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-industrial-950">
          Purchase Orders & Consignments
        </h1>
        <p className="text-xs text-industrial-500 mt-0.5">
          Live milestone tracking, weighbridge test slips, and GST tax invoice repository.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-industrial-200 p-12 text-center space-y-4 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-industrial-100 text-industrial-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-industrial-950">No orders placed yet</h3>
          <p className="text-xs text-industrial-500 max-w-sm mx-auto">
            Start procuring construction materials or industrial machinery directly from verified manufacturers.
          </p>
          <Link
            to="/catalog"
            className="inline-block px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Orders List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold text-industrial-500 uppercase tracking-wider px-1">
              Active & Past Purchase Orders ({orders.length})
            </div>

            {orders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              return (
                <div
                  key={ord.id}
                  onClick={() => handleSelectOrder(ord)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                    isSelected
                      ? 'border-brand-500 bg-white shadow-card ring-2 ring-brand-500/20'
                      : 'border-industrial-200 bg-white hover:border-industrial-300 shadow-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-industrial-900">
                      PO #{ord.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : ord.status === 'In Transit'
                          ? 'bg-sky-50 text-sky-800 border border-sky-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-xs text-industrial-900 truncate">
                      {ord.items[0]?.productTitle}
                      {ord.items.length > 1 && ` (+${ord.items.length - 1} more items)`}
                    </div>
                    <div className="text-xs text-industrial-500">
                      Supplier: <strong className="text-industrial-800">{ord.seller.name}</strong>
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
                      Placed on {formatDateTime(selectedOrder.createdAt)} • Payment:{' '}
                      <strong className="text-emerald-700 font-semibold">{selectedOrder.paymentStatus}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenInvoice(selectedOrder)}
                      className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Tax Invoice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        openChatWithSeller(
                          selectedOrder.seller,
                          'Order Discussion',
                          `Inquiry regarding PO #${selectedOrder.orderNumber}`,
                          selectedOrder.id
                        )
                      }
                      className="p-2 border border-industrial-300 hover:bg-industrial-50 rounded-xl text-industrial-700"
                      title="Chat with Supplier"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Milestone Stepper */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xs text-industrial-800 uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand-600" />
                    <span>Live Consignment Tracking</span>
                  </h3>

                  <div className="p-4 bg-industrial-50 rounded-2xl border border-industrial-200 space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-industrial-600 pb-2 border-b border-industrial-200">
                      <div>
                        Carrier: <strong className="text-industrial-900">{selectedOrder.tracking.partnerName}</strong>
                      </div>
                      <div>
                        Consignment LR: <strong className="font-mono text-industrial-900">{selectedOrder.tracking.consignmentNumber}</strong>
                      </div>
                      <div>
                        Vehicle: <strong className="text-industrial-900">{selectedOrder.tracking.vehicleNumber}</strong>
                      </div>
                      <div>
                        Expected Delivery: <strong className="text-emerald-700">{formatDate(selectedOrder.expectedDelivery)}</strong>
                      </div>
                    </div>

                    {/* Stepper Timeline */}
                    <div className="space-y-4 pt-1">
                      {selectedOrder.tracking.milestones.map((milestone, mIdx) => (
                        <div key={mIdx} className="flex items-start gap-3 relative">
                          <div className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                milestone.completed
                                  ? 'bg-emerald-600 text-white'
                                  : milestone.current
                                  ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                                  : 'bg-industrial-200 text-industrial-500'
                              }`}
                            >
                              {milestone.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : mIdx + 1}
                            </div>
                            {mIdx < selectedOrder.tracking.milestones.length - 1 && (
                              <div
                                className={`w-0.5 h-10 ${
                                  milestone.completed ? 'bg-emerald-500' : 'bg-industrial-200'
                                }`}
                              ></div>
                            )}
                          </div>

                          <div className="flex-1 text-xs space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-industrial-900">{milestone.title}</span>
                              <span className="text-[10px] text-industrial-400 font-mono">
                                {milestone.timestamp}
                              </span>
                            </div>
                            <p className="text-[11px] text-industrial-600 leading-relaxed">
                              {milestone.description}
                            </p>
                            <span className="text-[10px] text-industrial-400 block font-medium">
                              Location: {milestone.location}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Items & Delivery Summary */}
                <div className="space-y-3 pt-2 border-t border-industrial-100">
                  <h3 className="font-bold text-xs text-industrial-800 uppercase tracking-wider">
                    Consignment Items
                  </h3>

                  <div className="divide-y divide-industrial-100 border border-industrial-200 rounded-2xl p-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.productImage}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-industrial-200 bg-industrial-50"
                          />
                          <div>
                            <div className="font-bold text-industrial-900">{item.productTitle}</div>
                            <div className="text-[11px] text-industrial-500">
                              Qty: {item.quantity} {item.unit}s • HSN: {item.hsnCode}
                            </div>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-industrial-950">
                          {formatINR(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold text-industrial-950 p-3 bg-industrial-50 rounded-xl">
                    <span>Total Landed Amount (Incl. Taxes & Freight):</span>
                    <span className="text-brand-600 font-mono text-base">
                      {formatINR(selectedOrder.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <TaxInvoiceModal
        invoice={selectedInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
};
