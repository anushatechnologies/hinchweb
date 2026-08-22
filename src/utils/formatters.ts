import type { ProductUnit } from '../types';

/**
 * Format a number into Indian Rupee currency format (e.g. ₹3,61,220)
 */
export function formatINR(amount: number | undefined | null, showDecimals = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }

  const rounded = showDecimals ? amount.toFixed(2) : Math.round(amount).toString();
  const parts = rounded.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] ? `.${parts[1]}` : '';

  const isNegative = integerPart.startsWith('-');
  if (isNegative) {
    integerPart = integerPart.substring(1);
  }

  // Indian Rupee formatting: last 3 digits, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);

  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }

  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}₹${formatted}${decimalPart}`;
}

/**
 * Format price with unit (e.g. ₹61,500 / Ton)
 */
export function formatPriceWithUnit(price: number, unit: ProductUnit): string {
  return `${formatINR(price)} / ${unit}`;
}

/**
 * Format standard readable dates (e.g. 22 Aug 2026)
 */
export function formatDate(dateStr: string | Date): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date with time (e.g. 22 Aug 2026, 11:30 AM)
 */
export function formatDateTime(dateStr: string | Date): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Relative time ago (e.g. "10 mins ago", "2 hours ago", "Yesterday")
 */
export function formatTimeAgo(dateStr: string | Date): string {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  return formatDate(date);
}

/**
 * Mask sensitive GSTIN for public displays (e.g. 36AAACG1234F1Z -> 36*****1Z)
 */
export function maskGSTIN(gstin: string): string {
  if (!gstin || gstin.length < 8) return gstin;
  return `${gstin.slice(0, 2)}*****${gstin.slice(-2)}`;
}

/**
 * Mask mobile numbers for privacy (e.g. +91 9876543210 -> +91 98*** **210)
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  return `${phone.slice(0, 4)}*** **${phone.slice(-3)}`;
}
