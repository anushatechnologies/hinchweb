import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { invoiceApi } from '../api/invoiceApi';
import type { Order, TaxInvoice } from '../types';
import { TaxInvoiceModal } from '../components/common/TaxInvoiceModal';
import { formatINR, formatDate } from '../utils/formatters';
import {
  CheckCircle2,
  Truck,
  ShieldCheck,
  Printer,
  MapPin,
} from 'lucide-react';

export const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<TaxInvoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    orderApi
      .getOrderById(id)
      .then(async (ord) => {
        setOrder(ord);
        if (ord.invoiceId || ord.orderNumber) {
          const inv = await invoiceApi.getInvoiceById(ord.invoiceId || ord.orderNumber);
          setInvoice(inv);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-semibold text-industrial-500">Generating purchase order confirmation & tax invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-industrial-900">Order Not Found</h2>
        <Link to="/orders" className="text-xs font-bold text-brand-600 underline">
          Go to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* 1. Success Hero Banner */}
      <div className="bg-white rounded-3xl border border-industrial-200 p-8 shadow-card text-center space-y-4 relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-in zoom-in-75">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Payment & Dispatch Verified</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-industrial-950">
            Purchase Order Successfully Placed!
          </h1>
          <p className="text-xs text-industrial-600 max-w-md mx-auto">
            Order Reference <strong className="font-mono text-industrial-950">#{order.orderNumber}</strong> has been transmitted to {order.seller.name} for weighbridge loading and E-Way Bill staging.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {invoice && (
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-600/25 flex items-center gap-2 transition-all active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>View & Print Tax Invoice</span>
            </button>
          )}

          <Link
            to="/orders"
            className="px-6 py-3 bg-industrial-900 hover:bg-industrial-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all"
          >
            <Truck className="w-4 h-4 text-brand-400" />
            <span>Track Heavy Vehicle Consignment</span>
          </Link>
        </div>
      </div>

      {/* 2. Order Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Delivery Site Details */}
        <div className="bg-white p-6 rounded-3xl border border-industrial-200 shadow-card space-y-3">
          <div className="flex items-center gap-2 text-industrial-900 font-bold border-b border-industrial-100 pb-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <span>Destination Project Site</span>
          </div>
          <div className="space-y-1">
            <div className="font-bold text-industrial-950">{order.deliveryAddress.companyName}</div>
            <div className="text-industrial-600 leading-relaxed">
              {order.deliveryAddress.addressLine1}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
            </div>
            <div className="text-industrial-500 pt-1">
              Site Engineer: <strong className="text-industrial-900">{order.deliveryAddress.contactName}</strong> ({order.deliveryAddress.mobile})
            </div>
          </div>
        </div>

        {/* Logistics & Transit */}
        <div className="bg-white p-6 rounded-3xl border border-industrial-200 shadow-card space-y-3">
          <div className="flex items-center gap-2 text-industrial-900 font-bold border-b border-industrial-100 pb-2">
            <Truck className="w-4 h-4 text-brand-600" />
            <span>Transport & Dispatch Logistics</span>
          </div>
          <div className="space-y-1.5 text-industrial-600">
            <div>Logistics Fleet: <strong className="text-industrial-900">{order.tracking.partnerName}</strong></div>
            <div>Tracking LR Number: <strong className="font-mono text-industrial-900">{order.tracking.trackingNumber}</strong></div>
            <div>Expected Site Arrival: <strong className="text-emerald-700">{formatDate(order.expectedDelivery)}</strong></div>
            <div className="text-emerald-700 font-semibold flex items-center gap-1 mt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Mill Test Certificate (MTC) Attached</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Items Summary */}
      <div className="bg-white rounded-3xl border border-industrial-200 p-6 shadow-card space-y-4">
        <h3 className="font-bold text-sm text-industrial-950 border-b border-industrial-100 pb-3">
          Ordered Materials & Tax Breakdown
        </h3>

        <div className="divide-y divide-industrial-100">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={item.productImage}
                  alt={item.productTitle}
                  className="w-12 h-12 rounded-xl object-cover border border-industrial-200 bg-industrial-50"
                />
                <div>
                  <div className="font-bold text-industrial-900">{item.productTitle}</div>
                  <div className="text-industrial-500 text-[11px]">
                    Brand: {item.brand} • HSN: {item.hsnCode} • Qty: {item.quantity} {item.unit}s
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-industrial-950">{formatINR(item.totalPrice)}</div>
                <div className="text-[10px] text-industrial-500">+{item.gstRate}% GST</div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-industrial-200 flex justify-between items-center text-sm font-bold text-industrial-950">
          <span>Grand Total (Incl. All Taxes & Freight):</span>
          <span className="text-brand-600 font-mono text-lg">{formatINR(order.grandTotal)}</span>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      <TaxInvoiceModal
        invoice={invoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
};
