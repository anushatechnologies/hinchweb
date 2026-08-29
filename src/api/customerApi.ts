import { apiClient } from '../services/apiClient';
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '../types';

export const customerApi = {
  // 6.3 Get All Customers (Admin/Staff)
  async getCustomers(): Promise<Customer[]> {
    try {
      const res = await apiClient.get('/customers');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend GET /customers error:', err);
    }
    return [];
  },

  // 6.4 Get Customer By ID
  async getCustomerById(id: number | string): Promise<Customer> {
    const res = await apiClient.get(`/customers/${id}`);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    throw new Error(`Customer ${id} not found`);
  },

  // 6.5 Create Customer
  async createCustomer(payload: CreateCustomerInput): Promise<Customer> {
    const res = await apiClient.post('/customers', payload);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to create customer');
  },

  // 6.6 Update Customer
  async updateCustomer(id: number | string, payload: UpdateCustomerInput): Promise<Customer> {
    const res = await apiClient.put(`/customers/${id}`, payload);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to update customer');
  },

  // 6.7 Delete Customer
  async deleteCustomer(id: number | string): Promise<boolean> {
    const res = await apiClient.delete(`/customers/${id}`);
    return res.data?.success ?? true;
  },
};
