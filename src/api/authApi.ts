import { apiClient } from '../services/apiClient';
import { tokenStorage } from '../services/tokenStorage';
import type { User, UpdateUserProfileInput } from '../types';

export interface SyncUserPayload {
  firebaseIdToken?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface ProfileUpdatePayload {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  gstNumber?: string;
  panNumber?: string;
  businessType?: string;
}

export interface CheckPhoneResponse {
  exists: boolean;
  message?: string;
}

export interface AuthSyncResponse {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
  user: User;
}

export function mapBackendUser(data: any): User {
  if (!data) throw new Error('Invalid user payload');
  const business = data.business || {};
  const stats = data.procurementStats || {
    totalOrders: 0,
    activeRfqs: 0,
    wishlistItems: 0,
    savedAddresses: 0,
  };

  const id = data.userId || data.id || 0;
  const rawName = data.name || data.fullName || '';
  const rawEmail = data.email || '';
  const phone = data.phone || data.mobile || data.claims?.phone_number || '';

  const name = rawName && rawName.trim() !== '' ? rawName.trim() : '';
  const email = rawEmail && rawEmail.trim() !== '' ? rawEmail.trim() : '';

  // Use authoritative backend isProfileComplete flag if present; fallback to checking name & email
  const isProfileComplete = typeof data.isProfileComplete === 'boolean'
    ? data.isProfileComplete
    : Boolean(name && email);

  // Normalize role while preserving original case comparison
  const rawRole = (data.role || 'CUSTOMER').toUpperCase();
  const role = rawRole;

  return {
    id,
    userId: Number(data.userId || id || 0),
    firebaseUid: data.firebaseUid || '',
    name,
    fullName: name,
    email,
    phone,
    role,
    active: data.active ?? true,
    sellerId: data.sellerId ?? null,
    tier: data.tier || 'STANDARD',
    isProfileComplete,
    companyName: data.companyName || business.companyName || '',
    gstin: data.gstin || business.gstNumber || data.gstNumber || '',
    pan: data.pan || business.panNumber || data.panNumber || '',
    panNumber: data.pan || business.panNumber || data.panNumber || '',
    businessType: data.businessType || business.businessType || 'Buyer',
    industry: data.industry || '',
    isGstVerified: Boolean(data.isGstVerified ?? business.isGstVerified ?? false),
    isApprovedBuyer: Boolean(data.isApprovedBuyer ?? true),
    creditLimit: Number(data.creditLimit ?? business.creditLimit ?? 0),
    creditAvailable: Number(data.creditAvailable ?? data.availableCredit ?? business.availableCredit ?? 0),
    creditDays: Number(data.creditDays || 0),
    business: {
      companyName: data.companyName || business.companyName || '',
      gstNumber: data.gstin || business.gstNumber || '',
      panNumber: data.pan || business.panNumber || '',
      businessType: data.businessType || business.businessType || 'Buyer',
      isGstVerified: Boolean(data.isGstVerified ?? business.isGstVerified ?? false),
      creditLimit: Number(data.creditLimit ?? business.creditLimit ?? 0),
      availableCredit: Number(data.creditAvailable ?? data.availableCredit ?? business.availableCredit ?? 0),
    },
    procurementStats: stats,
  };
}

export const authApi = {
  /**
   * API 1: Check Phone
   * GET /api/auth/check-phone?phone=%2B919876543210
   */
  async checkPhone(phone: string): Promise<CheckPhoneResponse> {
    try {
      let formatted = phone.trim();
      if (!formatted.startsWith('+')) {
        const digits = formatted.replace(/\D/g, '');
        formatted = `+91${digits}`;
      }
      const res = await apiClient.get('/auth/check-phone', {
        params: { phone: formatted },
      });
      const data = res.data?.data || res.data;
      return {
        exists: Boolean(data?.exists),
        message: res.data?.message || '',
      };
    } catch {
      // Gracefully handle network or non-existent endpoint without blocking user
      return { exists: false };
    }
  },

  /**
   * API 2: Synchronize User and Exchange Tokens
   * POST /api/auth/sync
   * Body: { firebaseIdToken, name?, phone?, email? }
   * Header: Authorization: Bearer <firebaseIdToken>
   */
  async syncUser(
    firebaseIdToken: string,
    profileDetails?: { name?: string | null; phone?: string | null; email?: string | null }
  ): Promise<AuthSyncResponse> {
    if (!firebaseIdToken) {
      throw new Error('Firebase ID Token is required for backend synchronization');
    }

    const payload: Record<string, unknown> = {
      firebaseIdToken,
    };
    if (profileDetails?.name) payload.name = profileDetails.name;
    if (profileDetails?.phone) payload.phone = profileDetails.phone;
    if (profileDetails?.email) payload.email = profileDetails.email;

    const res = await apiClient.post('/auth/sync', payload, {
      headers: {
        Authorization: `Bearer ${firebaseIdToken}`,
      },
    });

    const body = res.data?.data || res.data;
    const accessToken = body?.accessToken || body?.token;

    if (!accessToken) {
      throw new Error('Backend response did not contain an access token');
    }

    const user = mapBackendUser(body);

    // Persist HinchMart JWT and active user profile
    tokenStorage.setAccessToken(accessToken);
    tokenStorage.setUser(user);

    return {
      accessToken,
      tokenType: body.tokenType || 'Bearer',
      expiresIn: body.expiresIn,
      user,
    };
  },

  /**
   * API 3: Current User Profile
   * GET /api/auth/me
   * Header: Authorization: Bearer <HINCHMART_JWT>
   */
  async getMe(): Promise<User> {
    try {
      const res = await apiClient.get('/auth/me');
      const body = res.data?.data || res.data;
      const user = mapBackendUser(body);
      tokenStorage.setUser(user);
      return user;
    } catch (err: any) {
      // If /auth/me returns 404, fallback to /user/profile
      if (err.statusCode === 404 || err.response?.status === 404) {
        return this.getProfile();
      }
      throw err;
    }
  },

  /**
   * API 4: Refresh Token
   * POST /api/auth/refresh-token
   */
  async refreshToken(): Promise<string> {
    const res = await apiClient.post('/auth/refresh-token');
    const body = res.data?.data || res.data;
    const newAccessToken = body?.accessToken || body?.token;
    if (newAccessToken) {
      tokenStorage.setAccessToken(newAccessToken);
      return newAccessToken;
    }
    throw new Error('Failed to refresh token from backend');
  },

  /**
   * API 5: Logout
   * POST /api/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Backend logout errors should not block frontend clearing
    } finally {
      tokenStorage.clearSession();
    }
  },

  /**
   * Get User Profile (GET /api/user/profile)
   */
  async getProfile(): Promise<User> {
    const res = await apiClient.get('/user/profile');
    const body = res.data?.data || res.data;
    const user = mapBackendUser(body);
    tokenStorage.setUser(user);
    return user;
  },

  /**
   * Update User Profile (PUT /api/user/profile)
   */
  async updateProfile(payload: ProfileUpdatePayload | UpdateUserProfileInput): Promise<User> {
    const res = await apiClient.put('/user/profile', payload);
    const body = res.data?.data || res.data;
    const user = mapBackendUser(body);
    tokenStorage.setUser(user);
    return user;
  },
};
