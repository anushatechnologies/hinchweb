import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supportApi } from '../api/supportApi';
import { apiClient } from '../services/apiClient';

describe('HinchMart Support Tickets API Suite (/api/help/tickets)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. POST /api/help/tickets - creates support ticket with orderId and category', async () => {
    const mockBackendResponse = {
      success: true,
      message: 'Support ticket created successfully',
      data: {
        ticketId: 101,
        ticketNumber: 'TKT-1728551400000',
        userId: 45,
        subject: 'Delayed delivery for Order #1042',
        category: 'DELIVERY',
        priority: 'HIGH',
        status: 'OPEN',
        orderId: 1042,
        messages: [
          {
            messageId: 201,
            ticketId: 101,
            senderId: 45,
            senderRole: 'USER',
            senderName: 'John Doe',
            content: 'My order was supposed to be delivered yesterday, but the tracking status has not updated.',
            timestamp: '2026-10-10T12:30:00',
          },
        ],
        createdAt: '2026-10-10T12:30:00',
        updatedAt: '2026-10-10T12:30:00',
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockBackendResponse,
    } as any);

    const result = await supportApi.createTicket({
      subject: 'Delayed delivery for Order #1042',
      category: 'DELIVERY',
      priority: 'HIGH',
      orderId: 1042,
      message: 'My order was supposed to be delivered yesterday, but the tracking status has not updated.',
    });

    expect(postSpy).toHaveBeenCalledWith('/help/tickets', {
      subject: 'Delayed delivery for Order #1042',
      category: 'DELIVERY',
      priority: 'HIGH',
      orderId: 1042,
      message: 'My order was supposed to be delivered yesterday, but the tracking status has not updated.',
    });

    expect(result.ticketId).toBe(101);
    expect(result.ticketNumber).toBe('TKT-1728551400000');
    expect(result.category).toBe('DELIVERY');
    expect(result.status).toBe('OPEN');
    expect(result.orderId).toBe(1042);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content).toContain('My order was supposed to be delivered yesterday');
  });

  it('2. POST /api/help/tickets - creates general ticket without orderId with default values', async () => {
    const mockBackendResponse = {
      success: true,
      message: 'Support ticket created successfully',
      data: {
        ticketId: 102,
        ticketNumber: 'TKT-1728551400001',
        userId: 45,
        subject: 'GST Invoice question',
        category: 'GENERAL',
        priority: 'MEDIUM',
        status: 'OPEN',
        messages: [],
        createdAt: '2026-10-10T12:31:00',
        updatedAt: '2026-10-10T12:31:00',
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockBackendResponse,
    } as any);

    const result = await supportApi.createTicket({
      subject: 'GST Invoice question',
      message: 'How can I update my company GSTIN for upcoming invoices?',
    });

    expect(postSpy).toHaveBeenCalledWith('/help/tickets', {
      subject: 'GST Invoice question',
      category: 'GENERAL',
      priority: 'MEDIUM',
      message: 'How can I update my company GSTIN for upcoming invoices?',
    });

    expect(result.ticketId).toBe(102);
    expect(result.category).toBe('GENERAL');
    expect(result.priority).toBe('MEDIUM');
    expect(result.orderId).toBeUndefined();
  });

  it('3. POST /api/help/tickets/{id}/messages - sends reply message with attachment', async () => {
    const mockBackendResponse = {
      success: true,
      message: 'Message added to support ticket',
      data: {
        messageId: 202,
        ticketId: 101,
        senderId: 45,
        senderRole: 'USER',
        senderName: 'John Doe',
        content: 'Here is the gate entry receipt for reference.',
        attachmentUrl: 'https://storage.hinchmart.com/tickets/receipt_1042.pdf',
        timestamp: '2026-10-10T12:32:00',
      },
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockBackendResponse,
    } as any);

    const result = await supportApi.addMessage(101, {
      content: 'Here is the gate entry receipt for reference.',
      attachmentUrl: 'https://storage.hinchmart.com/tickets/receipt_1042.pdf',
    });

    expect(postSpy).toHaveBeenCalledWith('/help/tickets/101/messages', {
      content: 'Here is the gate entry receipt for reference.',
      attachmentUrl: 'https://storage.hinchmart.com/tickets/receipt_1042.pdf',
    });

    expect(result.messageId).toBe(202);
    expect(result.ticketId).toBe(101);
    expect(result.attachmentUrl).toBe('https://storage.hinchmart.com/tickets/receipt_1042.pdf');
    expect(result.senderRole).toBe('USER');
  });

  it('4. GET /api/help/tickets - lists user tickets with filter parameters', async () => {
    const mockBackendResponse = {
      success: true,
      data: [
        {
          ticketId: 101,
          ticketNumber: 'TKT-1728551400000',
          subject: 'Delayed delivery for Order #1042',
          category: 'DELIVERY',
          priority: 'HIGH',
          status: 'OPEN',
          orderId: 1042,
          messages: [],
          createdAt: '2026-10-10T12:30:00',
          updatedAt: '2026-10-10T12:30:00',
        },
      ],
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockBackendResponse,
    } as any);

    const list = await supportApi.getTickets({
      status: 'OPEN',
      page: 1,
      limit: 20,
    });

    expect(getSpy).toHaveBeenCalledWith('/help/tickets', {
      params: {
        status: 'OPEN',
        page: 1,
        limit: 20,
      },
    });

    expect(list).toHaveLength(1);
    expect(list[0].ticketNumber).toBe('TKT-1728551400000');
    expect(list[0].status).toBe('OPEN');
  });

  it('5. GET /api/help/tickets/{id} - fetches single ticket with full message thread', async () => {
    const mockBackendResponse = {
      success: true,
      data: {
        ticketId: 101,
        ticketNumber: 'TKT-1728551400000',
        userId: 45,
        subject: 'Delayed delivery for Order #1042',
        category: 'DELIVERY',
        priority: 'HIGH',
        status: 'OPEN',
        orderId: 1042,
        messages: [
          {
            messageId: 201,
            ticketId: 101,
            senderId: 45,
            senderRole: 'USER',
            senderName: 'John Doe',
            content: 'My order was supposed to be delivered yesterday.',
            timestamp: '2026-10-10T12:30:00',
          },
          {
            messageId: 202,
            ticketId: 101,
            senderId: 99,
            senderRole: 'AGENT',
            senderName: 'Support Agent Priya',
            content: 'We have dispatched an expedited logistics escalation.',
            timestamp: '2026-10-10T12:35:00',
          },
        ],
        createdAt: '2026-10-10T12:30:00',
        updatedAt: '2026-10-10T12:35:00',
      },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockBackendResponse,
    } as any);

    const ticket = await supportApi.getTicketById(101);

    expect(getSpy).toHaveBeenCalledWith('/help/tickets/101');
    expect(ticket.ticketId).toBe(101);
    expect(ticket.messages).toHaveLength(2);
    expect(ticket.messages[1].senderRole).toBe('AGENT');
    expect(ticket.messages[1].content).toContain('expedited logistics escalation');
  });
});
