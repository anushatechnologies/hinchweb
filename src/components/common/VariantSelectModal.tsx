import React, { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart, Star, ShieldCheck, Percent } from 'lucide-react';
import { useVariantModalStore } from '../../store/useVariantModalStore';
import { useCartStore } from '../../store/useCartStore';
import { useCartSnackbarStore } from '../../store/useCartSnackbarStore';
import { formatINR } from '../../utils/formatters';
import { calculateBulkPrice } from '../../utils/tax';

// Derives "variant groups" from product specifications
// Groups specs that have multiple products share differently (e.g., colour, size, grade)
const VARIANT_LIKE_SPEC_KEYS = [
  'colour', 'color', 'size', 'nominal size', 'grade', 'thickness',
  'diameter', 'length', 'width', 'type', 'finish', 'material',
];

interface SpecGroup {
  label: string;
  options: string[];
}

function deriveVariantGroups(specs: { name: string; value: string }[]): SpecGroup[] {
  const groups: SpecGroup[] = [];
  for (const spec of specs) {
    const isVariant = VARIANT_LIKE_SPEC_KEYS.some((k) =>
      spec.name.toLowerCase().includes(k)
    );
    if (isVariant) {
      // Split comma-separated values as multiple options
      const options = spec.value
        .split(/[,|\/]/)
        .map((v) => v.trim())
        .filter(Boolean);
      groups.push({ label: spec.name, options });
    }
  }
  return groups;
}

export const VariantSelectModal: React.FC = () => {
  const { isOpen, product, closeVariantModal } = useVariantModalStore();
  const { addItem } = useCartStore();
  const { showSnackbar } = useCartSnackbarStore();

  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [visible, setVisible] = useState(false);

  // Animate in on open
  useEffect(() => {
    if (isOpen) {
      // Tiny delay for enter animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Reset selections when product changes
  useEffect(() => {
    if (product) {
      setQuantity(product.moq ?? 1);
      setSelectedVariants({});
    }
  }, [product]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(closeVariantModal, 280);
  }, [closeVariantModal]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handleClose]);

  if (!isOpen || !product) return null;

  const variantGroups = deriveVariantGroups(product.specifications ?? []);
  const pricing = calculateBulkPrice(product, quantity);

  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : pricing.discountPercent ?? 0;

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addItem(product, quantity);
      handleClose();
      // show the Moglix-style snackbar
      showSnackbar(product.title);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[998] transition-all duration-300"
        style={{
          backgroundColor: visible ? 'rgba(2, 6, 23, 0.6)' : 'rgba(2, 6, 23, 0)',
          backdropFilter: visible ? 'blur(4px)' : 'blur(0px)',
        }}
        onClick={handleClose}
        aria-label="Close variant modal"
      />

      {/* Modal Sheet — slides up from bottom on mobile, centered on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select Variant"
        className="fixed z-[999] w-full sm:w-[420px] bg-white shadow-2xl overflow-hidden"
        style={{
          bottom: 0,
          left: '50%',
          transform: `translateX(-50%) translateY(${visible ? '0%' : '100%'})`,
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          borderRadius: '20px 20px 0 0',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-black text-gray-900">Select Variant</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Product Identity Row */}
          <div className="flex gap-4 items-start pb-4 border-b border-gray-100">
            {(product.images?.[0] || product.imageUrl) && (
              <img
                src={product.images?.[0] || product.imageUrl}
                alt={product.title}
                className="w-20 h-20 rounded-xl object-cover border border-gray-200 bg-gray-50 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-black text-gray-900 leading-snug line-clamp-2">
                {product.title}
              </p>
              <p className="text-xs font-semibold text-brand-600">{product.brand}</p>

              {/* Rating */}
              {product.rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[11px] font-bold">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    {product.rating}
                  </span>
                  {product.ratingCount && (
                    <span className="text-[11px] text-gray-400">({product.ratingCount})</span>
                  )}
                  {product.seller?.city && (
                    <span className="flex items-center gap-0.5 text-[11px] text-emerald-600 font-medium ml-auto">
                      <ShieldCheck className="w-3 h-3" />
                      {product.seller.city}
                    </span>
                  )}
                </div>
              )}

              {/* Pricing */}
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-xl font-black text-gray-900">
                  {formatINR(pricing.unitPrice)}
                </span>
                {product.mrp && product.mrp > product.price && (
                  <>
                    <span className="text-xs text-gray-400 line-through font-mono">
                      {formatINR(product.mrp)}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600">
                      {discountPercent}% OFF
                    </span>
                  </>
                )}
                {!product.mrp && pricing.discountPercent > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    <Percent className="w-2.5 h-2.5" />
                    Save {pricing.discountPercent}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Variant Groups derived from specifications */}
          {variantGroups.length > 0 ? (
            variantGroups.map((group) => (
              <div key={group.label} className="space-y-3">
                <p className="text-sm font-black text-gray-900">Select {group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((opt) => {
                    const selected = selectedVariants[group.label] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() =>
                          setSelectedVariants((prev) => ({
                            ...prev,
                            [group.label]: selected ? '' : opt,
                          }))
                        }
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          selected
                            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-400'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            /* No variant specs — show key spec pills as info */
            product.specifications?.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-black text-gray-900">Specifications</p>
                <div className="flex flex-wrap gap-2">
                  {product.specifications.slice(0, 8).map((spec) => (
                    <span
                      key={spec.name}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 bg-gray-50 text-gray-700"
                    >
                      {spec.name}: {spec.value}
                    </span>
                  ))}
                </div>
              </div>
            ) : null
          )}

          {/* Quantity Selector */}
          <div className="space-y-2">
            <p className="text-sm font-black text-gray-900">Quantity</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-gray-300 bg-white overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(product.moq ?? 1, q - 1))}
                  disabled={quantity <= (product.moq ?? 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors cursor-pointer font-bold text-lg"
                >
                  −
                </button>
                <span className="w-12 text-center font-black text-sm text-gray-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer font-bold text-lg"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {product.unit} &nbsp;·&nbsp; MOQ: {product.moq} {product.unit}
              </span>
            </div>
          </div>

          {/* Bulk pricing hint */}
          {product.bulkPricing?.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
              <p className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wide">
                Bulk Tier Pricing
              </p>
              <div className="flex flex-wrap gap-2">
                {product.bulkPricing.slice(0, 4).map((tier, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-semibold bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-md"
                  >
                    {tier.minQty}
                    {tier.maxQty ? `–${tier.maxQty}` : '+'} {product.unit}: {formatINR(tier.pricePerUnit || tier.price || product.price)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky CTA */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0">
          {/* Total preview */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">
              Total ({quantity} {product.unit})
            </span>
            <span className="text-base font-black text-gray-900 font-mono">
              {formatINR(pricing.unitPrice * quantity)}
            </span>
          </div>
          <button
            id="variant-modal-continue-btn"
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-full py-4 bg-brand-600 hover:bg-brand-500 active:scale-[0.98] text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-70 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            {isAdding ? 'Adding…' : 'Continue'}
          </button>
        </div>
      </div>
    </>
  );
};
