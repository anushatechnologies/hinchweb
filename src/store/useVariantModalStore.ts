import { create } from 'zustand';
import type { Product } from '../types';

interface VariantModalState {
  isOpen: boolean;
  product: Product | null;
  openVariantModal: (product: Product) => void;
  closeVariantModal: () => void;
}

export const useVariantModalStore = create<VariantModalState>((set) => ({
  isOpen: false,
  product: null,

  openVariantModal: (product: Product) =>
    set({ isOpen: true, product }),

  closeVariantModal: () =>
    set({ isOpen: false, product: null }),
}));
