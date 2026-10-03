import { create } from 'zustand';
import type { User, Address } from '../types';
import { authApi, type SyncUserPayload, type ProfileUpdatePayload } from '../api/authApi';
import { addressApi } from '../api/addressApi';
import { signOutFirebase } from '../services/firebase';

const emptyUser: User = {
  id: '',
  name: '',
  fullName: '',
  email: '',
  phone: '',
  companyName: '',
  gstin: '',
  pan: '',
  businessType: 'Enterprise Buyer',
  industry: '',
  isGstVerified: false,
  isApprovedBuyer: false,
  isProfileComplete: false,
  creditLimit: 0,
  creditAvailable: 0,
  creditDays: 30,
};

interface AuthState {
  user: User;
  addresses: Address[];
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchUser: () => Promise<void>;
  fetchAddresses: () => Promise<void>;
  sendOtp: (identifier: string) => Promise<{ success: boolean; message: string; otpCode?: string }>;
  verifyOtp: (identifier: string, otpCode: string) => Promise<User>;
  loginWithFirebaseToken: (token: string, initialDetails?: SyncUserPayload) => Promise<User>;
  completeProfile: (payload: {
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    gstin?: string;
  }) => Promise<User>;
  loginWithPassword: (identifier: string, password: string) => Promise<User>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<Address>;
  updateAddress: (id: string, updates: Partial<Address>) => Promise<Address>;
  deleteAddress: (id: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: emptyUser,
  addresses: [],
  isLoading: false,
  isAuthenticated: Boolean(localStorage.getItem('hinchmart_auth_token')),

  fetchUser: async () => {
    const token = localStorage.getItem('hinchmart_auth_token');
    if (!token) {
      set({ user: emptyUser, isLoading: false, isAuthenticated: false });
      return;
    }
    set({ isLoading: true });
    try {
      // Endpoint 3: Session Restore via GET /api/auth/me
      const user = await authApi.getMe();
      set({ user, isLoading: false, isAuthenticated: true });
    } catch (error: any) {
      console.warn('Session restore via /auth/me notice:', error);
      if (error?.statusCode === 401) {
        localStorage.removeItem('hinchmart_auth_token');
        set({ user: emptyUser, isLoading: false, isAuthenticated: false });
      } else {
        try {
          const syncedUser = await authApi.syncUser();
          set({ user: syncedUser, isLoading: false, isAuthenticated: true });
        } catch (syncErr) {
          console.warn('Sync fallback also failed:', syncErr);
          set({ isLoading: false });
        }
      }
    }
  },

  fetchAddresses: async () => {
    const token = localStorage.getItem('hinchmart_auth_token');
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

  sendOtp: async (identifier: string) => {
    return authApi.sendOtp(identifier, 'LOGIN');
  },

  verifyOtp: async (identifier: string, otpCode: string) => {
    set({ isLoading: true });
    try {
      const { user } = await authApi.verifyOtp(identifier, otpCode, 'LOGIN');
      // Step 4 & 5: Synchronize with backend
      try {
        const synced = await authApi.syncUser();
        set({ user: synced, isLoading: false, isAuthenticated: true });
        return synced;
      } catch (syncErr) {
        console.warn('Backend syncUser notice:', syncErr);
      }
      set({ user, isLoading: false, isAuthenticated: true });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Step 4: Calls POST /api/auth/sync
   * Header: Authorization: Bearer <firebase_id_token>
   * Inspects response: if name or email is null, isProfileComplete is false
   */
  loginWithFirebaseToken: async (token: string, initialDetails?: SyncUserPayload) => {
    localStorage.setItem('hinchmart_auth_token', token);
    set({ isLoading: true });
    try {
      const user = await authApi.syncUser(initialDetails || {});
      set({ user, isLoading: false, isAuthenticated: true });
      return user;
    } catch (err: any) {
      set({ isLoading: false });
      throw err;
    }
  },

  /**
   * Step 7: Profile Completion (PUT /api/user/profile)
   */
  completeProfile: async (payload: {
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    gstin?: string;
  }) => {
    set({ isLoading: true });
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
      set({ isLoading: false });
      throw err;
    }
  },

  loginWithPassword: async (identifier: string, password: string) => {
    set({ isLoading: true });
    try {
      const { user } = await authApi.login({ identifier, password });
      set({ user, isLoading: false, isAuthenticated: true });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    signOutFirebase().catch(() => {});
    authApi.logout();
    set({ user: emptyUser, isAuthenticated: false, addresses: [] });
  },

  updateUser: async (updates: Partial<User>) => {
    set({ isLoading: true });
    try {
      const updatedUser = await authApi.updateProfile(updates as ProfileUpdatePayload);
      set({ user: updatedUser, isLoading: false });
    } catch (error) {
      console.error('Failed to update profile', error);
      set({ isLoading: false });
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
}));
