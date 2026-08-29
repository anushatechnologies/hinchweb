import { apiClient } from '../services/apiClient';
import type { Address, CreateAddressInput } from '../types';

export function mapBackendAddress(raw: any): Address {
  const id = String(raw.addressId || raw.id || '');
  return {
    id,
    addressId: Number(raw.addressId || raw.id || 0),
    siteName: raw.siteName || raw.title || '',
    recipientName: raw.recipientName || raw.contactName || '',
    contactName: raw.recipientName || raw.contactName || '',
    mobile: raw.mobile || raw.phone || '',
    phone: raw.mobile || raw.phone || '',
    companyName: raw.companyName || '',
    gstin: raw.gstin || '',
    addressLine1: raw.addressLine1 || '',
    addressLine2: raw.addressLine2,
    landmark: raw.landmark,
    city: raw.city || '',
    state: raw.state || '',
    pincode: raw.pincode || '',
    addressType: raw.addressType || 'Site / Project',
    isDefaultDelivery: Boolean(raw.isDefaultDelivery),
    isDefaultBilling: Boolean(raw.isDefaultBilling),
    hasHeavyVehicleAccess: Boolean(raw.hasHeavyVehicleAccess ?? true),
    createdAt: raw.createdAt,
  };
}

export const addressApi = {
  // 7.1 Get User Addresses
  async getAddresses(): Promise<Address[]> {
    try {
      const res = await apiClient.get('/user/addresses');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map(mapBackendAddress);
      }
      if (Array.isArray(res.data)) {
        return res.data.map(mapBackendAddress);
      }
    } catch (err) {
      console.warn('Backend GET /user/addresses error:', err);
    }
    return [];
  },

  // 7.2 Add New Delivery Site Address
  async addAddress(payload: CreateAddressInput): Promise<Address> {
    const res = await apiClient.post('/user/addresses', payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendAddress(res.data.data);
    }
    if (res.data?.addressId || res.data?.id) {
      return mapBackendAddress(res.data);
    }
    throw new Error(res.data?.message || 'Failed to add address');
  },

  // 7.3 Update Delivery Site Address
  async updateAddress(id: number | string, payload: Partial<CreateAddressInput>): Promise<Address> {
    const res = await apiClient.put(`/user/addresses/${id}`, payload);
    if (res.data?.success && res.data?.data) {
      return mapBackendAddress(res.data.data);
    }
    throw new Error(res.data?.message || 'Failed to update address');
  },

  // 7.4 Delete Delivery Site Address
  async deleteAddress(id: number | string): Promise<boolean> {
    const res = await apiClient.delete(`/user/addresses/${id}`);
    return res.data?.success ?? true;
  },
};
