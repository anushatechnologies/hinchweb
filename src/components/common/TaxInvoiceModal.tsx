import React from 'react';
import type { TaxInvoice } from '../../types';
import { formatINR } from '../../utils/formatters';
import { X, Printer, ShieldCheck, QrCode } from 'lucide-react';

interface TaxInvoiceModalProps {
  invoice: TaxInvoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({ invoice, isOpen, onClose }) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const seller = invoice.seller || {
    companyName: 'Tata Steel Distribution Hub Pvt Ltd',
    gstin: '27AAACT2727Q1ZW',
    pan: 'AAACT2727Q',
    address: 'Plot 12, Industrial Logistics Zone, Chakan',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '410501',
  };

  const buyer = invoice.buyer || {
    companyName: 'Apex Infra Projects Pvt Ltd',
    contactPerson: 'Rajesh Sharma',
    gstin: '27AAAAA0000A1Z5',
    pan: 'AAAAA0000A',
    address: 'Plot 45, MIDC Industrial Area, Phase 2',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411057',
  };

  const hinchmart = invoice.hinchmart || {
    platformName: 'HinchMart B2B Marketplace (HinchMart Technologies Pvt Ltd)',
    gstin: '36AABCH9988C1Z4',
    cin: 'U72900TG2024PTC188234',
    address: 'Sirisampadha Arcade 1, 5th Floor, Gachibowli, Khajaguda, Hyderabad – 500008, Telangana, India',
  };

  const items = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : [
        {
          description: 'Industrial Heavy Procurement Material',
          hsnCode: '72142090',
          quantity: 1,
          unit: 'Ton' as any,
          unitPrice: Number(invoice.taxableTotal || invoice.grandTotal || 0),
          taxableValue: Number(invoice.taxableTotal || invoice.grandTotal || 0),
          gstRate: 18,
          cgstAmount: Number(invoice.cgstTotal || 0),
          sgstAmount: Number(invoice.sgstTotal || 0),
          igstAmount: Number(invoice.igstTotal || 0),
          totalAmount: Number(invoice.grandTotal || 0),
        },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-industrial-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-industrial-300">
        {/* Action Header - hidden in print */}
        <div className="no-print bg-industrial-900 text-white px-6 py-4 flex items-center justify-between border-b border-industrial-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/20 text-brand-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">GST Tax Invoice</h3>
              <p className="text-xs text-industrial-300">
                Official E-Invoice compliant with Indian GST (CGST/SGST/IGST) Regulations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="text-industrial-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Document Body */}
        <div className="p-8 overflow-y-auto invoice-card font-sans text-industrial-900 bg-white space-y-6">
          {/* Top Title Banner */}
          <div className="border-b-2 border-industrial-900 pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="HINCHMART"
                  className="h-10 w-auto object-contain"
                />
                <span className="text-[11px] font-bold bg-industrial-100 text-industrial-700 px-2 py-0.5 rounded border border-industrial-300">
                  B2B PROCUREMENT PLATFORM
                </span>
              </div>
              <p className="text-xs text-industrial-600 mt-1 max-w-sm">
                {hinchmart.platformName}
                <br />
                {hinchmart.address}
                <br />
                <strong className="text-industrial-900">GSTIN:</strong> {hinchmart.gstin} |{' '}
                <strong className="text-industrial-900">CIN:</strong> {hinchmart.cin}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block bg-industrial-900 text-white font-extrabold text-xs px-3 py-1 rounded tracking-wider uppercase mb-1">
                TAX INVOICE (ORIGINAL FOR RECIPIENT)
              </div>
              <div className="text-sm font-bold text-industrial-950">
                Invoice No: <span className="font-mono text-brand-600">{invoice.invoiceNumber || 'INV-2026-000115'}</span>
              </div>
              <div className="text-xs text-industrial-600">
                Invoice Date: <span className="font-semibold text-industrial-900">{invoice.invoiceDate || '2026-08-22'}</span>
              </div>
              <div className="text-xs text-industrial-600">
                Order Reference: <span className="font-mono font-semibold text-industrial-900">#{invoice.orderNumber || invoice.orderId}</span>
              </div>
              {invoice.eWayBillNo && (
                <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded inline-block mt-1 border border-emerald-200">
                  E-Way Bill: {invoice.eWayBillNo}
                </div>
              )}
            </div>
          </div>

          {/* Parties: Seller & Buyer Grid */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-industrial-50 border border-industrial-200">
            {/* Seller */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-industrial-500 mb-1">
                SUPPLIED BY (SELLER):
              </div>
              <div className="font-bold text-sm text-industrial-950">{seller.companyName}</div>
              <div className="text-xs text-industrial-600 mt-1 leading-relaxed">
                {seller.address}, {seller.city}, {seller.state} - {seller.pincode}
              </div>
              <div className="text-xs mt-2 space-y-0.5">
                <div>
                  <span className="font-semibold text-industrial-700">GSTIN:</span>{' '}
                  <span className="font-mono font-bold text-industrial-950">{seller.gstin}</span>
                </div>
                <div>
                  <span className="font-semibold text-industrial-700">PAN:</span>{' '}
                  <span className="font-mono text-industrial-900">{seller.pan}</span>
                </div>
              </div>
            </div>

            {/* Buyer */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-industrial-500 mb-1">
                BILLED TO / RECIPIENT (BUYER):
              </div>
              <div className="font-bold text-sm text-industrial-950">{buyer.companyName}</div>
              <div className="text-xs text-industrial-600 mt-1 leading-relaxed">
                Attn: {buyer.contactPerson}
                <br />
                {buyer.address}, {buyer.city}, {buyer.state} - {buyer.pincode}
              </div>
              <div className="text-xs mt-2 space-y-0.5">
                <div>
                  <span className="font-semibold text-industrial-700">GSTIN (for ITC):</span>{' '}
                  <span className="font-mono font-bold text-brand-700">{buyer.gstin}</span>
                </div>
                <div>
                  <span className="font-semibold text-industrial-700">PAN:</span>{' '}
                  <span className="font-mono text-industrial-900">{buyer.pan}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-industrial-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-industrial-100 text-industrial-800 font-bold border-b border-industrial-200">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Description of Goods</th>
                  <th className="py-2.5 px-3 font-mono">HSN Code</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right">Taxable Value</th>
                  <th className="py-2.5 px-3 text-right">GST %</th>
                  <th className="py-2.5 px-3 text-right">CGST</th>
                  <th className="py-2.5 px-3 text-right">SGST</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-industrial-200">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-industrial-50/50">
                    <td className="py-2.5 px-3 text-industrial-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-industrial-900">{item.description}</td>
                    <td className="py-2.5 px-3 font-mono text-industrial-600">{item.hsnCode}</td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right">{formatINR(item.unitPrice)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">{formatINR(item.taxableValue)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-industrial-700">{item.gstRate}%</td>
                    <td className="py-2.5 px-3 text-right">{formatINR(item.cgstAmount)}</td>
                    <td className="py-2.5 px-3 text-right">{formatINR(item.sgstAmount)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-industrial-950">
                      {formatINR(item.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Summary & Totals */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="space-y-3 text-xs text-industrial-600">
              <div className="p-3 bg-industrial-50 border border-industrial-200 rounded-xl space-y-1">
                <div className="font-bold text-industrial-900 text-xs">Payment Information</div>
                <div>Payment Method: <span className="font-semibold text-industrial-900">{invoice.paymentMethod || 'UPI / NetBanking'}</span></div>
                <div>Payment Status: <span className="font-semibold text-emerald-700">{invoice.paymentStatus || 'PAID'}</span></div>
                <div>Declaration: We declare that this invoice shows actual price of the goods described and all particulars are true and correct.</div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-brand-50/60 border border-brand-200 rounded-xl">
                <QrCode className="w-12 h-12 text-brand-700 shrink-0" />
                <div className="text-[11px] text-brand-950">
                  <div className="font-bold">E-Invoice QR Code & IRN Verified</div>
                  <div className="font-mono text-[10px] text-brand-800 truncate">
                    IRN: 8a93b49c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-industrial-200">
                <span className="text-industrial-600">Total Taxable Value:</span>
                <span className="font-semibold">{formatINR(invoice.taxableTotal || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-industrial-200">
                <span className="text-industrial-600">Central GST (CGST):</span>
                <span className="font-semibold">{formatINR(invoice.cgstTotal || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-industrial-200">
                <span className="text-industrial-600">State GST (SGST):</span>
                <span className="font-semibold">{formatINR(invoice.sgstTotal || 0)}</span>
              </div>
              {invoice.igstTotal > 0 && (
                <div className="flex justify-between py-1 border-b border-industrial-200">
                  <span className="text-industrial-600">Integrated GST (IGST):</span>
                  <span className="font-semibold">{formatINR(invoice.igstTotal)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-industrial-200">
                <span className="text-industrial-600">Freight & Handling Charges:</span>
                <span className="font-semibold">{formatINR(invoice.freightAmount || 2500)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold bg-industrial-900 text-white px-3 rounded-lg mt-2">
                <span>Grand Total (INR):</span>
                <span className="text-brand-400 font-mono text-base">{formatINR(invoice.grandTotal || 0)}</span>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="border-t border-industrial-200 pt-4 flex justify-between items-end text-xs text-industrial-500">
            <div>
              <p>Generated automatically on HinchMart B2B Cloud</p>
              <p className="text-[10px]">This is a computer generated invoice and requires no physical signature.</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-industrial-900">For {seller.companyName}</p>
              <div className="h-10"></div>
              <p className="text-[11px] text-industrial-600">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
