import type { Product } from '../types';

export interface TaxCalculationResult {
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  grandTotal: number;
}

/**
 * Calculate GST according to Indian tax regulations
 * Intra-state: CGST (gstRate/2) + SGST (gstRate/2)
 * Inter-state: IGST (gstRate)
 */
export function calculateGst(
  taxableAmount: number,
  gstRate: number,
  isInterState = false
): TaxCalculationResult {
  const totalGst = (taxableAmount * gstRate) / 100;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    igst = totalGst;
  } else {
    cgst = totalGst / 2;
    sgst = totalGst / 2;
  }

  return {
    taxableAmount,
    gstRate,
    cgst: Number(cgst.toFixed(2)),
    sgst: Number(sgst.toFixed(2)),
    igst: Number(igst.toFixed(2)),
    totalGst: Number(totalGst.toFixed(2)),
    grandTotal: Number((taxableAmount + totalGst).toFixed(2)),
  };
}

/**
 * Find matching bulk tier and calculate unit price, discount, and savings
 */
export function calculateBulkPrice(product: Product, quantity: number): {
  unitPrice: number;
  basePrice: number;
  total: number;
  savings: number;
  discountPercent: number;
  activeTierIndex: number;
} {
  const basePrice = product.price;
  let selectedUnitPrice = basePrice;
  let activeTierIndex = -1;

  if (product.bulkPricing && product.bulkPricing.length > 0) {
    for (let i = 0; i < product.bulkPricing.length; i++) {
      const tier = product.bulkPricing[i];
      if (quantity >= tier.minQty && (tier.maxQty === null || quantity <= tier.maxQty)) {
        selectedUnitPrice = tier.pricePerUnit;
        activeTierIndex = i;
        break;
      }
    }
  }

  const baseTotal = basePrice * quantity;
  const actualTotal = selectedUnitPrice * quantity;
  const savings = Math.max(0, baseTotal - actualTotal);
  const discountPercent = basePrice > 0 ? Math.round(((basePrice - selectedUnitPrice) / basePrice) * 100) : 0;

  return {
    unitPrice: selectedUnitPrice,
    basePrice,
    total: actualTotal,
    savings,
    discountPercent,
    activeTierIndex,
  };
}
