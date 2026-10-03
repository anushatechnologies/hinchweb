import { apiClient } from '../services/apiClient';
import type { Notification } from '../types';

export const notificationApi = {
  async getNotifications(): Promise<Notification[]> {
    const token = localStorage.getItem('hinchmart_auth_token');
    if (!token) return [];

    try {
      const res = await apiClient.get('/notifications');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data.map((n: any) => ({
          id: String(n.id),
          title: n.title,
          message: n.message,
          category: n.category || 'order',
          createdAt: n.createdAt || new Date().toISOString(),
          isRead: Boolean(n.isRead),
          link: n.link || '/orders',
        }));
      }
      if (Array.isArray(res.data)) {
        return res.data.map((n: any) => ({
          id: String(n.id),
          title: n.title,
          message: n.message,
          category: n.category || 'order',
          createdAt: n.createdAt || new Date().toISOString(),
          isRead: Boolean(n.isRead),
          link: n.link || '/orders',
        }));
      }
    } catch (err) {
      console.warn('Backend GET /notifications error:', err);
    }
    return [];
  },

  async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.put(`/notifications/${id}/read`);
    } catch (err) {
      console.warn(`Backend PUT /notifications/${id}/read error:`, err);
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.put('/notifications/read-all');
    } catch (err) {
      console.warn('Backend PUT /notifications/read-all error:', err);
    }
  },
};
