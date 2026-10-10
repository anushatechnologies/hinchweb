import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { useVariantModalStore } from '../../store/useVariantModalStore';
import { useRFQModalStore } from '../../store/useRFQModalStore';
import { formatINR } from '../../utils/formatters';
import { calculateBulkPrice } from '../../utils/tax';
import {
  Star,
  ShieldCheck,
  Plus,
  Minus,
  ShoppingCart,
  FileText,
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { openVariantModal } = useVariantModalStore();
  const { openRFQModal } = useRFQModalStore();

  const [quantity, setQuantity] = useState<number>(1);

  const pricing = calculateBulkPrice(product, quantity);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openVariantModal(product);
  };

  const handleQuickRFQ = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openRFQModal(product);
  };

  return (
    <div className="group bg-white rounded-2xl border border-industrial-200 hover:border-brand-300 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Badges Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
        {product.isBulkDeal && (
          <span className="bg-gradient-to-r from-rose-600 to-orange-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md shadow-sm">
            Bulk Deal
          </span>
        )}
        <span className="bg-industrial-900/90 text-white text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs">
          MOQ: {product.moq} {product.unit}
        </span>
      </div>

      <div className="absolute top-3 right-3 z-10">
        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
          GST {product.gstRate}%
        </span>
      </div>

      {/* Product Image */}
      <Link to={`/product/${product.slug || product.id}`} className="relative aspect-4/3 overflow-hidden bg-industrial-100/60">
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-industrial-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </Link>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Brand & HSN */}
          <div className="flex items-center justify-between text-[11px] text-industrial-500">
            <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
              {product.brand}
            </span>
            <span className="font-mono text-industrial-400">HSN: {product.hsnCode}</span>
          </div>

          {/* Title */}
          <Link
            to={`/product/${product.slug || product.id}`}
            className="block font-bold text-sm text-industrial-900 hover:text-brand-600 line-clamp-2 leading-snug transition-colors"
          >
            {product.title}
          </Link>

          {/* Seller Verified Rating */}
          <div className="flex items-center gap-2 text-xs text-industrial-600 pt-0.5">
            <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded font-bold text-[11px] border border-amber-200">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{product.rating}</span>
            </div>
            <span className="text-[11px] text-industrial-400">({product.ratingCount} orders)</span>
            <div className="flex items-center gap-0.5 text-[11px] text-emerald-700 font-medium ml-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{product.seller.city}</span>
            </div>
          </div>
        </div>

        {/* Pricing Tier Matrix Preview */}
        <div className="bg-industrial-50 p-2.5 rounded-xl border border-industrial-200 space-y-1">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-lg font-black text-industrial-950">
                {formatINR(pricing.unitPrice)}
              </span>
              <span className="text-xs text-industrial-500 ml-1">/ {product.unit}</span>
            </div>
            {pricing.savings > 0 && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Save {pricing.discountPercent}%
              </span>
            )}
          </div>

          <div className="text-[10px] text-industrial-500 flex items-center justify-between">
            <span>Base: {formatINR(product.price)}/{product.unit}</span>
            <span className="text-industrial-600">⚡ {product.deliveryDays} Days Transit</span>
          </div>
        </div>

        {/* Quantity Stepper & Add to Cart / RFQ */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap sm:flex-nowrap items-stretch sm:items-center gap-2">
            <div className="flex items-center justify-between sm:justify-start bg-industrial-100 rounded-xl p-0.5 border border-industrial-300 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-7 h-7 flex items-center justify-center text-industrial-700 hover:bg-white rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setQuantity(isNaN(val) || val < 1 ? 1 : val);
                }}
                className="w-10 text-center font-mono font-bold text-xs text-industrial-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[10px] text-industrial-500 font-semibold pr-1">
                {product.unit}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 flex items-center justify-center text-industrial-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 min-w-[110px] py-2 px-3 bg-brand-600 hover:bg-brand-500 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleQuickRFQ}
            className="w-full py-1.5 px-3 bg-industrial-50 hover:bg-industrial-100 text-industrial-700 border border-industrial-200 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <FileText className="w-3 h-3 text-brand-600" />
            <span>Request Custom Bulk Quotation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
