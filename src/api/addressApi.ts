import { apiClient } from '../services/apiClient';
import type { Address, CreateSiteAddressInput, BackendAddressType, AddressRequest } from '../types';

/**
 * Maps frontend or friendly address types to backend-supported enum values:
 * Validated by AddressRequest.java with regex: ^(?i)(HOME|WORK|OTHER)$
 */
export function mapToBackendAddressType(type?: string): BackendAddressType {
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
export function serializeAddressRequest(payload: CreateSiteAddressInput): AddressRequest & Record<string, any> {
  const recipientName = (payload.recipientName || payload.contactName || '').trim();
  const rawPhone = (payload.phone || payload.mobile || '').replace(/\D/g, '');
  const phone = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone;
  const siteName = (payload.siteName || payload.companyName || 'Project Site').trim();
  const addressLine1 = (payload.addressLine1 || '').trim();
  const addressLine2 = payload.addressLine2?.trim() || undefined;
  const houseFlatNo = payload.houseFlatNo?.trim() || undefined;
  const areaLocality = payload.areaLocality?.trim() || undefined;
  const city = (payload.city || '').trim();
  const state = (payload.state || '').trim();
  const country = (payload.country || 'India').trim();
  const rawPin = (payload.pincode || '').replace(/\D/g, '');
  const pincode = rawPin.slice(0, 6);
  const landmark = payload.landmark?.trim() || undefined;
  const addressType = mapToBackendAddressType(payload.addressType);
  const isDefault = Boolean(payload.isDefault ?? payload.isDefaultDelivery);
  const hasHeavyVehicleAccess = Boolean(payload.hasHeavyVehicleAccess ?? true);
  const latitude = typeof payload.latitude === 'number' ? payload.latitude : undefined;
  const longitude = typeof payload.longitude === 'number' ? payload.longitude : undefined;

  return {
    // Exact backend AddressRequest.java fields
    siteName,
    recipientName,
    phone,
    addressLine1,
    addressLine2,
    houseFlatNo,
    areaLocality,
    city,
    state,
    country,
    pincode,
    landmark,
    latitude,
    longitude,
    addressType,
    isDefault,
    hasHeavyVehicleAccess,

    // Backward-compatible frontend aliases
    contactName: recipientName,
    mobile: phone,
    companyName: siteName,
    isDefaultDelivery: isDefault,
    isDefaultBilling: Boolean(payload.isDefaultBilling),
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
    houseFlatNo: raw.houseFlatNo,
    areaLocality: raw.areaLocality,
    landmark: raw.landmark,
    city: raw.city || '',
    state: raw.state || '',
    country: raw.country || 'India',
    pincode: raw.pincode || '',
    latitude: raw.latitude,
    longitude: raw.longitude,
    addressType: friendlyType,
    isDefault,
    isDefaultDelivery: isDefault,
    isDefaultBilling: Boolean(raw.isDefaultBilling),
    hasHeavyVehicleAccess: Boolean(raw.hasHeavyVehicleAccess ?? true),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const addressApi = {
  /**
   * 1. GET /api/addresses (or fallback /api/user/addresses)
   * Retrieves all delivery addresses for the authenticated user.
   */
  async getAddresses(): Promise<Address[]> {
    const token = localStorage.getItem('hinchmart_auth_token');
    let guestAddrs: Address[] = [];
    try {
      guestAddrs = JSON.parse(localStorage.getItem('hinchmart_guest_addresses') || '[]');
    } catch {}

    if (!token) return guestAddrs;

    try {
      // Primary: /addresses
      const res = await apiClient.get('/addresses');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return [...res.data.data.map(mapBackendAddress), ...guestAddrs];
      }
      if (Array.isArray(res.data)) {
        return [...res.data.map(mapBackendAddress), ...guestAddrs];
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Fallback: /user/addresses
        try {
          const fallbackRes = await apiClient.get('/user/addresses');
          if (fallbackRes.data?.success && Array.isArray(fallbackRes.data?.data)) {
            return [...fallbackRes.data.data.map(mapBackendAddress), ...guestAddrs];
          }
          if (Array.isArray(fallbackRes.data)) {
            return [...fallbackRes.data.map(mapBackendAddress), ...guestAddrs];
          }
        } catch {}
      } else if (err.response?.status !== 401) {
        console.warn('Backend GET /addresses error:', err);
      }
    }
    return guestAddrs;
  },

  /**
   * 2. GET /api/addresses/{id} (or fallback /api/user/addresses/{id})
   * Retrieves a single address by its ID.
   */
  async getAddressById(id: number | string): Promise<Address | null> {
    const token = localStorage.getItem('hinchmart_auth_token');
    if (!token) {
      try {
        const guestAddrs: Address[] = JSON.parse(localStorage.getItem('hinchmart_guest_addresses') || '[]');
        return guestAddrs.find((a) => a.id === String(id) || a.addressId === Number(id)) || null;
      } catch {
        return null;
      }
    }

    try {
      const res = await apiClient.get(`/addresses/${id}`);
      if (res.data?.success && res.data?.data) {
        return mapBackendAddress(res.data.data);
      }
      if (res.data?.addressId || res.data?.id) {
        return mapBackendAddress(res.data);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        try {
          const fallbackRes = await apiClient.get(`/user/addresses/${id}`);
          if (fallbackRes.data?.success && fallbackRes.data?.data) {
            return mapBackendAddress(fallbackRes.data.data);
          }
        } catch {}
      }
    }
    return null;
  },

  /**
   * 3. POST /api/addresses (or fallback /api/user/addresses)
   * Saves a new delivery address with geographic coordinates.
   */
  async addAddress(payload: CreateSiteAddressInput): Promise<Address> {
    const token = localStorage.getItem('hinchmart_auth_token');
    const backendBody = serializeAddressRequest(payload);

    const createGuestAddress = (): Address => {
      const localId = `guest_addr_${Date.now()}`;
      const guestAddr: Address = {
        id: localId,
        addressId: Date.now(),
        siteName: backendBody.siteName || 'Project Site',
        recipientName: backendBody.recipientName || 'Site Contact',
        contactName: backendBody.recipientName || 'Site Contact',
        mobile: backendBody.phone || '',
        phone: backendBody.phone || '',
        companyName: backendBody.siteName || 'Project Site',
        gstin: payload.gstin || '',
        addressLine1: backendBody.addressLine1 || '',
        addressLine2: backendBody.addressLine2,
        houseFlatNo: backendBody.houseFlatNo,
        areaLocality: backendBody.areaLocality,
        landmark: backendBody.landmark,
        city: backendBody.city || '',
        state: backendBody.state || '',
        country: backendBody.country || 'India',
        pincode: backendBody.pincode || '',
        latitude: backendBody.latitude,
        longitude: backendBody.longitude,
        addressType: payload.addressType || 'Site / Project',
        isDefault: Boolean(backendBody.isDefault),
        isDefaultDelivery: Boolean(backendBody.isDefault),
        isDefaultBilling: Boolean(payload.isDefaultBilling),
        hasHeavyVehicleAccess: Boolean(backendBody.hasHeavyVehicleAccess),
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
      const res = await apiClient.post('/addresses', backendBody);
      if (res.data?.success && res.data?.data) {
        return mapBackendAddress(res.data.data);
      }
      if (res.data?.addressId || res.data?.id) {
        return mapBackendAddress(res.data);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        try {
          const fallbackRes = await apiClient.post('/user/addresses', backendBody);
          if (fallbackRes.data?.success && fallbackRes.data?.data) {
            return mapBackendAddress(fallbackRes.data.data);
          }
        } catch {}
      }
      if (err.response?.status === 401) {
        return createGuestAddress();
      }
      throw err;
    }
    throw new Error('Failed to add address');
  },

  /**
   * 4. PUT /api/addresses/{id} (or fallback /api/user/addresses/{id})
   * Updates an existing address.
   */
  async updateAddress(id: number | string, payload: Partial<CreateSiteAddressInput>): Promise<Address> {
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

    const backendBody = serializeAddressRequest(payload as CreateSiteAddressInput);
    try {
      const res = await apiClient.put(`/addresses/${id}`, backendBody);
      if (res.data?.success && res.data?.data) {
        return mapBackendAddress(res.data.data);
      }
      if (res.data?.addressId) {
        return mapBackendAddress(res.data);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        const fallbackRes = await apiClient.put(`/user/addresses/${id}`, backendBody);
        if (fallbackRes.data?.success && fallbackRes.data?.data) {
          return mapBackendAddress(fallbackRes.data.data);
        }
      }
      throw err;
    }
    throw new Error('Failed to update address');
  },

  /**
   * 5. DELETE /api/addresses/{id} (or fallback /api/user/addresses/{id})
   * Deletes an address.
   */
  async deleteAddress(id: number | string): Promise<boolean> {
    try {
      const guestAddrs: Address[] = JSON.parse(localStorage.getItem('hinchmart_guest_addresses') || '[]');
      const filtered = guestAddrs.filter((a) => a.id !== String(id) && a.addressId !== Number(id));
      localStorage.setItem('hinchmart_guest_addresses', JSON.stringify(filtered));
    } catch {}

    const token = localStorage.getItem('hinchmart_auth_token');
    if (!token) return true;

    try {
      const res = await apiClient.delete(`/addresses/${id}`);
      return res.data?.success ?? true;
    } catch (err: any) {
      if (err.response?.status === 404) {
        try {
          const fallbackRes = await apiClient.delete(`/user/addresses/${id}`);
          return fallbackRes.data?.success ?? true;
        } catch {}
      }
      return true;
    }
  },

  /**
   * 6. PATCH /api/addresses/{id}/default
   * Marks the specified address as the default delivery address (and unsets previous default).
   */
  async setDefaultAddress(id: number | string): Promise<Address | null> {
    const token = localStorage.getItem('hinchmart_auth_token');
    if (!token) {
      try {
        const guestAddrs: Address[] = JSON.parse(localStorage.getItem('hinchmart_guest_addresses') || '[]');
        const updated = guestAddrs.map((a) => ({
          ...a,
          isDefault: a.id === String(id) || a.addressId === Number(id),
          isDefaultDelivery: a.id === String(id) || a.addressId === Number(id),
        }));
        localStorage.setItem('hinchmart_guest_addresses', JSON.stringify(updated));
        return updated.find((a) => a.isDefault) || null;
      } catch {
        return null;
      }
    }

    try {
      const res = await apiClient.patch(`/addresses/${id}/default`);
      if (res.data?.success && res.data?.data) {
        return mapBackendAddress(res.data.data);
      }
      if (res.data?.addressId) {
        return mapBackendAddress(res.data);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        try {
          const fallbackRes = await apiClient.patch(`/user/addresses/${id}/default`);
          if (fallbackRes.data?.success && fallbackRes.data?.data) {
            return mapBackendAddress(fallbackRes.data.data);
          }
        } catch {}
      }
      console.warn(`PATCH /addresses/${id}/default notice:`, err?.message || err);
    }
    return null;
  },
};
