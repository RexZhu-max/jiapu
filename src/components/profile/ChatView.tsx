import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  type ChatSocketLifecycle,
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

function messageTimeValue(iso: string) {
  const value = new Date(iso).getTime();
  return Number.isFinite(value) ? value : 0;
}

function mergeMessages(prev: ChatMessage[], incoming: ChatMessage[]) {
  if (incoming.length === 0) return prev;
  const map = new Map<string, ChatMessage>();
  prev.forEach((item) => map.set(item.id, item));
  incoming.forEach((item) => map.set(item.id, item));
  return Array.from(map.values()).sort((a, b) => messageTimeValue(a.createdAt) - messageTimeValue(b.createdAt));
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
  const [socketStatus, setSocketStatus] = useState<ChatSocketLifecycle>('connecting');

  const selectedConversationRef = useRef('');
  const cursorByConversationRef = useRef<Record<string, string>>({});

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  const updateCursor = useCallback((conversationId: string, nextCursor: string) => {
    if (!conversationId || !nextCursor) return;
    const currentCursor = cursorByConversationRef.current[conversationId] || '';
    if (!currentCursor || messageTimeValue(nextCursor) >= messageTimeValue(currentCursor)) {
      cursorByConversationRef.current[conversationId] = nextCursor;
    }
  }, []);

  const refreshConversations = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoadingConversations(true);
      }
      try {
        const data = await getChatConversations(token);
        const nextConversations = data.conversations || [];
        setConversations(nextConversations);
        onUnreadChange?.(data.totalUnread || 0);

        if (!selectedConversationRef.current && nextConversations.length > 0) {
          setSelectedConversationId(nextConversations[0].id);
        } else if (
          selectedConversationRef.current &&
          nextConversations.length > 0 &&
          !nextConversations.some((item) => item.id === selectedConversationRef.current)
        ) {
          setSelectedConversationId(nextConversations[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '会话列表加载失败');
      } finally {
        if (!silent) {
          setLoadingConversations(false);
        }
      }
    },
    [onUnreadChange, token],
  );

  const markRead = useCallback(
    async (conversationId: string) => {
      if (!conversationId) return;
      try {
        const data = await markChatConversationRead(token, conversationId);
        if (typeof data?.totalUnread === 'number') {
          onUnreadChange?.(data.totalUnread);
        }
        setConversations((prev) => prev.map((item) => (item.id === conversationId ? { ...item, unreadCount: 0 } : item)));
      } catch {
        // 忽略已读失败，避免打断阅读体验
      }
    },
    [onUnreadChange, token],
  );

  const refreshMessages = useCallback(
    async (conversationId: string, mode: 'full' | 'delta' = 'full') => {
      if (!conversationId) {
        setMessages([]);
        return;
      }

      if (mode === 'full') {
        setLoadingMessages(true);
      }

      try {
        const query = mode === 'delta'
          ? { after: cursorByConversationRef.current[conversationId] || '', limit: 200 }
          : { limit: 200 };
        const data = await getChatMessages(token, conversationId, query);

        if (selectedConversationRef.current !== conversationId) {
          return;
        }

        if (mode === 'full') {
          setMessages(data.messages || []);
        } else if ((data.messages || []).length > 0) {
          setMessages((prev) => mergeMessages(prev, data.messages || []));
        }

        if (data.cursor) {
          updateCursor(conversationId, data.cursor);
        } else {
          const latest = (data.messages || []).slice(-1)[0]?.createdAt || '';
          updateCursor(conversationId, latest);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '消息加载失败');
      } finally {
        if (mode === 'full') {
          setLoadingMessages(false);
        }
      }
    },
    [token, updateCursor],
  );

  useEffect(() => {
    selectedConversationRef.current = selectedConversationId;
  }, [selectedConversationId]);

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
    refreshMessages(selectedConversationId, 'full');
    markRead(selectedConversationId);
  }, [markRead, refreshMessages, selectedConversationId]);

  useEffect(() => {
    const close = connectChatSocket(token, {
      onStatusChange: (status) => {
        setSocketStatus(status);
      },
      onConnected: () => {
        setError('');
      },
      onReconnected: () => {
        const activeId = selectedConversationRef.current;
        if (activeId) {
          refreshMessages(activeId, 'delta');
        }
        refreshConversations(true);
      },
      onMessage: async (event) => {
        updateCursor(event.conversationId, event.message.createdAt);
        if (event.conversationId === selectedConversationRef.current) {
          setMessages((prev) => mergeMessages(prev, [event.message]));
          if (event.message.sender.id !== currentUserId) {
            await markRead(event.conversationId);
          }
        }
        refreshConversations(true);
      },
      onConversation: () => {
        refreshConversations(true);
      },
      onError: () => {
        setError('消息通道连接异常，正在重连并补拉消息');
      },
    });

    return close;
  }, [currentUserId, markRead, refreshConversations, refreshMessages, token, updateCursor]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !selectedConversationId || sending) return;

    setSending(true);
    setError('');
    try {
      const data = await sendChatMessage(token, selectedConversationId, content);
      setDraft('');
      setMessages((prev) => mergeMessages(prev, [data.message]));
      updateCursor(selectedConversationId, data.message.createdAt);
      trackEvent('chat.message.send', { conversationId: selectedConversationId });
      refreshConversations(true);
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

      {socketStatus === 'reconnecting' ? (
        <div className="px-6 pt-2">
          <StatusNotice kind="info" text="网络波动，正在重连并补拉消息..." />
        </div>
      ) : null}

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
