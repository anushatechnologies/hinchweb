import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import { orderApi } from '../api/orderApi';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import type {
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  Order,
} from '../types';
import { formatDateTime } from '../utils/formatters';
import {
  LifeBuoy,
  Plus,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Paperclip,
  Package,
  X,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export const SupportPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId');
  const initialTicketId = searchParams.get('ticketId');

  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useToastStore();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Orders list for dropdown selector in new ticket modal
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(Boolean(initialOrderId));
  const [newSubject, setNewSubject] = useState(initialOrderId ? `Issue regarding Order #${initialOrderId}` : '');
  const [newCategory, setNewCategory] = useState<TicketCategory>(initialOrderId ? 'DELIVERY' : 'GENERAL');
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM');
  const [newOrderId, setNewOrderId] = useState<string>(initialOrderId || '');
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load tickets list
  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const data = await supportApi.getTickets({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setTickets(data);

      if (data.length > 0) {
        if (initialTicketId) {
          const match = data.find((t) => String(t.ticketId) === String(initialTicketId));
          if (match) {
            handleSelectTicket(match.ticketId);
            return;
          }
        }
        if (!selectedTicket || !data.some((t) => t.ticketId === selectedTicket.ticketId)) {
          handleSelectTicket(data[0].ticketId);
        }
      } else {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.warn('Failed to load support tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  // Load user orders for selector
  useEffect(() => {
    if (isAuthenticated) {
      orderApi
        .getOrders()
        .then((ords) => setUserOrders(ords))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Select active ticket and fetch full message thread
  const handleSelectTicket = async (ticketId: number) => {
    try {
      const detailed = await supportApi.getTicketById(ticketId);
      setSelectedTicket(detailed);
      setSearchParams({ ticketId: String(ticketId) });
    } catch (err) {
      console.warn('Failed to load ticket details:', err);
      const fallback = tickets.find((t) => t.ticketId === ticketId);
      if (fallback) setSelectedTicket(fallback);
    }
  };

  // Scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  // Handle Send Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const newMsg = await supportApi.addMessage(selectedTicket.ticketId, {
        content: replyText.trim(),
        attachmentUrl: replyAttachment.trim() || undefined,
      });

      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, newMsg],
              updatedAt: new Date().toISOString(),
            }
          : prev
      );

      setReplyText('');
      setReplyAttachment('');
      showToast('success', 'Your reply has been posted to the ticket.', 'Message Sent');
    } catch (err: any) {
      console.error(err);
      showToast('error', err?.message || 'Failed to post reply message', 'Reply Error');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Handle Create New Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      showToast('error', 'Please provide a subject and detailed message.', 'Missing Fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await supportApi.createTicket({
        subject: newSubject.trim(),
        message: newMessage.trim(),
        category: newCategory,
        priority: newPriority,
        orderId: newOrderId ? Number(newOrderId) : undefined,
      });

      showToast('success', `Ticket #${created.ticketNumber} created successfully!`, 'Ticket Submitted');
      setIsModalOpen(false);
      setNewSubject('');
      setNewMessage('');
      setNewOrderId('');
      setNewCategory('GENERAL');
      setNewPriority('MEDIUM');

      // Refresh list and select the new ticket
      await loadTickets();
      setSelectedTicket(created);
    } catch (err: any) {
      console.error(err);
      showToast('error', err?.message || 'Failed to create support ticket', 'Submission Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered tickets by search query
  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.subject.toLowerCase().includes(q) ||
      t.ticketNumber.toLowerCase().includes(q) ||
      (t.orderId && String(t.orderId).includes(q))
    );
  });

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">Urgent</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">High</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">Medium</span>;
      case 'LOW':
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">Low</span>;
    }
  };

  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Resolved</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
            <Clock className="w-3 h-3 text-blue-600 animate-spin" />
            <span>In Progress</span>
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
            <span>Closed</span>
          </span>
        );
      case 'OPEN':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Open</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-industrial-950 via-slate-900 to-industrial-950 rounded-3xl p-6 sm:p-8 text-white border border-industrial-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-brand-600/30 shrink-0">
            <LifeBuoy className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Enterprise Support & Help Desk
            </h1>
            <p className="text-xs text-industrial-400">
              Direct resolution desk for delivery timelines, weighbridge MTC, invoicing, payments, and site logistics.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Raise New Support Ticket</span>
        </button>
      </div>

      {/* 2. Metrics & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-industrial-900 text-white shadow-sm'
                  : 'bg-white text-industrial-600 hover:bg-industrial-100 border border-industrial-200'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search Box & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-industrial-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket # or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-industrial-200 rounded-xl text-xs text-industrial-900 placeholder:text-industrial-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            onClick={loadTickets}
            title="Refresh Tickets"
            className="p-2 bg-white hover:bg-industrial-100 border border-industrial-200 rounded-xl text-industrial-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Main Workspace: Tickets Master-Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column: Tickets List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {isLoading && tickets.length === 0 ? (
            <div className="p-12 text-center text-xs text-industrial-500 bg-white rounded-3xl border border-industrial-200">
              Loading support tickets from backend...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-dashed border-industrial-200">
              <div className="w-12 h-12 rounded-2xl bg-industrial-100 text-industrial-500 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6 text-brand-600" />
              </div>
              <h4 className="font-bold text-sm text-industrial-900">No Support Tickets Found</h4>
              <p className="text-xs text-industrial-500 max-w-xs mx-auto">
                Need assistance with an order, invoice, or quote? Click "Raise New Support Ticket" to start an inquiry.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {filteredTickets.map((ticket) => {
                const isSelected = selectedTicket?.ticketId === ticket.ticketId;
                const lastMsg = ticket.messages?.[ticket.messages.length - 1];

                return (
                  <div
                    key={ticket.ticketId}
                    onClick={() => handleSelectTicket(ticket.ticketId)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-brand-50/40 border-brand-500 shadow-sm ring-1 ring-brand-500/20'
                        : 'bg-white border-industrial-200 hover:border-industrial-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-industrial-500">
                        <span>#{ticket.ticketNumber}</span>
                        {ticket.orderId && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-industrial-100 text-industrial-700 font-semibold">
                            Order #{ticket.orderId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getPriorityBadge(ticket.priority)}
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-industrial-950 line-clamp-1">
                        {ticket.subject}
                      </h4>
                      {lastMsg && (
                        <p className="text-[11px] text-industrial-500 line-clamp-1 mt-0.5">
                          <strong className="text-industrial-700">{lastMsg.senderName || lastMsg.senderRole}:</strong>{' '}
                          {lastMsg.content}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-industrial-400 pt-1 border-t border-industrial-100/70">
                      <span className="font-semibold text-industrial-600 uppercase tracking-wider">
                        {ticket.category}
                      </span>
                      <span>{formatDateTime(ticket.updatedAt || ticket.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Ticket Thread (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="bg-white rounded-3xl border border-industrial-200 shadow-card flex flex-col h-[750px] overflow-hidden">
              {/* Ticket Details Top Header */}
              <div className="p-5 border-b border-industrial-100 bg-industrial-50/50 space-y-2 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-600">
                      #{selectedTicket.ticketNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-industrial-200 text-industrial-700 text-[10px] font-bold uppercase">
                      {selectedTicket.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-industrial-950">
                  {selectedTicket.subject}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-industrial-500 pt-1">
                  {selectedTicket.orderId && (
                    <div className="flex items-center gap-1 text-brand-700 font-semibold">
                      <Package className="w-3.5 h-3.5" />
                      <span>Linked Order #{selectedTicket.orderId}</span>
                      <Link
                        to="/orders"
                        className="text-[10px] text-brand-600 underline hover:text-brand-800 ml-1 inline-flex items-center gap-0.5"
                      >
                        <span>View</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  )}
                  <div>Opened: {formatDateTime(selectedTicket.createdAt)}</div>
                </div>
              </div>

              {/* Message Thread (Scrollable) */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
                {selectedTicket.messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-industrial-400">
                    No messages yet in this ticket.
                  </div>
                ) : (
                  selectedTicket.messages.map((msg) => {
                    const isUser = msg.senderRole === 'USER' || msg.senderId === user?.id;

                    return (
                      <div
                        key={msg.messageId}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-industrial-500">
                          <span className="font-bold text-industrial-800">
                            {msg.senderName || (isUser ? 'Me' : 'Support Specialist')}
                          </span>
                          {!isUser && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase">
                              Help Desk
                            </span>
                          )}
                          <span>•</span>
                          <span>{formatDateTime(msg.timestamp)}</span>
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-2 leading-relaxed shadow-xs ${
                            isUser
                              ? 'bg-industrial-900 text-white rounded-tr-none'
                              : 'bg-white text-industrial-900 border border-industrial-200 rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {msg.attachmentUrl && (
                            <div className="pt-2 border-t border-white/20">
                              <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold underline ${
                                  isUser ? 'text-brand-300 hover:text-white' : 'text-brand-600 hover:text-brand-800'
                                }`}
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>View Attachment</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Box at Bottom */}
              <div className="p-4 border-t border-industrial-100 bg-white shrink-0">
                {selectedTicket.status === 'CLOSED' ? (
                  <div className="p-3 bg-industrial-50 rounded-xl text-center text-xs text-industrial-500">
                    This support ticket has been closed. If you require further assistance, please raise a new ticket.
                  </div>
                ) : (
                  <form onSubmit={handleSendReply} className="space-y-3">
                    <div className="relative">
                      <textarea
                        rows={3}
                        placeholder="Type your message / update here..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full p-3 bg-industrial-50 border border-industrial-200 rounded-xl text-xs text-industrial-900 placeholder:text-industrial-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <Paperclip className="w-4 h-4 text-industrial-400 shrink-0" />
                        <input
                          type="url"
                          placeholder="Attachment URL (optional, e.g. receipt or photo link)"
                          value={replyAttachment}
                          onChange={(e) => setReplyAttachment(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-industrial-50 border border-industrial-200 rounded-lg text-xs text-industrial-800 placeholder:text-industrial-400 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSendingReply || !replyText.trim()}
                        className="px-5 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSendingReply ? 'Sending...' : 'Send Reply'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-industrial-200 text-industrial-400 space-y-3">
              <MessageSquare className="w-10 h-10 text-industrial-300" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-industrial-900">Select a Ticket to View Thread</h4>
                <p className="text-xs text-industrial-500 max-w-sm">
                  Click any ticket from the list on the left to read agent messages and send replies.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Modal: Create New Support Ticket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-industrial-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-industrial-200 animate-in zoom-in-95">
            <div className="bg-industrial-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-base">Raise Support Ticket</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-industrial-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-industrial-800">
                  Subject / Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delayed delivery for Order #1042"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-industrial-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-industrial-800">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                    className="w-full p-2.5 rounded-xl border border-industrial-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="DELIVERY">Delivery & Dispatch</option>
                    <option value="PAYMENT">Payment & Invoices</option>
                    <option value="QUALITY">Quality & MTC</option>
                    <option value="RFQ">RFQ & Quotations</option>
                    <option value="TECHNICAL">Technical & Portal</option>
                    <option value="GENERAL">General Inquiries</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-industrial-800">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full p-2.5 rounded-xl border border-industrial-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium (Standard)</option>
                    <option value="HIGH">High (Urgent Dispatch)</option>
                    <option value="URGENT">Critical / Site Hold</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-industrial-800">
                  Associated Order ID <span className="text-industrial-400 font-normal">(Optional)</span>
                </label>
                {userOrders.length > 0 ? (
                  <select
                    value={newOrderId}
                    onChange={(e) => setNewOrderId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-industrial-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">None / Not Order Related</option>
                    {userOrders.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        Order #{ord.orderNumber || ord.id} ({ord.status})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    placeholder="Enter order ID if applicable (e.g. 1042)"
                    value={newOrderId}
                    onChange={(e) => setNewOrderId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-industrial-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-industrial-800">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your issue with exact details so our engineering and dispatch team can assist promptly..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-industrial-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-industrial-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-industrial-200 text-industrial-700 font-bold rounded-xl hover:bg-industrial-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-md shadow-brand-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
