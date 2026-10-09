import { create } from 'zustand';

export type AuthModalMode = 'login' | 'register';

interface AuthModalState {
  isOpen: boolean;
  initialMode: AuthModalMode;
  initialPhone: string;
  openAuthModal: (mode?: unknown, phone?: string) => void;
  closeAuthModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  initialMode: 'login',
  initialPhone: '',
  openAuthModal: (mode?: unknown, phone?: string) => {
    const validMode: AuthModalMode = mode === 'register' ? 'register' : 'login';
    set({
      isOpen: true,
      initialMode: validMode,
      initialPhone: typeof phone === 'string' ? phone : '',
    });
  },
  closeAuthModal: () =>
    set({ isOpen: false, initialMode: 'login', initialPhone: '' }),
}));
