import { create } from 'zustand';
import type { User, Address } from '../types';
import { authApi, type SyncUserPayload, type ProfileUpdatePayload } from '../api/authApi';
import { addressApi } from '../api/addressApi';
import { signOutFirebase } from '../services/firebase';
import { tokenStorage } from '../services/tokenStorage';

const emptyUser: User = {
  id: '',
  name: '',
  fullName: '',
  email: '',
  phone: '',
  companyName: '',
  gstin: '',
  pan: '',
  panNumber: '',
  businessType: 'Enterprise Buyer',
  industry: '',
  isGstVerified: false,
  isApprovedBuyer: false,
  isProfileComplete: false,
  creditLimit: 0,
  creditAvailable: 0,
  creditDays: 30,
};

export interface AuthState {
  user: User;
  accessToken: string | null;
  addresses: Address[];
  isLoading: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Lifecycle & Session
  initAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchAddresses: () => Promise<void>;
  refreshProfile: () => Promise<User>;

  // Authentication Flow
  checkPhone: (phone: string) => Promise<{ exists: boolean; message?: string }>;
  syncWithBackend: (
    firebaseIdToken: string,
    profileDetails?: { name?: string | null; phone?: string | null; email?: string | null }
  ) => Promise<User>;
  loginWithFirebaseToken: (token: string, initialDetails?: SyncUserPayload) => Promise<User>;
  completeProfile: (payload: {
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    gstin?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;

  // Profile & Address Management
  updateUser: (updates: Partial<User>) => Promise<void>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<Address>;
  updateAddress: (id: string, updates: Partial<Address>) => Promise<Address>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string | number) => Promise<Address | null>;
  getAddressById: (id: string | number) => Promise<Address | null>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Listen for window-level unauthorized & token-refreshed events
  if (typeof window !== 'undefined') {
    window.addEventListener('hinchmart:unauthorized', () => {
      set({
        user: emptyUser,
        accessToken: null,
        isAuthenticated: false,
        addresses: [],
        error: 'Your session has expired. Please sign in again.',
      });
    });

    window.addEventListener('hinchmart:token-refreshed', (e: Event) => {
      const custom = e as CustomEvent<{ token: string }>;
      if (custom.detail?.token) {
        set({ accessToken: custom.detail.token, isAuthenticated: true });
      }
    });
  }

  const initialToken = tokenStorage.getAccessToken();
  const cachedUser = tokenStorage.getUser();

  return {
    user: cachedUser || emptyUser,
    accessToken: initialToken,
    addresses: [],
    isLoading: false,
    isInitializing: Boolean(initialToken),
    isAuthenticated: Boolean(initialToken),
    error: null,

    clearError: () => set({ error: null }),

    /**
     * Session restoration on application mount.
     * Verifies the stored JWT against GET /api/auth/me and loads the authoritative profile.
     */
    initAuth: async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        set({
          user: emptyUser,
          accessToken: null,
          isAuthenticated: false,
          isInitializing: false,
        });
        return;
      }

      set({ isInitializing: true });
      try {
        const user = await authApi.getMe();
        set({
          user,
          accessToken: tokenStorage.getAccessToken(),
          isAuthenticated: true,
          isInitializing: false,
          error: null,
        });
        // Fetch addresses in background after valid session confirmation
        get().fetchAddresses().catch(() => {});
      } catch (err: any) {
        // If recovery via apiClient 401 handler also failed, clean up
        const currentToken = tokenStorage.getAccessToken();
        if (!currentToken) {
          set({
            user: emptyUser,
            accessToken: null,
            isAuthenticated: false,
            isInitializing: false,
          });
        } else {
          // If token was successfully refreshed by recovery handler
          try {
            const user = await authApi.getMe();
            set({
              user,
              accessToken: currentToken,
              isAuthenticated: true,
              isInitializing: false,
            });
            get().fetchAddresses().catch(() => {});
          } catch {
            tokenStorage.clearSession();
            set({
              user: emptyUser,
              accessToken: null,
              isAuthenticated: false,
              isInitializing: false,
            });
          }
        }
      }
    },

    fetchUser: async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        set({ user: emptyUser, isAuthenticated: false, accessToken: null });
        return;
      }
      set({ isLoading: true });
      try {
        const user = await authApi.getMe();
        set({
          user,
          accessToken: tokenStorage.getAccessToken(),
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } catch (error: any) {
        set({ isLoading: false });
        if (error?.statusCode === 401) {
          tokenStorage.clearSession();
          set({ user: emptyUser, isAuthenticated: false, accessToken: null });
        }
      }
    },

    fetchAddresses: async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        set({ addresses: [] });
        return;
      }
      try {
        const addresses = await addressApi.getAddresses();
        set({ addresses });
      } catch (error) {
        console.warn('Could not fetch site addresses from backend:', error);
      }
    },

    checkPhone: async (phone: string) => {
      return authApi.checkPhone(phone);
    },

    /**
     * Core authentication step: Exchange Firebase ID Token for HinchMart JWT.
     * POST /api/auth/sync
     */
    syncWithBackend: async (firebaseIdToken: string, profileDetails) => {
      set({ isLoading: true, error: null });
      try {
        const syncResponse = await authApi.syncUser(firebaseIdToken, profileDetails);
        set({
          user: syncResponse.user,
          accessToken: syncResponse.accessToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        // Fetch addresses on successful authentication
        get().fetchAddresses().catch(() => {});
        return syncResponse.user;
      } catch (err: any) {
        set({
          isLoading: false,
          error: err.message || 'Failed to authenticate with backend server.',
        });
        throw err;
      }
    },

    // Backwards-compatible alias for existing callers
    loginWithFirebaseToken: async (token: string, initialDetails?: SyncUserPayload) => {
      return get().syncWithBackend(token, initialDetails);
    },

    /**
     * Complete user profile with real name and work email (PUT /api/user/profile)
     */
    completeProfile: async (payload) => {
      set({ isLoading: true, error: null });
      try {
        const updatedUser = await authApi.updateProfile({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          companyName: payload.companyName,
          gstNumber: payload.gstin,
        });
        set({ user: updatedUser, isLoading: false, isAuthenticated: true });
        return updatedUser;
      } catch (err: any) {
        set({ isLoading: false, error: err.message || 'Failed to update profile' });
        throw err;
      }
    },

    /**
     * Secure logout:
     * - Informs backend (/api/auth/logout)
     * - Signs out of Firebase
     * - Clears local token and user storage
     * - Resets application state and user caches
     */
    logout: async () => {
      try {
        await authApi.logout();
      } catch {
        // Ignore backend logout errors
      }
      try {
        await signOutFirebase();
      } catch {
        // Ignore Firebase signout errors
      }
      tokenStorage.clearSession();
      set({
        user: emptyUser,
        accessToken: null,
        isAuthenticated: false,
        addresses: [],
        error: null,
      });

      // Clear cached user data in other stores if needed
      try {
        const cartState = (window as any).__hinchmart_reset_cart;
        if (typeof cartState === 'function') cartState();
      } catch {
        // Ignore
      }
    },

    updateUser: async (updates: Partial<User>) => {
      set({ isLoading: true });
      try {
        const updatedUser = await authApi.updateProfile(updates as ProfileUpdatePayload);
        set({ user: updatedUser, isLoading: false });
      } catch (error: any) {
        set({ isLoading: false, error: error.message || 'Failed to update profile' });
      }
    },

    addAddress: async (addr: Omit<Address, 'id'>) => {
      const newAddress = await addressApi.addAddress(addr);
      set((state) => ({ addresses: [...state.addresses, newAddress] }));
      return newAddress;
    },

    updateAddress: async (id: string, updates: Partial<Address>) => {
      const updated = await addressApi.updateAddress(id, updates);
      set((state) => ({
        addresses: state.addresses.map((a) => (a.id === id || a.addressId === Number(id) ? updated : a)),
      }));
      return updated;
    },

    deleteAddress: async (id: string) => {
      await addressApi.deleteAddress(id);
      set((state) => ({
        addresses: state.addresses.filter((a) => a.id !== id && a.addressId !== Number(id)),
      }));
    },

    setDefaultAddress: async (id: string | number) => {
      const updated = await addressApi.setDefaultAddress(id);
      set((state) => ({
        addresses: state.addresses.map((a) => ({
          ...a,
          isDefault: a.id === String(id) || a.addressId === Number(id),
          isDefaultDelivery: a.id === String(id) || a.addressId === Number(id),
        })),
      }));
      return updated;
    },

    getAddressById: async (id: string | number) => {
      return addressApi.getAddressById(id);
    },

    refreshProfile: async () => {
      try {
        const user = await authApi.getProfile();
        set({ user });
        return user;
      } catch {
        const user = await authApi.getMe();
        set({ user });
        return user;
      }
    },
  };
});
