import { apiClient } from '../services/apiClient';
import type { Conversation, ChatMessage } from '../types';

export const chatApi = {
  async getConversations(): Promise<Conversation[]> {
    try {
      const res = await apiClient.get('/conversations');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend GET /conversations error:', err);
    }
    return [];
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const res = await apiClient.get(`/conversations/${conversationId}/messages`);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn(`Backend GET /conversations/${conversationId}/messages error:`, err);
    }
    return [];
  },

  async sendMessage(params: {
    conversationId?: string;
    sellerId: string;
    topic: 'Product Inquiry' | 'RFQ Discussion' | 'Order Discussion' | 'Delivery Issue' | 'Payment Issue';
    subject: string;
    referenceId?: string;
    message: string;
  }): Promise<{ conversation: Conversation; message: ChatMessage }> {
    const res = await apiClient.post('/conversations/send', params);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to send chat message');
  },
};
