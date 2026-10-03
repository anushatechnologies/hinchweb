import { apiClient } from '../services/apiClient';
import type { Address, CreateAddressInput } from '../types';

/**
 * Maps frontend or friendly address types to backend-supported enum values:
 * Validated by AddressRequest.java with regex: ^(?i)(HOME|WORK|OTHER)$
 */
export function mapToBackendAddressType(type?: string): 'HOME' | 'WORK' | 'OTHER' {
  if (!type) return 'WORK';
  const upper = type.toUpperCase();
  if (upper.includes('HOME') || upper.includes('RESIDENTIAL')) {
    return 'HOME';
  }
  if (
    upper.includes('WORK') ||
    upper.includes('SITE') ||
    upper.includes('PROJECT') ||
    upper.includes('WAREHOUSE') ||
    upper.includes('FACTORY') ||
    upper.includes('OFFICE') ||
    upper.includes('COMMERCIAL')
  ) {
    return 'WORK';
  }
  return 'OTHER';
}

/**
 * Transforms frontend input into exact Spring Boot AddressRequest schema
 */
export function serializeAddressRequest(payload: CreateAddressInput) {
  const recipientName = (payload.recipientName || payload.contactName || '').trim();
  const rawPhone = (payload.phone || payload.mobile || '').replace(/\D/g, '');
  const phone = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone;
  const siteName = (payload.siteName || payload.companyName || 'Project Site').trim();
  const addressLine1 = (payload.addressLine1 || '').trim();
  const city = (payload.city || '').trim();
  const state = (payload.state || '').trim();
  const country = (payload.country || 'India').trim();
  const rawPin = (payload.pincode || '').replace(/\D/g, '');
  const pincode = rawPin.slice(0, 6);
  const addressType = mapToBackendAddressType(payload.addressType);
  const isDefault = Boolean(payload.isDefault ?? payload.isDefaultDelivery);
  const hasHeavyVehicleAccess = Boolean(payload.hasHeavyVehicleAccess ?? true);

  return {
    // Exact backend AddressRequest.java fields
    recipientName,
    phone,
    siteName,
    addressLine1,
    city,
    state,
    country,
    pincode,
    addressType,
    isDefault,
    hasHeavyVehicleAccess,

    // Backward-compatible frontend aliases
    contactName: recipientName,
    mobile: phone,
    companyName: siteName,
    isDefaultDelivery: isDefault,
    isDefaultBilling: Boolean(payload.isDefaultBilling),
    addressLine2: payload.addressLine2,
    landmark: payload.landmark,
    gstin: payload.gstin,
  };
}

/**
 * Normalizes backend Address response into the frontend Address contract
 */
export function mapBackendAddress(raw: any): Address {
  const id = String(raw.addressId || raw.id || '');
  const recipientName = raw.recipientName || raw.contactName || '';
  const phone = raw.phone || raw.mobile || '';
  const siteName = raw.siteName || raw.companyName || raw.title || 'Project Site';
  const isDefault = Boolean(raw.isDefault ?? raw.isDefaultDelivery);
  const rawType = (raw.addressType || 'WORK').toUpperCase();

  let friendlyType = raw.addressType || 'Site / Project';
  if (rawType === 'WORK') {
    friendlyType = 'Site / Project';
  } else if (rawType === 'HOME') {
    friendlyType = 'Residential / Home';
  }

  return {
    id,
    addressId: Number(raw.addressId || raw.id || 0),
    siteName,
    recipientName,
    contactName: recipientName,
    mobile: phone,
    phone,
    companyName: siteName,
    gstin: raw.gstin || '',
    addressLine1: raw.addressLine1 || '',
    addressLine2: raw.addressLine2,
    landmark: raw.landmark,
    city: raw.city || '',
    state: raw.state || '',
    country: raw.country || 'India',
    pincode: raw.pincode || '',
    addressType: friendlyType,
    isDefault,
    isDefaultDelivery: isDefault,
    isDefaultBilling: Boolean(raw.isDefaultBilling),
    hasHeavyVehicleAccess: Boolean(raw.hasHeavyVehicleAccess ?? true),
    createdAt: raw.createdAt,
  };
}

export const addressApi = {
  // 7.1 Get User Addresses (GET /api/user/addresses)
  async getAddresses(): Promise<Address[]> {
    const token = localStorage.getItem('hinchmart_auth_token');
    let guestAddrs: Address[] = [];
    try {
      guestAddrs = JSON.parse(localStorage.getItem('hinchmart_guest_addresses') || '[]');
    } catch {}

    if (!token) return guestAddrs;

    try {
      const res = await apiClient.get('/user/addresses');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return [...res.data.data.map(mapBackendAddress), ...guestAddrs];
      }
      if (Array.isArray(res.data)) {
        return [...res.data.map(mapBackendAddress), ...guestAddrs];
      }
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.warn('Backend GET /user/addresses error:', err);
      }
    }
    return guestAddrs;
  },

  // 7.2 Add New Delivery Site Address (POST /api/user/addresses)
  async addAddress(payload: CreateAddressInput): Promise<Address> {
    const token = localStorage.getItem('hinchmart_auth_token');
    const backendBody = serializeAddressRequest(payload);

    const createGuestAddress = (): Address => {
      const localId = `guest_addr_${Date.now()}`;
      const guestAddr: Address = {
        id: localId,
        addressId: Date.now(),
        siteName: backendBody.siteName,
        recipientName: backendBody.recipientName,
        contactName: backendBody.recipientName,
        mobile: backendBody.phone,
        phone: backendBody.phone,
        companyName: backendBody.siteName,
        gstin: payload.gstin || '',
        addressLine1: backendBody.addressLine1,
        addressLine2: payload.addressLine2,
        landmark: payload.landmark,
        city: backendBody.city,
        state: backendBody.state,
        country: backendBody.country,
        pincode: backendBody.pincode,
        addressType: payload.addressType || 'Site / Project',
        isDefault: backendBody.isDefault,
        isDefaultDelivery: backendBody.isDefault,
        isDefaultBilling: Boolean(payload.isDefaultBilling),
        hasHeavyVehicleAccess: backendBody.hasHeavyVehicleAccess,
        createdAt: new Date().toISOString(),
      };
      try {
        const existing = JSON.parse(localStorage.getItem('hinchmart_guest_addresses') || '[]');
        existing.push(guestAddr);
        localStorage.setItem('hinchmart_guest_addresses', JSON.stringify(existing));
      } catch {}
      return guestAddr;
    };

    if (!token) {
      return createGuestAddress();
    }

    try {
      const res = await apiClient.post('/user/addresses', backendBody);
      if (res.data?.success && res.data?.data) {
        return mapBackendAddress(res.data.data);
      }
      if (res.data?.addressId || res.data?.id) {
        return mapBackendAddress(res.data);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        return createGuestAddress();
      }
      throw err;
    }
    throw new Error('Failed to add address');
  },

  // 7.3 Update Delivery Site Address (PUT /api/user/addresses/{id})
  async updateAddress(id: number | string, payload: Partial<CreateAddressInput>): Promise<Address> {
    const token = localStorage.getItem('hinchmart_auth_token');
    if (!token) {
      try {
        const guestAddrs: Address[] = JSON.parse(localStorage.getItem('hinchmart_guest_addresses') || '[]');
        const updated = guestAddrs.map((a) => (a.id === String(id) ? { ...a, ...payload } : a));
        localStorage.setItem('hinchmart_guest_addresses', JSON.stringify(updated));
        const found = updated.find((a) => a.id === String(id));
        if (found) return found;
      } catch {}
    }

    const backendBody = serializeAddressRequest(payload as CreateAddressInput);
    const res = await apiClient.put(`/user/addresses/${id}`, backendBody);
    if (res.data?.success && res.data?.data) {
      return mapBackendAddress(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to update address');
  },

  // 7.4 Delete Delivery Site Address (DELETE /api/user/addresses/{id})
  async deleteAddress(id: number | string): Promise<boolean> {
    try {
      const guestAddrs: Address[] = JSON.parse(localStorage.getItem('hinchmart_guest_addresses') || '[]');
      const filtered = guestAddrs.filter((a) => a.id !== String(id) && a.addressId !== Number(id));
      localStorage.setItem('hinchmart_guest_addresses', JSON.stringify(filtered));
    } catch {}

    const token = localStorage.getItem('hinchmart_auth_token');
    if (!token) return true;

    try {
      const res = await apiClient.delete(`/user/addresses/${id}`);
      return res.data?.success ?? true;
    } catch {
      return true;
    }
  },
};
