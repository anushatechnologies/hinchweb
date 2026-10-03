import React, { useState } from 'react';
import type { EstimationItem, CandidateProduct } from '../../types';
import { formatINR } from '../../utils/formatters';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Building,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface CandidateProductModalProps {
  isOpen: boolean;
  item: EstimationItem | null;
  onClose: () => void;
  onConfirmMatch: (productId: number | string) => Promise<void>;
  isSubmitting?: boolean;
}

export const CandidateProductModal: React.FC<CandidateProductModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirmMatch,
  isSubmitting = false,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<number | string | null>(null);

  if (!isOpen || !item) return null;

  const candidates: CandidateProduct[] = item.candidateProducts || [];

  const handleSelect = (productId: number | string) => {
    setSelectedProductId(productId);
  };

  const handleConfirm = async () => {
    if (!selectedProductId) return;
    await onConfirmMatch(selectedProductId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-industrial-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-industrial-200 relative overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-industrial-950 via-slate-900 to-industrial-950 p-6 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Ambiguous Requirement Match Resolution</span>
            </div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <span>Select Product for:</span>
              <span className="text-amber-300 underline decoration-amber-400/50">
                "{item.requirementText}"
              </span>
            </h3>
            <p className="text-xs text-industrial-300 mt-1">
              Target Quantity: <strong>{item.quantity} {item.unit}</strong> • Choose the exact manufacturer grade and specification for this project.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-industrial-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Candidate List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-industrial-50/50">
          <div className="text-xs text-industrial-600 font-medium">
            AI detected <strong>{candidates.length} verified catalog candidates</strong> matching this requirement. Review specifications and live stock to confirm:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {candidates.map((cand) => {
              const isSelected = selectedProductId === cand.productId;
              return (
                <div
                  key={cand.productId}
                  onClick={() => handleSelect(cand.productId)}
                  className={`bg-white rounded-2xl border-2 transition-all p-4 flex flex-col justify-between cursor-pointer relative ${
                    isSelected
                      ? 'border-brand-600 shadow-xl shadow-brand-600/10 ring-2 ring-brand-500/20'
                      : 'border-industrial-200 hover:border-industrial-300 hover:shadow-md'
                  }`}
                >
                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute -top-2.5 -right-2.5 bg-brand-600 text-white rounded-full p-1 shadow-md">
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  <div>
                    {/* Image & Stock Badge */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-industrial-100 mb-3 border border-industrial-100">
                      <img
                        src={cand.imageUrl}
                        alt={cand.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-emerald-600/90 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold">
                        Stock: {cand.stock} {cand.unit}s
                      </div>
                    </div>

                    {/* Brand & Category */}
                    <div className="flex items-center gap-2 text-[10px] text-industrial-500 font-bold uppercase tracking-wider mb-1">
                      <Building className="w-3 h-3 text-industrial-400" />
                      <span>{cand.brand}</span>
                      <span>•</span>
                      <span>{cand.category}</span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-extrabold text-industrial-950 line-clamp-2 leading-tight mb-2">
                      {cand.title}
                    </h4>

                    {/* Pricing */}
                    <div className="mb-3 bg-industrial-50 p-2.5 rounded-xl border border-industrial-100">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-industrial-950">
                          {formatINR(cand.price)}
                        </span>
                        <span className="text-[11px] text-industrial-400 line-through">
                          {formatINR(cand.mrp)}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-extrabold">
                          per {cand.unit}
                        </span>
                      </div>
                      {cand.appliedTier && (
                        <div className="text-[11px] text-brand-700 font-bold mt-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-brand-600 shrink-0" />
                          <span>{cand.appliedTier}</span>
                        </div>
                      )}
                    </div>

                    {/* Technical Specifications */}
                    <div className="space-y-1.5 pt-1 border-t border-industrial-100 text-[11px]">
                      <div className="font-extrabold text-industrial-800 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Layers className="w-3 h-3 text-industrial-400" />
                        Technical Parameters:
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-industrial-150 space-y-1 text-industrial-600">
                        {Object.entries(cand.specifications || {}).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center text-[10px]">
                            <span className="text-industrial-500 font-medium">{key}:</span>
                            <span className="font-bold text-industrial-900 font-mono text-right">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Select Button */}
                  <div className="mt-4 pt-3 border-t border-industrial-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(cand.productId);
                      }}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-industrial-100 hover:bg-industrial-200 text-industrial-800'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selected Choice</span>
                        </>
                      ) : (
                        <span>Choose This Product</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-white border-t border-industrial-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-industrial-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Confirming recalculates bulk tier savings & GST total automatically</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-industrial-600 hover:text-industrial-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedProductId || isSubmitting}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-brand-600/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Resolving...' : 'Confirm Match'}</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
