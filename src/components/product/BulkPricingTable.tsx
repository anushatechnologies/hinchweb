import React from 'react';
import type { Product } from '../../types';
import { formatINR } from '../../utils/formatters';
import { Percent, CheckCircle2, TrendingDown } from 'lucide-react';

interface BulkPricingTableProps {
  product: Product;
  currentQuantity: number;
  onSelectTierQuantity?: (qty: number) => void;
}

export const BulkPricingTable: React.FC<BulkPricingTableProps> = ({
  product,
  currentQuantity,
  onSelectTierQuantity,
}) => {
  if (!product.bulkPricing || product.bulkPricing.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-industrial-200 overflow-hidden shadow-subtle">
      <div className="bg-gradient-to-r from-industrial-900 to-industrial-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-emerald-400" />
          <h4 className="font-bold text-xs">Wholesale Volume Pricing Matrix</h4>
        </div>
        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-industrial-200">
          Auto-applied at checkout
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-industrial-50 text-industrial-600 font-semibold border-b border-industrial-200">
              <th className="py-2.5 px-4">Order Quantity</th>
              <th className="py-2.5 px-4">Rate per {product.unit}</th>
              <th className="py-2.5 px-4">Discount</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-100">
            {product.bulkPricing.map((tier, idx) => {
              const isActive =
                currentQuantity >= tier.minQty &&
                (tier.maxQty === null || currentQuantity <= tier.maxQty);
              const discount = Math.round(
                ((product.price - tier.pricePerUnit) / product.price) * 100
              );

              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isActive
                      ? 'bg-brand-50/70 font-semibold text-brand-950 ring-1 ring-inset ring-brand-300'
                      : 'hover:bg-industrial-50 text-industrial-700'
                  }`}
                >
                  <td className="py-2.5 px-4 flex items-center gap-2">
                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                    <span>
                      {tier.minQty}
                      {tier.maxQty ? ` - ${tier.maxQty}` : '+'} {product.unit}s
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-industrial-950">
                    {formatINR(tier.pricePerUnit)}
                  </td>
                  <td className="py-2.5 px-4">
                    {discount > 0 ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                        <Percent className="w-2.5 h-2.5" />
                        {discount}% OFF
                      </span>
                    ) : (
                      <span className="text-industrial-400 text-[11px]">Base Rate</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {onSelectTierQuantity && (
                      <button
                        type="button"
                        onClick={() => onSelectTierQuantity(tier.minQty)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          isActive
                            ? 'bg-brand-600 text-white border-brand-600 font-bold'
                            : 'border-industrial-300 hover:border-brand-500 hover:text-brand-600 text-industrial-600'
                        }`}
                      >
                        {isActive ? 'Active Tier' : `Select ${tier.minQty} ${product.unit}`}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
