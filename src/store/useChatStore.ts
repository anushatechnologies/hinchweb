import { create } from 'zustand';
import type { Conversation, ChatMessage, Seller } from '../types';
import { chatApi } from '../api/chatApi';

interface ChatState {
  isOpen: boolean;
  activeConversation: Conversation | null;
  activeSeller: Seller | null;
  messages: ChatMessage[];
  conversations: Conversation[];
  isLoading: boolean;
  openChatWithSeller: (seller: Seller, topic?: string, subject?: string, referenceId?: string) => Promise<void>;
  openConversation: (conv: Conversation) => Promise<void>;
  closeChat: () => void;
  fetchConversations: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  activeConversation: null,
  activeSeller: null,
  messages: [],
  conversations: [],
  isLoading: false,

  closeChat: () => set({ isOpen: false }),

  fetchConversations: async () => {
    try {
      const convs = await chatApi.getConversations();
      set({ conversations: convs });
    } catch (e) {
      console.warn('Failed to fetch conversations:', e);
    }
  },

  openChatWithSeller: async (seller, topic = 'Product Inquiry', subject = 'Specification & Wholesale Inquiry', _referenceId) => {
    set({ isOpen: true, activeSeller: seller, isLoading: true });
    try {
      const convs = await chatApi.getConversations();
      let match = convs.find((c) => (c.sellerId === seller.id || c.seller?.id === seller.id));
      if (!match) {
        match = {
          id: `conv_${seller.id}`,
          sellerId: seller.id,
          sellerName: seller.name,
          seller,
          topic: topic as any,
          subject,
          lastMessage: 'Chat started with supplier.',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        };
      }
      const msgs = await chatApi.getMessages(match.id);
      set({
        activeConversation: match,
        messages: msgs,
        isLoading: false,
      });
    } catch (e) {
      console.warn('Failed to open chat with seller:', e);
      set({ isLoading: false });
    }
  },

  openConversation: async (conv) => {
    set({ isOpen: true, activeConversation: conv, activeSeller: conv.seller || null, isLoading: true });
    try {
      const msgs = await chatApi.getMessages(conv.id);
      set({ messages: msgs, isLoading: false });
    } catch (e) {
      console.warn('Failed to load messages:', e);
      set({ isLoading: false });
    }
  },

  sendMessage: async (text: string) => {
    const { activeConversation, activeSeller } = get();
    if (!text.trim() || (!activeConversation && !activeSeller)) return;

    const sellerId = activeSeller?.id || activeConversation?.sellerId || activeConversation?.seller?.id || '1';
    const topic = (activeConversation?.topic || 'Product Inquiry') as any;
    const subject = activeConversation?.subject || 'Direct Material Inquiry';

    const optimisticMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: activeConversation?.id || `conv_${sellerId}`,
      senderId: 'current_user',
      senderName: 'You',
      message: text,
      text,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    set((state) => ({ messages: [...state.messages, optimisticMsg] }));

    try {
      await chatApi.sendMessage({
        conversationId: activeConversation?.id,
        sellerId,
        topic,
        subject,
        message: text,
      });
    } catch (e) {
      console.warn('Failed to send message:', e);
    }
  },
}));
