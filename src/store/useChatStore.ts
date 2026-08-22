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
      console.error('Failed to fetch conversations', e);
    }
  },

  openChatWithSeller: async (seller, topic = 'Product Inquiry', subject = 'Specification & Wholesale Inquiry', referenceId) => {
    set({ isOpen: true, activeSeller: seller, isLoading: true });
    try {
      const convs = await chatApi.getConversations();
      let match = convs.find((c) => c.seller.id === seller.id);
      if (!match) {
        // Initial empty state or start placeholder conversation
        match = {
          id: `conv_${seller.id}`,
          seller,
          topic: topic as any,
          subject,
          referenceId,
          lastMessage: 'Chat started with supplier.',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        };
      }
      const msgs = await chatApi.getMessages(match.id);
      set({
        activeConversation: match,
        messages: msgs.length > 0 ? msgs : [
          {
            id: `msg_sys_1`,
            conversationId: match.id,
            sender: 'seller',
            senderName: seller.name,
            message: `Hello Rajesh! Welcome to ${seller.name} B2B desk. How can we assist with your material requirement today?`,
            timestamp: new Date().toISOString(),
            status: 'read',
          }
        ],
        isLoading: false,
      });
    } catch (e) {
      console.error('Failed to open chat with seller', e);
      set({ isLoading: false });
    }
  },

  openConversation: async (conv) => {
    set({ isOpen: true, activeConversation: conv, activeSeller: conv.seller, isLoading: true });
    try {
      const msgs = await chatApi.getMessages(conv.id);
      set({ messages: msgs, isLoading: false });
    } catch (e) {
      console.error('Failed to load messages', e);
      set({ isLoading: false });
    }
  },

  sendMessage: async (text: string) => {
    const { activeConversation, activeSeller } = get();
    if (!text.trim() || (!activeConversation && !activeSeller)) return;

    const sellerId = activeSeller?.id || activeConversation?.seller.id || 'seller_1';
    const topic = (activeConversation?.topic || 'Product Inquiry') as any;
    const subject = activeConversation?.subject || 'Direct Material Inquiry';

    const optimisticMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: activeConversation?.id || `conv_${sellerId}`,
      sender: 'buyer',
      senderName: 'Rajesh Sharma',
      message: text,
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

      // Simulate realistic supplier auto-response after 1.5s
      setTimeout(() => {
        const replyMsg: ChatMessage = {
          id: `msg_rep_${Date.now()}`,
          conversationId: activeConversation?.id || `conv_${sellerId}`,
          sender: 'seller',
          senderName: activeSeller?.name || 'Verified Supplier Desk',
          message: `Thank you for the message. Our dispatch and technical sales team have noted your requirement: "${text.length > 40 ? text.slice(0, 40) + '...' : text}". We are calculating the lowest mill-direct freight rate for your pincode and will confirm within 15 minutes.`,
          timestamp: new Date().toISOString(),
          status: 'delivered',
        };
        set((state) => ({ messages: [...state.messages, replyMsg] }));
      }, 1400);
    } catch (e) {
      console.error('Failed to send message', e);
    }
  },
}));
