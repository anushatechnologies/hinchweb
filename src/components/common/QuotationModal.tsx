import React from 'react';
import type { Estimation } from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';
import {
  X,
  Printer,
  Download,
  Calendar,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';

interface QuotationModalProps {
  isOpen: boolean;
  estimation: Estimation | null;
  onClose: () => void;
  onDownloadPdf?: () => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  estimation,
  onClose,
  onDownloadPdf,
}) => {
  if (!isOpen || !estimation) return null;

  const validUntilFormatted = estimation.validUntil
    ? formatDate(estimation.validUntil)
    : '15 Days from Generation';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-industrial-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-industrial-200 relative overflow-hidden animate-in zoom-in-95 print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full">
        {/* Top Action Bar (Hidden on print) */}
        <div className="p-4 px-6 bg-industrial-950 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Official B2B Price Quotation</span>
            </span>
            <span className="text-industrial-400 font-mono">
              {estimation.quotationNumber || `QUO-${estimation.estimationNumber}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onDownloadPdf || handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-industrial-400 hover:text-white hover:bg-white/10 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Quotation Content */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white print:p-0">
          {/* Header & Logo */}
          <div className="flex justify-between items-start pb-6 border-b border-industrial-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black tracking-tight text-industrial-950">hinchmart</span>
                <span className="text-brand-600 font-extrabold text-xs px-2 py-0.5 bg-brand-50 rounded-md border border-brand-200">
                  ENTERPRISE B2B
                </span>
              </div>
              <p className="text-xs text-industrial-500 max-w-sm">
                HinchMart Technologies Private Limited • HITEC City Industrial Corridor, Hyderabad, Telangana 500081
              </p>
              <div className="text-[11px] text-industrial-600 mt-1 space-x-3">
                <span>GSTIN: <strong className="font-mono text-industrial-900">36AAACH9821R1ZW</strong></span>
                <span>•</span>
                <span>PAN: <strong className="font-mono text-industrial-900">AAACH9821R</strong></span>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="text-xs font-bold text-industrial-400 uppercase tracking-widest">
                Procurement Quotation
              </div>
              <div className="text-xl font-black text-industrial-950 font-mono">
                {estimation.quotationNumber || `QUO-${estimation.estimationNumber}`}
              </div>
              <div className="text-xs text-industrial-500 flex items-center justify-end gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date: {formatDate(estimation.createdAt)}</span>
              </div>
              {/* Validity Countdown Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold mt-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Prices locked until {validUntilFormatted}</span>
              </div>
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-industrial-50 rounded-2xl border border-industrial-200 text-xs">
            <div>
              <div className="text-[11px] font-bold text-industrial-400 uppercase tracking-wider mb-1">
                Quotation Issued To
              </div>
              <div className="font-black text-sm text-industrial-950">
                Apex Infrastructure & Civil Projects Pvt Ltd
              </div>
              <div className="text-industrial-600 mt-0.5">
                Site Office: Survey 45, HITEC City Transit Hub, Hyderabad
              </div>
              <div className="text-industrial-600 mt-0.5">
                GSTIN: <strong className="font-mono text-industrial-900">36AAACA1234A1Z5</strong>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-industrial-400 uppercase tracking-wider mb-1">
                Project & Reference Information
              </div>
              <div className="font-medium text-industrial-800">
                Source Document: <strong className="text-industrial-950">{estimation.fileName}</strong>
              </div>
              <div className="text-industrial-600 mt-0.5 line-clamp-2">
                Project Notes: {estimation.projectNotes || 'Industrial construction procurement bill of quantities.'}
              </div>
              <div className="text-industrial-600 mt-0.5">
                Delivery Transit: Heavy Vehicle Direct Trailer Access Guaranteed
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-industrial-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-industrial-100 text-industrial-700 font-extrabold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Requirement / Matched Product</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Unit Price</th>
                  <th className="py-3 px-3">Wholesale Tier</th>
                  <th className="py-3 px-3 text-center">GST %</th>
                  <th className="py-3 px-4 text-right">Total (Incl. Tax)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-industrial-200 text-industrial-800">
                {estimation.items.map((item, idx) => (
                  <tr key={item.itemId} className="hover:bg-industrial-50/50">
                    <td className="py-3.5 px-4 font-mono text-industrial-400">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-industrial-950">
                        {item.matchedProductTitle || item.requirementText}
                      </div>
                      {item.matchedProductTitle && (
                        <div className="text-[10px] text-industrial-500 font-medium">
                          Req: {item.requirementText} • Brand: {item.matchedProductBrand || 'Standard'}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold font-mono">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-medium">
                      {item.unitPrice > 0 ? formatINR(item.unitPrice) : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-[11px] text-emerald-700 font-semibold">
                      {item.appliedTier || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {item.unitPrice > 0 ? `${item.gstRate}%` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-mono text-industrial-950">
                      {item.lineTotal > 0 ? formatINR(item.lineTotal) : 'Quoted on Request'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2 text-xs">
              <div className="flex justify-between py-1 text-industrial-600">
                <span>Taxable Subtotal</span>
                <span className="font-mono font-medium text-industrial-900">{formatINR(estimation.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1 text-emerald-700">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Wholesale Tier Savings</span>
                </span>
                <span className="font-mono font-bold">- {formatINR(estimation.tierSavings)}</span>
              </div>
              <div className="flex justify-between py-1 text-industrial-600">
                <span>GST Breakdown (18% IGST)</span>
                <span className="font-mono font-medium text-industrial-900">{formatINR(estimation.gstTotal)}</span>
              </div>
              <div className="flex justify-between py-1 text-industrial-600">
                <span>Direct Site Heavy Transit Freight</span>
                <span className="font-mono font-semibold text-emerald-600">FREE / INCLUDED</span>
              </div>
              <div className="border-t-2 border-industrial-950 pt-2 flex justify-between text-base font-black text-industrial-950">
                <span>Grand Total (INR)</span>
                <span className="font-mono text-brand-700">{formatINR(estimation.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Legal Notes & Sign-off */}
          <div className="pt-6 border-t border-industrial-200 text-[11px] text-industrial-500 space-y-2">
            <div className="font-bold text-industrial-700 uppercase tracking-wider text-[10px]">
              Terms & Conditions:
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>All quoted prices are valid until {validUntilFormatted}. Post validity, raw material index rates may be revised.</li>
              <li>Standard delivery includes crane unloading access for heavy structural loads (Steel & Cement).</li>
              <li>Mill Test Certificates (MTC) and weighbridge transit passes are supplied with each dispatch.</li>
              <li>Official GST Input Tax Credit (ITC) e-Invoices will be auto-generated in GSTR-1 upon dispatch.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
