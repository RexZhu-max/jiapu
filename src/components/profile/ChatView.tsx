import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, MessageCircle, Send, Loader2, Users } from 'lucide-react';
import {
  connectChatSocket,
  getChatConversations,
  getChatMessages,
  markChatConversationRead,
  sendChatMessage,
  type ChatConversation,
  type ChatMessage,
} from '../../lib/api';
import { StatusNotice } from '../common/StatusNotice';
import { trackEvent } from '../../lib/telemetry';

interface ChatViewProps {
  token: string;
  currentUserId: string;
  onBack: () => void;
  onUnreadChange?: (count: number) => void;
}

function formatConversationTime(iso: string) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export const ChatView = ({ token, currentUserId, onBack, onUnreadChange }: ChatViewProps) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  const refreshConversations = useCallback(async () => {
    try {
      const data = await getChatConversations(token);
      setConversations(data.conversations || []);
      onUnreadChange?.(data.totalUnread || 0);

      if (!selectedConversationId && data.conversations.length > 0) {
        setSelectedConversationId(data.conversations[0].id);
      } else if (
        selectedConversationId &&
        data.conversations.length > 0 &&
        !data.conversations.some((item) => item.id === selectedConversationId)
      ) {
        setSelectedConversationId(data.conversations[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '会话列表加载失败');
    } finally {
      setLoadingConversations(false);
    }
  }, [onUnreadChange, selectedConversationId, token]);

  const refreshMessages = useCallback(
    async (conversationId: string) => {
      if (!conversationId) {
        setMessages([]);
        return;
      }
      setLoadingMessages(true);
      try {
        const data = await getChatMessages(token, conversationId);
        setMessages(data.messages || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '消息加载失败');
      } finally {
        setLoadingMessages(false);
      }
    },
    [token],
  );

  const markRead = useCallback(
    async (conversationId: string) => {
      if (!conversationId) return;
      try {
        const data = await markChatConversationRead(token, conversationId);
        if (typeof data?.totalUnread === 'number') {
          onUnreadChange?.(data.totalUnread);
        }
      } catch {
        // 忽略已读失败，避免打断阅读体验
      }
    },
    [onUnreadChange, token],
  );

  useEffect(() => {
    setLoadingConversations(true);
    setError('');
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    refreshMessages(selectedConversationId);
    markRead(selectedConversationId);
  }, [markRead, refreshMessages, selectedConversationId]);

  useEffect(() => {
    const close = connectChatSocket(token, {
      onMessage: async (event) => {
        setMessages((prev) => {
          if (event.conversationId !== selectedConversationId) return prev;
          if (prev.some((item) => item.id === event.message.id)) return prev;
          return [...prev, event.message];
        });

        if (event.conversationId === selectedConversationId && event.message.sender.id !== currentUserId) {
          await markRead(event.conversationId);
        }
        refreshConversations();
      },
      onConversation: () => {
        refreshConversations();
      },
      onError: () => {
        setError('消息通道连接异常，正在自动恢复');
      },
    });

    return close;
  }, [currentUserId, markRead, refreshConversations, selectedConversationId, token]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !selectedConversationId || sending) return;

    setSending(true);
    setError('');
    try {
      const data = await sendChatMessage(token, selectedConversationId, content);
      setDraft('');
      setMessages((prev) => {
        if (prev.some((item) => item.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
      trackEvent('chat.message.send', { conversationId: selectedConversationId });
      refreshConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
      trackEvent('chat.message.send.failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 24, stiffness: 280 }}
      className="fixed inset-0 z-50 bg-[#F9F9F7] flex flex-col"
    >
      <div className="bg-white border-b border-[#EBEBE6] px-6 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-black/5">
            <ChevronRight className="w-6 h-6 rotate-180 text-[#1D1D1F]" />
          </button>
          <h1 className="text-[17px] font-bold font-serif text-[#1D1D1F]">家族消息</h1>
          <div className="w-8" />
        </div>
      </div>

      {error ? (
        <div className="px-6 pt-2">
          <StatusNotice kind="error" text={error} />
        </div>
      ) : null}

      <div className="flex-1 min-h-0 flex">
        <aside className="w-[42%] border-r border-[#EBEBE6] bg-white overflow-y-auto">
          {loadingConversations ? (
            <div className="p-4">
              <StatusNotice kind="loading" text="会话加载中..." />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-[12px] text-[#8E8E93]">暂无会话</div>
          ) : (
            conversations.map((conversation) => {
              const active = conversation.id === selectedConversationId;
              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full px-4 py-3 text-left border-b border-[#F5F5F7] ${active ? 'bg-[#F9F2EF]' : 'bg-white'}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-9 h-9 rounded-full bg-[#1D1D1F]/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-[#1D1D1F]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-bold text-[#1D1D1F] truncate">{conversation.name}</p>
                        <span className="text-[10px] text-[#B0B0B6]">{formatConversationTime(conversation.updatedAt)}</span>
                      </div>
                      <p className="text-[11px] text-[#8E8E93] truncate mt-1">
                        {conversation.lastMessage?.content || '暂无消息'}
                      </p>
                    </div>
                  </div>
                  {conversation.unreadCount > 0 ? (
                    <div className="mt-2 inline-flex min-w-5 h-5 px-1.5 rounded-full bg-[#B93A32] text-white text-[10px] items-center justify-center">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </div>
                  ) : null}
                </button>
              );
            })
          )}
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-[#8E8E93]">
              <MessageCircle className="w-10 h-10 mb-3 text-[#C7C7CC]" />
              <p className="text-[13px]">请选择一个会话开始聊天</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-[#EBEBE6] bg-white">
                <p className="text-[14px] font-bold text-[#1D1D1F] truncate">{activeConversation.name}</p>
                <p className="text-[11px] text-[#8E8E93] mt-1">{activeConversation.participants.map((item) => item.name).join('、')}</p>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {loadingMessages ? (
                  <StatusNotice kind="loading" text="消息加载中..." />
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[12px] text-[#8E8E93]">暂无消息</div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.sender.id === currentUserId;
                    return (
                      <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[88%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                          <span className="text-[10px] text-[#B0B0B6] mb-1">{isMine ? '我' : message.sender.name}</span>
                          <div
                            className={`px-3 py-2 rounded-[10px] text-[13px] leading-relaxed ${
                              isMine
                                ? 'bg-[#1D1D1F] text-white rounded-br-[2px]'
                                : 'bg-white border border-[#EBEBE6] text-[#1D1D1F] rounded-bl-[2px]'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 border-t border-[#EBEBE6] bg-white flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="输入消息..."
                  rows={1}
                  className="flex-1 resize-none rounded-[10px] border border-[#EBEBE6] bg-[#F9F9F7] px-3 py-2 text-[13px] text-[#1D1D1F] focus:outline-none focus:border-[#B93A32]"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !draft.trim()}
                  className="w-10 h-10 rounded-full bg-[#B93A32] text-white flex items-center justify-center disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </motion.div>
  );
};
