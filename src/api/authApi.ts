import { apiClient } from '../services/apiClient';
import type { User, UpdateUserProfileInput } from '../types';

export function mapBackendUser(data: any): User {
  if (!data) throw new Error('Invalid user payload');
  const business = data.business || {};
  const stats = data.procurementStats || {
    totalOrders: 0,
    activeRfqs: 0,
    wishlistItems: 0,
    savedAddresses: 0,
  };

  return {
    id: data.id || data.userId || 0,
    name: data.fullName || data.name || '',
    fullName: data.fullName || data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    role: data.role || 'BUYER',
    tier: data.tier || 'STANDARD',
    isProfileComplete: data.isProfileComplete ?? false,
    companyName: business.companyName || data.companyName || '',
    gstin: business.gstNumber || data.gstin || '',
    pan: business.panNumber || data.pan || '',
    businessType: business.businessType || data.businessType || 'Enterprise Buyer',
    industry: data.industry || 'Industrial & Construction',
    isGstVerified: Boolean(business.isGstVerified ?? data.isGstVerified),
    isApprovedBuyer: Boolean(data.isApprovedBuyer ?? true),
    creditLimit: Number(business.creditLimit ?? data.creditLimit ?? 0),
    creditAvailable: Number(business.availableCredit ?? data.creditAvailable ?? 0),
    creditDays: Number(data.creditDays || 30),
    business: {
      companyName: business.companyName || data.companyName || '',
      gstNumber: business.gstNumber || data.gstin || '',
      panNumber: business.panNumber || data.pan || '',
      businessType: business.businessType || data.businessType || '',
      isGstVerified: Boolean(business.isGstVerified ?? data.isGstVerified),
      creditLimit: Number(business.creditLimit ?? data.creditLimit ?? 0),
      availableCredit: Number(business.availableCredit ?? data.creditAvailable ?? 0),
    },
    procurementStats: stats,
  };
}

export const authApi = {
  // 6.1 Get User Profile
  async getProfile(): Promise<User> {
    const res = await apiClient.get('/user/profile');
    if (res.data?.success && res.data?.data) {
      return mapBackendUser(res.data.data);
    }
    if (res.data?.id || res.data?.email) {
      return mapBackendUser(res.data);
    }
    throw new Error('Failed to retrieve user profile');
  },

  // 6.2 Update User Profile
  async updateProfile(payload: UpdateUserProfileInput): Promise<User> {
    const res = await apiClient.put('/user/profile', payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendUser(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to update profile');
  },

  // Send OTP
  async sendOTP(phone: string, purpose?: string): Promise<{ success: boolean; message: string; otpCode?: string }> {
    const res = await apiClient.post('/auth/send-otp', { phone, purpose });
    return res.data;
  },

  async sendOtp(phone: string, purpose?: string): Promise<{ success: boolean; message: string; otpCode?: string }> {
    return this.sendOTP(phone, purpose);
  },

  // Verify OTP & Login
  async verifyOTP(phone: string, otp: string, purpose?: string): Promise<{ token: string; user: User }> {
    const res = await apiClient.post('/auth/verify-otp', { phone, otp, purpose });
    const token = res.data?.token || res.data?.data?.token || '';
    if (token) {
      localStorage.setItem('hinchmart_auth_token', token);
    }
    const user = mapBackendUser(res.data?.data?.user || res.data?.user || res.data?.data);
    return { token, user };
  },

  async verifyOtp(phone: string, otp: string, purpose?: string): Promise<{ token: string; user: User }> {
    return this.verifyOTP(phone, otp, purpose);
  },

  // Login with credentials
  async login(payload: { identifier: string; password?: string }): Promise<{ token: string; user: User }> {
    const res = await apiClient.post('/auth/login', payload);
    const token = res.data?.token || res.data?.data?.token || '';
    if (token) {
      localStorage.setItem('hinchmart_auth_token', token);
    }
    const user = mapBackendUser(res.data?.data?.user || res.data?.user || res.data?.data);
    return { token, user };
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('hinchmart_auth_token');
    }
  },
};
