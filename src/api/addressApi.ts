import { apiClient, getCurrentUserId } from '../services/apiClient';
import { mockDb } from './mockDb';
import type { Address } from '../types';

export function mapBackendAddress(raw: any): Address {
  return {
    id: String(raw.id || `addr_${Date.now()}`),
    contactName: raw.contactName || raw.contactPerson || 'Rajesh Sharma',
    mobile: raw.mobile || raw.phone || '9876543210',
    companyName: raw.companyName || 'Apex Infra Projects Pvt Ltd',
    gstin: raw.gstin || '27AAAAA0000A1Z5',
    addressLine1: raw.addressLine1 || raw.address || 'Plot 45, MIDC Industrial Area, Phase 2',
    addressLine2: raw.addressLine2,
    landmark: raw.landmark,
    city: raw.city || 'Pune',
    state: raw.state || 'Maharashtra',
    pincode: raw.pincode || '411057',
    addressType: (raw.addressType || 'Site / Project') as any,
    isDefaultDelivery: Boolean(raw.isDefaultDelivery),
    isDefaultBilling: Boolean(raw.isDefaultBilling),
  };
}

export const addressApi = {
  async getAddresses(): Promise<Address[]> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.get('/buyer/addresses', { params: { userId } });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map(mapBackendAddress);
      }
    } catch {
      // fallback
    }
    return mockDb.getAddresses();
  },

  async addAddress(addr: Omit<Address, 'id'>): Promise<Address> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.post(`/buyer/addresses?userId=${userId}`, addr);
      if (res.data?.success && res.data?.data) {
        return mapBackendAddress(res.data.data);
      }
    } catch {
      // fallback
    }
    return mockDb.addAddress(addr);
  },

  async updateAddress(id: string, updates: Partial<Address>): Promise<Address> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.put(`/buyer/addresses/${id}?userId=${userId}`, updates);
      if (res.data?.success && res.data?.data) {
        return mapBackendAddress(res.data.data);
      }
    } catch {
      // fallback
    }
    return mockDb.updateAddress(id, updates);
  },

  async deleteAddress(id: string): Promise<void> {
    const userId = getCurrentUserId();
    try {
      await apiClient.delete(`/buyer/addresses/${id}?userId=${userId}`);
      return;
    } catch {
      // fallback
    }
    return mockDb.deleteAddress(id);
  },
};
