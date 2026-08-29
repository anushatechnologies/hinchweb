import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { invoiceApi } from '../api/invoiceApi';
import type { Order, TaxInvoice } from '../types';
import { TaxInvoiceModal } from '../components/common/TaxInvoiceModal';
import { formatINR, formatDate } from '../utils/formatters';
import {
  CheckCircle2,
  Package,
  Truck,
  Printer,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<TaxInvoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      orderApi
        .getOrderById(orderId)
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
    }
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-industrial-500">
        Generating enterprise invoice & verifying order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-industrial-950">Order Not Found</h2>
        <Link to="/orders" className="text-xs font-bold text-brand-600 underline">
          View All Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-in fade-in">
      {/* 1. Success Hero Banner */}
      <div className="bg-white rounded-3xl border border-industrial-200 p-8 sm:p-12 shadow-card text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-bounce">
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
            Order Reference <strong className="font-mono text-industrial-950">#{order.orderNumber}</strong> has been transmitted to {order.seller?.name || 'Primary Supplier'} for weighbridge loading and E-Way Bill staging.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {invoice && (
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-600/25 flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>View & Print Tax Invoice</span>
            </button>
          )}

          <Link
            to="/orders"
            className="px-6 py-3 bg-industrial-900 hover:bg-industrial-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
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
            <div className="font-bold text-industrial-950">{order.deliveryAddress?.companyName || 'Project Site'}</div>
            <div className="text-industrial-600 leading-relaxed">
              {order.deliveryAddress?.addressLine1}, {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
            </div>
            <div className="text-industrial-500 pt-1">
              Site Engineer: <strong className="text-industrial-900">{order.deliveryAddress?.contactName || order.deliveryAddress?.recipientName}</strong> ({order.deliveryAddress?.mobile || order.deliveryAddress?.phone})
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
            <div>Logistics Fleet: <strong className="text-industrial-900">{order.tracking?.partnerName || 'Heavy Cargo Logistics'}</strong></div>
            <div>Tracking LR Number: <strong className="font-mono text-industrial-900">{order.tracking?.trackingNumber || order.orderNumber}</strong></div>
            <div>Expected Site Arrival: <strong className="text-emerald-700">{formatDate(order.expectedDelivery || order.estimatedDelivery || order.createdAt)}</strong></div>
            <div className="text-emerald-700 font-semibold flex items-center gap-1 mt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Mill Test Certificate (MTC) Attached</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Items Summary */}
      <div className="bg-white rounded-3xl border border-industrial-200 p-6 shadow-card space-y-4">
        <h3 className="font-bold text-sm text-industrial-950 border-b border-industrial-100 pb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-brand-600" />
          <span>Procured Items ({order.items.length})</span>
        </h3>

        <div className="divide-y divide-industrial-100">
          {order.items.map((it) => (
            <div key={it.id || it.productId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs">
              <div>
                <div className="font-bold text-industrial-900">{it.productTitle || it.title || it.productName}</div>
                <div className="text-industrial-500">
                  Quantity: <strong className="text-industrial-800">{it.quantity} {it.unit}</strong> � Rate: {formatINR(it.unitPrice)}/{it.unit}
                </div>
              </div>
              <div className="font-mono font-black text-industrial-950 text-sm">
                {formatINR(it.totalPrice || it.total || (it.unitPrice * it.quantity))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-industrial-200 flex justify-between items-baseline text-sm font-black">
          <span>Total Order Value (incl. GST):</span>
          <span className="text-lg text-brand-700 font-mono">{formatINR(order.grandTotal)}</span>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      {invoice && (
        <TaxInvoiceModal
          isOpen={isInvoiceModalOpen}
          invoice={invoice}
          onClose={() => setIsInvoiceModalOpen(false)}
        />
      )}
    </div>
  );
};
