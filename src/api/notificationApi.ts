import { apiClient, getCurrentUserId } from '../services/apiClient';
import { mockDb } from './mockDb';
import type { Notification } from '../types';

export const notificationApi = {
  async getNotifications(): Promise<Notification[]> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.get('/notifications', { params: { userId } });
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
    } catch {
      // fallback
    }
    return mockDb.getNotifications();
  },

  async markAsRead(id: string): Promise<void> {
    const userId = getCurrentUserId();
    try {
      await apiClient.put(`/notifications/${id}/read?userId=${userId}`);
      return;
    } catch {
      // fallback
    }
    return mockDb.markNotificationRead(id);
  },

  async markAllAsRead(): Promise<void> {
    const userId = getCurrentUserId();
    try {
      await apiClient.put(`/notifications/read-all?userId=${userId}`);
      return;
    } catch {
      // fallback
    }
    return mockDb.markAllNotificationsRead();
  },
};