import { create } from 'zustand';

interface CartSnackbarState {
  isVisible: boolean;
  productTitle: string;
  showSnackbar: (productTitle: string) => void;
  hideSnackbar: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useCartSnackbarStore = create<CartSnackbarState>((set) => ({
  isVisible: false,
  productTitle: '',

  showSnackbar: (productTitle: string) => {
    // Clear any existing auto-hide
    if (hideTimer) clearTimeout(hideTimer);

    set({ isVisible: true, productTitle });

    hideTimer = setTimeout(() => {
      set({ isVisible: false });
    }, 4000);
  },

  hideSnackbar: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ isVisible: false });
  },
}));
