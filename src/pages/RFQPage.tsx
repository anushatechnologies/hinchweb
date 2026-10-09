import React, { useState, useEffect } from 'react';
import { rfqApi } from '../api/rfqApi';
import { quoteApi } from '../api/quoteApi';
import type { RFQ, Quote } from '../types';
import { useRFQModalStore } from '../store/useRFQModalStore';
import { useChatStore } from '../store/useChatStore';
import { useToastStore } from '../store/useToastStore';
import { formatINR, formatDate } from '../utils/formatters';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  FileText,
  Plus,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Star,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Calendar,
  MapPin,
} from 'lucide-react';

export const RFQPage: React.FC = () => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'Quotes Received' | 'Open' | 'Quote Accepted'>('all');
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  const { openRFQModal } = useRFQModalStore();
  const { openChatWithSeller } = useChatStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const data = await rfqApi.getRFQs();
      setRfqs(data);
      if (data.length > 0) {
        setSelectedRfq(data[0]);
        const qList = await quoteApi.getQuotesForRFQ(data[0].id);
        setQuotes(qList);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectRfq = async (rfq: RFQ) => {
    setSelectedRfq(rfq);
    try {
      const detailed = await rfqApi.getRFQById(rfq.id);
      if (detailed) setSelectedRfq(detailed);
      const qList = await quoteApi.getQuotesForRFQ(rfq.id);
      setQuotes(qList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptQuote = async (quote: Quote) => {
    setIsAccepting(quote.id);
    try {
      const res = await quoteApi.acceptQuote(quote.id);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast(
        'success',
        `Quotation from ${quote.seller.name} accepted! Purchase Order #${res.order.orderNumber} created.`,
        'Quote Accepted'
      );

      // Refresh list
      await loadData();
      setIsAccepting(null);
      navigate(`/orders`);
    } catch (err) {
      console.error(err);
      setIsAccepting(null);
      showToast('error', 'Failed to accept quote', 'Error');
    }
  };

  const handleRejectQuote = async (quote: Quote) => {
    const reason = window.prompt('Reason for rejecting quotation:', 'Rate is above project target budget.');
    if (!reason) return;
    try {
      await quoteApi.rejectQuote(quote.id, reason);
      showToast('info', `Quotation from ${quote.seller.name} rejected.`, 'Quote Rejected');
      if (selectedRfq) {
        const qList = await quoteApi.getQuotesForRFQ(selectedRfq.id);
        setQuotes(qList.filter((q) => q.id !== quote.id));
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to reject quote', 'Error');
    }
  };

  const handleCounterQuote = async (quote: Quote) => {
    const targetStr = window.prompt(
      `Enter counter price per ${quote.unit} (Current: ₹${quote.pricePerUnit}):`,
      String(Math.round(quote.pricePerUnit * 0.95))
    );
    if (!targetStr) return;
    const targetPrice = parseFloat(targetStr);
    if (isNaN(targetPrice) || targetPrice <= 0) {
      showToast('error', 'Please enter a valid price', 'Invalid Input');
      return;
    }
    try {
      await quoteApi.counterQuote(quote.id, {
        counterPrice: targetPrice,
        quantity: quote.quantity,
        notes: `Buyer counter offer at ₹${targetPrice}/${quote.unit}`,
      });
      showToast('success', `Counter offer of ₹${targetPrice}/${quote.unit} sent to ${quote.seller.name}.`, 'Counter Offer Sent');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to submit counter offer', 'Error');
    }
  };

  const handleCloseRFQ = async (rfq: RFQ) => {
    if (!window.confirm(`Are you sure you want to close RFQ #${rfq.rfqNumber}?`)) return;
    try {
      await rfqApi.closeRFQ(rfq.id, 'Procurement fulfilled through local supply.');
      showToast('success', `RFQ #${rfq.rfqNumber} closed.`, 'RFQ Closed');
      await loadData();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to close RFQ', 'Error');
    }
  };

  const filteredRfqs = rfqs.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-industrial-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-industrial-500 mb-1">
            <Link to="/" className="hover:text-industrial-900">Home</Link>
            <span>/</span>
            <span className="font-semibold text-industrial-800">Enterprise RFQ Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-industrial-950">
            Request For Quotation (RFQ) Desk
          </h1>
          <p className="text-xs text-industrial-500 mt-0.5">
            Broadcast custom material requirements to verified primary mills and compare competitive supplier bids.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openRFQModal()}
          className="px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-brand-600/25 flex items-center gap-2 transition-all active:scale-98 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Broadcast New RFQ</span>
        </button>
      </div>

      {/* 2. Status Tabs */}
      <div className="flex gap-2 border-b border-industrial-200 pb-2 text-xs font-bold overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All Requests', count: rfqs.length },
          {
            id: 'Quotes Received',
            label: 'Quotes Received',
            count: rfqs.filter((r) => r.status === 'Quotes Received').length,
          },
          {
            id: 'Open',
            label: 'Open / Broadcasted',
            count: rfqs.filter((r) => r.status === 'Open').length,
          },
          {
            id: 'Quote Accepted',
            label: 'Accepted & Converted',
            count: rfqs.filter((r) => r.status === 'Quote Accepted').length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-industrial-900 text-white'
                : 'text-industrial-600 hover:bg-industrial-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id ? 'bg-brand-500 text-white' : 'bg-industrial-200 text-industrial-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 3. Main Split View: RFQ List (5 cols) & Quote Comparator (7 cols) */}
      {filteredRfqs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-industrial-200 p-12 text-center space-y-4 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-industrial-950">No RFQs in this category</h3>
          <p className="text-xs text-industrial-500 max-w-sm mx-auto">
            Broadcast custom cutting schedules, BOQs, or project material batches to receive competing offers.
          </p>
          <button
            onClick={() => openRFQModal()}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs"
          >
            Create New RFQ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* RFQ List Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {filteredRfqs.map((rfq) => {
              const isSelected = selectedRfq?.id === rfq.id;
              return (
                <div
                  key={rfq.id}
                  onClick={() => handleSelectRfq(rfq)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                    isSelected
                      ? 'border-brand-500 bg-white shadow-card ring-2 ring-brand-500/20'
                      : 'border-industrial-200 bg-white hover:border-industrial-300 shadow-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-industrial-500">
                      #{rfq.rfqNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rfq.status === 'Quotes Received'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : rfq.status === 'Quote Accepted'
                          ? 'bg-brand-50 text-brand-800 border border-brand-200'
                          : 'bg-industrial-100 text-industrial-700'
                      }`}
                    >
                      {rfq.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-industrial-950 line-clamp-1">
                      {rfq.productName}
                    </h3>
                    <div className="text-xs text-brand-700 font-semibold mt-0.5">
                      Requirement: {rfq.quantity} {rfq.unit}s • Brand: {rfq.brandPreference}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-industrial-500 pt-2 border-t border-industrial-100">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-industrial-400 shrink-0" />
                      <span className="truncate">{rfq.deliveryLocation}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <Calendar className="w-3.5 h-3.5 text-industrial-400 shrink-0" />
                      <span>By {formatDate(rfq.requiredByDate)}</span>
                    </div>
                  </div>

                  {rfq.quotesCount > 0 && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{rfq.quotesCount} Competitive Quotes Available</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quotations Comparator Matrix (7 cols) */}
          <div className="lg:col-span-7 space-y-6 sticky top-24">
            {selectedRfq && (
              <div className="bg-white rounded-3xl border border-industrial-200 p-6 shadow-card space-y-6">
                {/* Selected RFQ Header */}
                <div className="pb-4 border-b border-industrial-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                      RFQ Comparison Matrix
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-industrial-500 font-semibold">
                        #{selectedRfq.rfqNumber}
                      </span>
                      {selectedRfq.status !== 'CLOSED' && selectedRfq.status !== 'Quote Accepted' && (
                        <button
                          type="button"
                          onClick={() => handleCloseRFQ(selectedRfq)}
                          className="px-2.5 py-1 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer transition-colors"
                          title="Close or cancel this RFQ"
                        >
                          Close RFQ
                        </button>
                      )}
                    </div>
                  </div>
                  <h2 className="text-xl font-black text-industrial-950">
                    {selectedRfq.productName}
                  </h2>
                  <div className="p-3 bg-industrial-50 rounded-xl border border-industrial-200/80 text-xs text-industrial-700 space-y-1">
                    <div>
                      <strong>Required Volume:</strong> {selectedRfq.quantity} {selectedRfq.unit}s
                    </div>
                    <div>
                      <strong>Technical Notes / Standards:</strong> {selectedRfq.specifications}
                    </div>
                    <div>
                      <strong>Delivery Destination:</strong> {selectedRfq.deliveryLocation} ({selectedRfq.deliveryPincode})
                    </div>
                  </div>
                </div>

                {/* Quotes Side-by-Side Comparison */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-industrial-900 flex items-center gap-2">
                    <span>Competing Supplier Quotations ({quotes.length})</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      LOWEST LANDED RATE GUARANTEED
                    </span>
                  </h3>

                  {quotes.length === 0 ? (
                    <div className="p-8 text-center bg-industrial-50 rounded-2xl text-xs text-industrial-500">
                      Broadcasting to local stockyards. Quotations will populate here in real-time.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quotes.map((quote) => (
                        <div
                          key={quote.id}
                          className={`p-5 rounded-2xl border transition-all space-y-4 relative ${
                            quote.isAccepted
                              ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20'
                              : 'border-industrial-200 bg-white hover:border-industrial-300 shadow-subtle'
                          }`}
                        >
                          {/* Supplier Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-industrial-100 flex items-center justify-center font-bold text-brand-600 border border-industrial-200 shrink-0">
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-bold text-sm text-industrial-950">
                                    {quote.seller.name}
                                  </h4>
                                  {quote.seller.isVerified && (
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                  )}
                                </div>
                                <div className="text-xs text-industrial-500">
                                  {quote.seller.city}, {quote.seller.state} • {quote.seller.successfulOrders}+ orders fulfilled
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md text-xs font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{quote.seller.rating}</span>
                            </div>
                          </div>

                          {/* Pricing & Terms Matrix */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-industrial-50 text-xs">
                            <div>
                              <span className="text-[10px] text-industrial-500 block">Unit Rate</span>
                              <span className="font-mono font-bold text-industrial-950">
                                {formatINR(quote.pricePerUnit)}/{quote.unit}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-industrial-500 block">GST ({quote.gstRate}%)</span>
                              <span className="font-mono font-semibold text-industrial-800">
                                {formatINR(quote.gstAmount)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-industrial-500 block">Lead Time</span>
                              <span className="font-bold text-emerald-700">
                                ⚡ {quote.deliveryDays} Days Site Delivery
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-industrial-500 block">Landed Total</span>
                              <span className="font-mono font-black text-brand-600 text-sm">
                                {formatINR(quote.landedCost)}
                              </span>
                            </div>
                          </div>

                          {/* Notes & Terms */}
                          <div className="text-xs text-industrial-600 space-y-1">
                            <div>
                              <strong className="text-industrial-800">Payment Terms:</strong>{' '}
                              <span className="font-semibold text-industrial-900">{quote.paymentTerms}</span>
                            </div>
                            {quote.notes && (
                              <div className="text-industrial-500 italic text-[11px]">
                                "{quote.notes}"
                              </div>
                            )}
                          </div>

                          {/* Accept Quote Action */}
                          <div className="flex items-center gap-3 pt-2 border-t border-industrial-100">
                            <button
                              type="button"
                              onClick={() =>
                                openChatWithSeller(
                                  quote.seller,
                                  'RFQ Discussion',
                                  `Negotiation on RFQ #${selectedRfq.rfqNumber}`,
                                  quote.id
                                )
                              }
                              className="px-4 py-2 rounded-xl border border-industrial-300 hover:bg-industrial-50 text-industrial-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                              <span>Negotiate Rate</span>
                            </button>

                            {quote.isAccepted ? (
                              <div className="flex-1 py-2 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl text-center border border-emerald-200 flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Quotation Accepted & Order Created</span>
                              </div>
                            ) : (
                              <div className="flex-1 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCounterQuote(quote)}
                                  className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                                  title="Send Target Counter Price"
                                >
                                  Counter Offer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectQuote(quote)}
                                  className="px-3.5 py-2.5 border border-red-300 text-red-700 hover:bg-red-50 rounded-xl font-bold text-xs transition-all"
                                  title="Reject Quotation"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAcceptQuote(quote)}
                                  disabled={isAccepting === quote.id}
                                  className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-98"
                                >
                                  {isAccepting === quote.id ? (
                                    <>Converting to PO...</>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>Accept & Create PO</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
