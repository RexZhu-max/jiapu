import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronRight,
  Heart,
  MessageCircle,
  UserPlus,
  Sparkles,
  Calendar,
  Bell,
  Archive,
  Trash2,
} from 'lucide-react';
import {
  clearReadNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationRead,
  markNotificationRead,
  subscribeRealtime,
} from '../../lib/api';
import { StatusNotice } from '../common/StatusNotice';
import { trackEvent } from '../../lib/telemetry';

type NotificationType = 'like' | 'comment' | 'memory' | 'member' | 'event' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  avatar?: string;
  sender: string;
  action: string;
  target?: string;
  time: string;
  isRead: boolean;
  preview?: string;
  image?: string;
}

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  const iconMap = {
    like: { Icon: Heart, color: 'text-[#B93A32]', bg: 'bg-[#B93A32]/10' },
    comment: { Icon: MessageCircle, color: 'text-[#007AFF]', bg: 'bg-[#007AFF]/10' },
    memory: { Icon: Sparkles, color: 'text-[#C5A059]', bg: 'bg-[#C5A059]/10' },
    member: { Icon: UserPlus, color: 'text-[#34C759]', bg: 'bg-[#34C759]/10' },
    event: { Icon: Calendar, color: 'text-[#FF9500]', bg: 'bg-[#FF9500]/10' },
    system: { Icon: Bell, color: 'text-[#8E8E93]', bg: 'bg-[#8E8E93]/10' },
  };

  const config = iconMap[type] || iconMap.system;
  return (
    <div className={`w-7 h-7 rounded-full ${config.bg} flex items-center justify-center`}>
      <config.Icon className={`w-4 h-4 ${config.color}`} />
    </div>
  );
};

const NotificationItem = ({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [swipeX, setSwipeX] = useState(0);
  const MAX_SWIPE = -80;

  const handleContentClick = () => {
    if (swipeX < 0) {
      setSwipeX(0);
      return;
    }
    if (!notification.isRead) {
      onRead(notification.id);
    }
  };

  return (
    <div className="relative overflow-hidden bg-white border-b border-[#F5F5F7]">
      <div className="absolute right-0 top-0 bottom-0 w-[80px] bg-[#1D1D1F] flex items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="w-full h-full flex flex-col items-center justify-center gap-1.5 active:opacity-80 transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-[#B93A32]/20 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-[#B93A32]" strokeWidth={2.5} />
          </div>
          <span className="text-[11px] text-[#B93A32] font-medium tracking-wider">删除</span>
        </button>
      </div>

      <motion.div
        animate={{ x: swipeX }}
        drag="x"
        dragConstraints={{ left: MAX_SWIPE, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(e, info) => {
          if (info.offset.x < MAX_SWIPE / 2 || info.velocity.x < -500) {
            setSwipeX(MAX_SWIPE);
          } else {
            setSwipeX(0);
          }
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        onClick={handleContentClick}
        className={`relative bg-white cursor-pointer ${!notification.isRead ? 'bg-gradient-to-r from-[#FFF9F5] to-white' : ''}`}
      >
        <div className="flex items-start gap-3 px-6 py-4">
          <div className="relative shrink-0 mt-0.5">
            {notification.avatar ? (
              <div className="w-12 h-12 rounded-full overflow-hidden border border-[#EBEBE6] shadow-sm">
                <img src={notification.avatar} alt={notification.sender} className="w-full h-full object-cover grayscale-[0.1]" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center border border-[#EBEBE6]">
                <NotificationIcon type={notification.type} />
              </div>
            )}
            {!notification.isRead && <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#B93A32] rounded-full border-2 border-white shadow-sm" />}
          </div>

          <div className="flex-1 text-left min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-[14px] text-[#1D1D1F] leading-snug flex-1">
                <span className={`${!notification.isRead ? 'font-bold' : 'font-medium'} font-serif`}>{notification.sender}</span>
                {' '}<span className="text-[#555]">{notification.action}</span>
                {notification.target ? <span className="text-[#8E8E93]"> {notification.target}</span> : null}
              </p>
              <span className="text-[11px] text-[#C7C7CC] whitespace-nowrap shrink-0">{notification.time}</span>
            </div>

            {notification.preview ? <p className="text-[13px] text-[#8E8E93] leading-relaxed line-clamp-2 mb-2">{notification.preview}</p> : null}

            {notification.image ? (
              <div className="w-16 h-16 rounded-[8px] overflow-hidden border border-[#EBEBE6] mt-2 shadow-sm">
                <img src={notification.image} alt="" className="w-full h-full object-cover" />
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface NotificationViewProps {
  onBack: () => void;
  token: string;
  onUnreadChange?: (count: number) => void;
}

export const NotificationView = ({ onBack, token, onUnreadChange }: NotificationViewProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);
  const displayedNotifications = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotifications(token);
      setNotifications(data.notifications || []);
      onUnreadChange?.(data.unreadCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [token, onUnreadChange]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const unsubscribe = subscribeRealtime(token, (event) => {
      if (event.type === 'notification-updated') {
        const action = event.data?.action;
        const unread = typeof event.data?.unreadCount === 'number' ? event.data.unreadCount : undefined;
        const ids: string[] = Array.isArray(event.data?.ids) ? event.data.ids : [];
        if (action === 'create' && event.data?.notification) {
          setNotifications((prev) => [event.data.notification, ...prev.filter((n) => n.id !== event.data.notification.id)]);
        } else if (action === 'read-all') {
          setNotifications((prev) => prev.map((n) => (ids.length === 0 || ids.includes(n.id) ? { ...n, isRead: true } : n)));
        } else if (action === 'read-one' && event.data?.id) {
          setNotifications((prev) => prev.map((n) => (n.id === event.data.id ? { ...n, isRead: true } : n)));
        } else if (action === 'delete-one' && event.data?.id) {
          setNotifications((prev) => prev.filter((n) => n.id !== event.data.id));
        } else if (action === 'clear-read') {
          if (ids.length > 0) {
            setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
          } else {
            setNotifications((prev) => prev.filter((n) => !n.isRead));
          }
        } else {
          fetchList();
        }
        if (typeof unread === 'number') {
          onUnreadChange?.(unread);
        }
      }
    });
    return unsubscribe;
  }, [token, fetchList, onUnreadChange]);

  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationRead(token, id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      trackEvent('notification.read.one', { id });
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(token, id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      trackEvent('notification.delete.one', { id });
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      trackEvent('notification.read.all');
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleClearAll = async () => {
    try {
      await clearReadNotifications(token);
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      trackEvent('notification.clear.read');
    } catch (err) {
      setError(err instanceof Error ? err.message : '清空失败');
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-[#F9F9F7] flex flex-col"
    >
      <div className="bg-white border-b border-[#EBEBE6] px-6 pt-14 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-black/5">
            <ChevronRight className="w-6 h-6 rotate-180 text-[#1D1D1F]" />
          </button>
          <h1 className="text-[17px] font-bold font-serif text-[#1D1D1F]">消息通知</h1>
          <button onClick={handleMarkAllRead} className="text-[13px] text-[#007AFF] font-medium">
            全部已读
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-4 rounded-[8px] text-[13px] font-medium transition-colors ${
              filter === 'all' ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#8E8E93]'
            }`}
          >
            全部消息
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 px-4 rounded-[8px] text-[13px] font-medium transition-colors flex items-center justify-center gap-1 ${
              filter === 'unread' ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#8E8E93]'
            }`}
          >
            未读
            {unreadCount > 0 ? (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === 'unread' ? 'bg-white text-[#1D1D1F]' : 'bg-[#B93A32] text-white'}`}>
                {unreadCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <div className="px-6 pt-2">
        {error ? <StatusNotice kind="error" text={error} /> : null}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-6 pt-3">
            <StatusNotice kind="loading" text="消息加载中..." />
          </div>
        ) : displayedNotifications.length > 0 ? (
          <div>
            {displayedNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onRead={handleMarkAsRead} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-20 h-20 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-[#C7C7CC]" />
            </div>
            <p className="text-[14px] text-[#8E8E93] text-center font-serif">{filter === 'unread' ? '暂无未读消息' : '暂无通知消息'}</p>
            <p className="text-[12px] text-[#C7C7CC] text-center mt-2">家族动态、评论点赞将在此显示</p>
          </div>
        )}

        {notifications.filter((n) => n.isRead).length > 0 && filter === 'all' ? (
          <div className="p-6">
            <button
              onClick={handleClearAll}
              className="w-full py-3 rounded-[8px] bg-[#F5F5F7] text-[#8E8E93] text-[13px] font-medium flex items-center justify-center gap-2 active:bg-[#EBEBE6] transition-colors"
            >
              <Archive className="w-4 h-4" />
              清空已读消息
            </button>
          </div>
        ) : null}
      </div>

      <div className="h-6 bg-[#F9F9F7]" />
    </motion.div>
  );
};
