import { create } from 'zustand';
import type { Product } from '../types';

interface RFQModalState {
  isOpen: boolean;
  prefilledProduct: Product | null;
  openRFQModal: (product?: Product | null) => void;
  closeRFQModal: () => void;
}

export const useRFQModalStore = create<RFQModalState>((set) => ({
  isOpen: false,
  prefilledProduct: null,
  openRFQModal: (product = null) => set({ isOpen: true, prefilledProduct: product }),
  closeRFQModal: () => set({ isOpen: false, prefilledProduct: null }),
}));
