import { create } from 'zustand';
import type { User, Address } from '../types';
import { authApi } from '../api/authApi';
import { addressApi } from '../api/addressApi';
import { INITIAL_USER, INITIAL_ADDRESSES } from '../api/mockData';

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
  user: INITIAL_USER,
  addresses: INITIAL_ADDRESSES,
  isLoading: false,
  isAuthenticated: true,

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const user = await authApi.getMe();
      set({ user, isLoading: false, isAuthenticated: true });
    } catch (error) {
      console.error('Failed to fetch user', error);
      set({ isLoading: false });
    }
  },

  fetchAddresses: async () => {
    try {
      const addresses = await addressApi.getAddresses();
      set({ addresses });
    } catch (error) {
      console.error('Failed to fetch addresses', error);
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
    set({ user: INITIAL_USER, isAuthenticated: false });
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
      addresses: state.addresses.map((a) => (a.id === id ? updated : a)),
    }));
    return updated;
  },

  deleteAddress: async (id: string) => {
    await addressApi.deleteAddress(id);
    set((state) => ({
      addresses: state.addresses.filter((a) => a.id !== id),
    }));
  },
}));
