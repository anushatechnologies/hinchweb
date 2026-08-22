import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { formatTimeAgo } from '../../utils/formatters';
import {
  X,
  Send,
  Building2,
  CheckCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const QUICK_PROMPTS = [
  'Can you provide Mill Test Certificate (MTC)?',
  'What is the best price for 50+ Tons delivery to Hyderabad?',
  'Can you dispatch within 48 hours?',
  'Do you support 45-day credit terms on HinchMart PayLater?',
];

export const ChatDrawer: React.FC = () => {
  const {
    isOpen,
    activeConversation,
    activeSeller,
    messages,
    conversations,
    closeChat,
    openConversation,
    sendMessage,
    fetchConversations,
  } = useChatStore();

  const [inputMsg, setInputMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'conversations'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    sendMessage(inputMsg.trim());
    setInputMsg('');
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const seller = activeSeller || activeConversation?.seller;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-industrial-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-industrial-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="bg-industrial-900 text-white p-4 flex items-center justify-between border-b border-industrial-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-industrial-900 absolute -bottom-0.5 -right-0.5"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm truncate max-w-[200px]">
                  {seller ? seller.name : 'Supplier Direct Desk'}
                </h4>
                {seller?.isVerified && (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </div>
              <div className="text-[11px] text-industrial-300 flex items-center gap-1">
                <span>{seller ? `${seller.city}, ${seller.state}` : 'Verified Network'}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Online for RFQs</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'chat' ? 'conversations' : 'chat')}
              className="text-xs px-2.5 py-1 rounded-lg bg-industrial-800 hover:bg-industrial-700 text-industrial-200"
            >
              {activeTab === 'chat' ? 'All Chats' : 'Back'}
            </button>
            <button
              onClick={closeChat}
              className="p-1.5 text-industrial-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab View: List of all Conversations */}
        {activeTab === 'conversations' ? (
          <div className="flex-1 overflow-y-auto divide-y divide-industrial-100 p-2">
            <div className="px-3 py-2 text-xs font-bold text-industrial-500 uppercase tracking-wider">
              Recent Supplier Discussions
            </div>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  openConversation(conv);
                  setActiveTab('chat');
                }}
                className="p-3 rounded-xl hover:bg-industrial-50 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-industrial-900 truncate">
                    {conv.seller.name}
                  </span>
                  <span className="text-[10px] text-industrial-400">
                    {formatTimeAgo(conv.lastMessageTime)}
                  </span>
                </div>
                <div className="text-xs font-semibold text-brand-700 truncate">{conv.subject}</div>
                <div className="text-[11px] text-industrial-500 truncate">{conv.lastMessage}</div>
              </div>
            ))}
          </div>
        ) : (
          /* Active Chat View */
          <>
            {/* Topic Banner */}
            {activeConversation && (
              <div className="bg-industrial-50 px-4 py-2 border-b border-industrial-200 text-xs flex items-center justify-between">
                <span className="font-semibold text-industrial-700 truncate">
                  Topic: {activeConversation.subject}
                </span>
                <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                  {activeConversation.topic}
                </span>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-industrial-50/50">
              <div className="text-center my-2">
                <span className="text-[10px] bg-industrial-200/70 text-industrial-600 px-3 py-1 rounded-full font-medium">
                  Verified HinchMart Direct Chat • End-to-End Logged for Purchase Orders
                </span>
              </div>

              {messages.map((msg) => {
                const isBuyer = msg.sender === 'buyer';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isBuyer ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] text-industrial-400 mb-0.5 px-1">
                      {msg.senderName}
                    </div>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                        isBuyer
                          ? 'bg-brand-600 text-white rounded-br-xs shadow-md shadow-brand-600/10'
                          : 'bg-white text-industrial-900 rounded-bl-xs border border-industrial-200 shadow-subtle'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-industrial-400 mt-0.5 px-1">
                      <span>{formatTimeAgo(msg.timestamp)}</span>
                      {isBuyer && <CheckCheck className="w-3 h-3 text-brand-600" />}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="p-2 bg-white border-t border-industrial-100 flex gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-industrial-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 text-[10px] text-industrial-700 font-medium border border-industrial-200 transition-colors shrink-0 flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5 text-brand-500" />
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-industrial-200 flex gap-2">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Ask about bulk rates, testing certificates, dispatch..."
                className="flex-1 px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-xs text-industrial-900 placeholder:text-industrial-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim()}
                className="p-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white rounded-xl shadow-md shadow-brand-600/20 transition-all flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
