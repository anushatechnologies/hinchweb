import { apiClient, getCurrentUserId } from '../services/apiClient';
import { mockDb } from './mockDb';
import type { Conversation, ChatMessage } from '../types';

export const chatApi = {
  async getConversations(): Promise<Conversation[]> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.get('/buyer/conversations', { params: { userId } });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
    } catch {
      // fallback
    }
    return mockDb.getConversations();
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.get(`/buyer/conversations/${conversationId}/messages`, { params: { userId } });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
    } catch {
      // fallback
    }
    return mockDb.getMessages(conversationId);
  },

  async sendMessage(params: {
    conversationId?: string;
    sellerId: string;
    topic: 'Product Inquiry' | 'RFQ Discussion' | 'Order Discussion' | 'Delivery Issue' | 'Payment Issue';
    subject: string;
    referenceId?: string;
    message: string;
  }): Promise<{ conversation: Conversation; message: ChatMessage }> {
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.post(`/buyer/conversations/send?userId=${userId}`, params);
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
    } catch {
      // fallback
    }
    return mockDb.sendMessage(params);
  },
};
