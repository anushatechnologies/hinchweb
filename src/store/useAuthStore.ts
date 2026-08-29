import { create } from 'zustand';
import type { User, Address } from '../types';
import { authApi } from '../api/authApi';
import { addressApi } from '../api/addressApi';

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
    set({ isLoading: true });
    try {
      const user = await authApi.getProfile();
      set({ user, isLoading: false, isAuthenticated: true });
    } catch (error) {
      console.warn('Could not fetch user profile from backend:', error);
      set({ isLoading: false });
    }
  },

  fetchAddresses: async () => {
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
      set({ user, isLoading: false, isAuthenticated: true });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
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
    authApi.logout();
    set({ user: emptyUser, isAuthenticated: false, addresses: [] });
  },

  updateUser: async (updates: Partial<User>) => {
    set({ isLoading: true });
    try {
      const updatedUser = await authApi.updateProfile(updates);
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
