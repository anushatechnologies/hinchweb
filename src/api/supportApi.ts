import { apiClient } from '../services/apiClient';
import type {
  SupportTicket,
  TicketMessage,
  CreateTicketRequest,
  TicketMessageRequest,
  TicketFilterParams,
} from '../types';

export const supportApi = {
  /**
   * 1. Create Support Ticket
   * POST /api/help/tickets
   */
  async createTicket(payload: CreateTicketRequest): Promise<SupportTicket> {
    const body: Record<string, any> = {
      subject: payload.subject,
      message: payload.message,
      category: payload.category || 'GENERAL',
      priority: payload.priority || 'MEDIUM',
    };

    if (payload.orderId !== undefined && payload.orderId !== null) {
      body.orderId = Number(payload.orderId);
    }

    const res = await apiClient.post('/help/tickets', body);
    const data = res.data?.data || res.data;
    if (data) {
      return {
        ticketId: Number(data.ticketId || data.id || 0),
        ticketNumber: data.ticketNumber || `TKT-${data.ticketId || Date.now()}`,
        userId: data.userId ? Number(data.userId) : undefined,
        subject: data.subject || payload.subject,
        category: data.category || payload.category || 'GENERAL',
        priority: data.priority || payload.priority || 'MEDIUM',
        status: data.status || 'OPEN',
        orderId: data.orderId ? Number(data.orderId) : undefined,
        messages: Array.isArray(data.messages) ? data.messages : [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
    throw new Error(res.data?.message || 'Failed to create support ticket');
  },

  /**
   * 2. Reply / Add Message to Ticket
   * POST /api/help/tickets/{id}/messages
   */
  async addMessage(
    ticketId: number | string,
    payload: TicketMessageRequest
  ): Promise<TicketMessage> {
    const body: Record<string, any> = {
      content: payload.content,
    };
    if (payload.attachmentUrl) {
      body.attachmentUrl = payload.attachmentUrl;
    }

    const res = await apiClient.post(`/help/tickets/${ticketId}/messages`, body);
    const data = res.data?.data || res.data;
    if (data) {
      return {
        messageId: Number(data.messageId || data.id || Date.now()),
        ticketId: Number(ticketId),
        senderId: data.senderId ? Number(data.senderId) : undefined,
        senderRole: data.senderRole || 'USER',
        senderName: data.senderName || 'Me',
        content: data.content || payload.content,
        attachmentUrl: data.attachmentUrl || payload.attachmentUrl,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    }
    throw new Error(res.data?.message || 'Failed to add message to ticket');
  },

  /**
   * 3. Get User Tickets (List)
   * GET /api/help/tickets?status=OPEN&page=1&limit=20
   */
  async getTickets(params?: TicketFilterParams): Promise<SupportTicket[]> {
    const queryParams: Record<string, any> = {};
    if (params?.status && params.status !== 'ALL') {
      queryParams.status = params.status;
    }
    if (params?.page) {
      queryParams.page = params.page;
    }
    if (params?.limit) {
      queryParams.limit = params.limit;
    }
    if (params?.orderId) {
      queryParams.orderId = params.orderId;
    }

    const res = await apiClient.get('/help/tickets', { params: queryParams });
    const rawList = Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data?.content)
      ? res.data.content
      : Array.isArray(res.data)
      ? res.data
      : [];

    return rawList.map((data: any) => ({
      ticketId: Number(data.ticketId || data.id || 0),
      ticketNumber: data.ticketNumber || `TKT-${data.ticketId || ''}`,
      userId: data.userId ? Number(data.userId) : undefined,
      subject: data.subject || '',
      category: data.category || 'GENERAL',
      priority: data.priority || 'MEDIUM',
      status: data.status || 'OPEN',
      orderId: data.orderId ? Number(data.orderId) : undefined,
      messages: Array.isArray(data.messages) ? data.messages : [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    }));
  },

  /**
   * 4. Get Single Ticket by ID (Includes full message thread)
   * GET /api/help/tickets/{id}
   */
  async getTicketById(ticketId: number | string): Promise<SupportTicket> {
    const res = await apiClient.get(`/help/tickets/${ticketId}`);
    const data = res.data?.data || res.data;
    if (data) {
      return {
        ticketId: Number(data.ticketId || data.id || ticketId),
        ticketNumber: data.ticketNumber || `TKT-${data.ticketId || ticketId}`,
        userId: data.userId ? Number(data.userId) : undefined,
        subject: data.subject || '',
        category: data.category || 'GENERAL',
        priority: data.priority || 'MEDIUM',
        status: data.status || 'OPEN',
        orderId: data.orderId ? Number(data.orderId) : undefined,
        messages: Array.isArray(data.messages) ? data.messages : [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
    throw new Error(`Ticket #${ticketId} not found`);
  },
};
