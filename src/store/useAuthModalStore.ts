import { create } from 'zustand';

interface AuthModalState {
  isOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  openAuthModal: () => set({ isOpen: true }),
  closeAuthModal: () => set({ isOpen: false }),
}));
