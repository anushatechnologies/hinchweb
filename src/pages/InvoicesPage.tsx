import React, { useState, useEffect } from 'react';
import { invoiceApi } from '../api/invoiceApi';
import type { TaxInvoice } from '../types';
import { TaxInvoiceModal } from '../components/common/TaxInvoiceModal';
import { formatINR } from '../utils/formatters';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  Search,
  Printer,
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    invoiceApi
      .getInvoices()
      .then((data) => {
        setInvoices(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.orderNumber.toLowerCase().includes(q) ||
      inv.seller.companyName.toLowerCase().includes(q) ||
      inv.buyer.gstin.toLowerCase().includes(q)
    );
  });

  const handleOpenInvoice = (inv: TaxInvoice) => {
    setSelectedInvoice(inv);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-industrial-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-industrial-500 mb-1">
            <Link to="/" className="hover:text-industrial-900">Home</Link>
            <span>/</span>
            <span className="font-semibold text-industrial-800">GST Compliance Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-industrial-950">
            GST Tax Invoices & E-Way Bills
          </h1>
          <p className="text-xs text-industrial-500 mt-0.5">
            Download and print authentic GST e-invoices with QR code and HSN breakdown for 100% ITC claim.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>GSTR-1 Auto-Reconciliation Ready</span>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-industrial-200 shadow-subtle">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by Invoice No, PO #, Seller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-industrial-50 border border-industrial-300 rounded-xl text-xs text-industrial-900 placeholder:text-industrial-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Search className="w-4 h-4 text-industrial-400 absolute left-3 top-2.5" />
        </div>

        <div className="text-xs text-industrial-500">
          Total Generated Invoices: <strong className="text-industrial-900 font-mono">{filteredInvoices.length}</strong>
        </div>
      </div>

      {/* 3. Invoices Table */}
      <div className="bg-white rounded-3xl border border-industrial-200 overflow-hidden shadow-card">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-industrial-500 space-y-2">
            <FileText className="w-8 h-8 text-industrial-300 mx-auto" />
            <p>No tax invoices matching your query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-industrial-900 text-white font-semibold">
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">PO Reference</th>
                  <th className="py-3.5 px-4">Seller Supplier</th>
                  <th className="py-3.5 px-4 text-right">Taxable Total</th>
                  <th className="py-3.5 px-4 text-right">Total GST</th>
                  <th className="py-3.5 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-industrial-200">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-industrial-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-industrial-600">{inv.invoiceDate}</td>
                    <td className="py-3 px-4 font-mono text-industrial-800">#{inv.orderNumber}</td>
                    <td className="py-3 px-4 font-semibold text-industrial-900">
                      {inv.seller.companyName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-industrial-700">
                      {formatINR(inv.taxableTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                      {formatINR(inv.cgstTotal + inv.sgstTotal + inv.igstTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-industrial-950">
                      {formatINR(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenInvoice(inv)}
                        className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow-sm inline-flex items-center gap-1 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TaxInvoiceModal
        invoice={selectedInvoice}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
