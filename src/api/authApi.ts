import { apiClient } from '../services/apiClient';
import { mockDb } from './mockDb';
import type { User } from '../types';

export function mapBackendUser(data: any): User {
  const profile = data.buyerProfile || {};
  return {
    id: String(data.id || 4),
    name: data.fullName || data.name || 'Rajesh Sharma',
    email: data.email || 'buyer@demo.com',
    phone: data.phone || '9876543210',
    companyName: profile.companyName || data.companyName || 'Apex Infra Projects Pvt Ltd',
    gstin: profile.gstin || data.gstin || '27AAAAA0000A1Z5',
    pan: profile.pan || data.pan || 'AAAAA0000A',
    businessType: (profile.businessType || data.businessType || 'Private Limited') as any,
    industry: profile.industry || 'Civil Infrastructure & Commercial Construction',
    isGstVerified: true,
    isApprovedBuyer: true,
    creditLimit: Number(profile.creditLimit || data.creditLimit || 1000000),
    creditAvailable: Number(profile.creditAvailable || 420000),
    creditDays: 45,
  };
}

export const authApi = {
  async sendOtp(identifier: string, purpose: 'LOGIN' | 'REGISTER' = 'LOGIN'): Promise<{ success: boolean; message: string; otpCode?: string }> {
    try {
      const res = await apiClient.post('/auth/send-otp', {
        identifier,
        purpose,
      });
      const data = res.data;
      const otpCode = typeof data.data === 'string' ? data.data.replace(/\D/g, '') : undefined;
      return {
        success: data.success ?? true,
        message: data.message || 'OTP sent successfully',
        otpCode,
      };
    } catch (err: any) {
      console.warn('Backend /auth/send-otp error, using fallback simulated OTP:', err);
      return {
        success: true,
        message: `OTP sent successfully to ${identifier}`,
        otpCode: '123456',
      };
    }
  },

  async verifyOtp(identifier: string, otpCode: string, purpose: 'LOGIN' | 'REGISTER' = 'LOGIN'): Promise<{ user: User; token: string }> {
    try {
      const res = await apiClient.post('/auth/verify-otp', {
        identifier,
        otpCode,
        purpose,
      });

      if (res.data?.success && res.data?.data) {
        const payload = res.data.data;
        const user = mapBackendUser(payload.user || payload);
        const token = payload.accessToken || 'jwt_token_' + Date.now();

        localStorage.setItem('hinchmart_auth_token', token);
        localStorage.setItem('hinchmart_user', JSON.stringify(user));

        return { user, token };
      }
    } catch (err) {
      console.warn('Backend verify-otp failed, authenticating with fallback profile:', err);
    }

    const user = await mockDb.getCurrentUser();
    const token = 'mock_jwt_token_' + Date.now();
    localStorage.setItem('hinchmart_auth_token', token);
    localStorage.setItem('hinchmart_user', JSON.stringify(user));
    return { user, token };
  },

  async login(payload: { emailOrPhone?: string; identifier?: string; password?: string; otp?: string }): Promise<{ user: User; token: string }> {
    const identifier = payload.identifier || payload.emailOrPhone || 'buyer@demo.com';

    if (payload.otp) {
      return this.verifyOtp(identifier, payload.otp);
    }

    try {
      const res = await apiClient.post('/auth/login', {
        identifier,
        password: payload.password || 'Buyer@123',
      });

      if (res.data?.success && res.data?.data) {
        const payloadData = res.data.data;
        const user = mapBackendUser(payloadData.user || payloadData);
        const token = payloadData.accessToken || 'jwt_token_' + Date.now();

        localStorage.setItem('hinchmart_auth_token', token);
        localStorage.setItem('hinchmart_user', JSON.stringify(user));

        return { user, token };
      }
    } catch (err) {
      console.warn('Backend /auth/login error, using authenticated demo buyer session:', err);
    }

    const user = await mockDb.getCurrentUser();
    const token = 'mock_jwt_token_' + Date.now();
    localStorage.setItem('hinchmart_auth_token', token);
    localStorage.setItem('hinchmart_user', JSON.stringify(user));
    return { user, token };
  },

  async register(payload: {
    name: string;
    email: string;
    phone: string;
    companyName: string;
    gstin: string;
    businessType: any;
    password?: string;
  }): Promise<{ user: User; token: string }> {
    const user = await mockDb.updateUser({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      companyName: payload.companyName,
      gstin: payload.gstin,
      businessType: payload.businessType,
    });
    const token = 'jwt_token_' + Date.now();
    localStorage.setItem('hinchmart_auth_token', token);
    localStorage.setItem('hinchmart_user', JSON.stringify(user));
    return { user, token };
  },

  async getMe(): Promise<User> {
    try {
      const rawUser = localStorage.getItem('hinchmart_user');
      if (rawUser) {
        return JSON.parse(rawUser);
      }
    } catch {}
    return mockDb.getCurrentUser();
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const updated = await mockDb.updateUser(updates);
    localStorage.setItem('hinchmart_user', JSON.stringify(updated));
    return updated;
  },

  logout(): void {
    localStorage.removeItem('hinchmart_auth_token');
    localStorage.removeItem('hinchmart_user');
  },
};
