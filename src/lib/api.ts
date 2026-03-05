import { resolveApiBaseUrl, resolveAssetUrl, withApiBase } from './native/capabilities';

export type SessionUser = {
  id: string;
  name: string;
  phone: string;
  role: string;
  avatar: string;
  familyId: string;
};

export type Session = {
  token: string;
  user: SessionUser;
};

export type RealtimeEventName =
  | 'connected'
  | 'heartbeat'
  | 'moment-updated'
  | 'notification-updated'
  | 'family-tree-updated';

interface RealtimeEvent {
  type: RealtimeEventName;
  data: any;
}

interface UploadMediaOptions {
  onProgress?: (percent: number) => void;
  retries?: number;
  compressImage?: boolean;
  signal?: AbortSignal;
}

export interface ChatParticipant {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: ChatParticipant;
  type: 'text';
  content: string;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  familyId: string;
  name: string;
  type: 'group' | 'direct';
  updatedAt: string;
  participants: ChatParticipant[];
  unreadCount: number;
  lastMessage: ChatMessage | null;
}

interface ChatSocketHandlers {
  onStatusChange?: (status: ChatSocketLifecycle) => void;
  onConnected?: (payload: any) => void;
  onReconnected?: () => void;
  onMessage?: (event: { conversationId: string; message: ChatMessage }) => void;
  onConversation?: (event: any) => void;
  onError?: (event: Event) => void;
}

export type ChatSocketLifecycle = 'connecting' | 'connected' | 'reconnecting' | 'closed';

interface ChatMessagesQueryOptions {
  after?: string;
  limit?: number;
}

const SESSION_KEY = 'heritage.session';

function normalizeMoment(moment: any) {
  if (!moment) return moment;
  return {
    ...moment,
    user: moment.user
      ? {
          ...moment.user,
          avatar: resolveAssetUrl(moment.user.avatar || ''),
        }
      : moment.user,
    images: Array.isArray(moment.images) ? moment.images.map((url: string) => resolveAssetUrl(url || '')) : [],
    audio: moment.audio
      ? {
          ...moment.audio,
          url: resolveAssetUrl(moment.audio.url || ''),
        }
      : moment.audio,
  };
}

function normalizeNotification(notification: any) {
  if (!notification) return notification;
  return {
    ...notification,
    avatar: resolveAssetUrl(notification.avatar || ''),
    image: resolveAssetUrl(notification.image || ''),
  };
}

function normalizeGenerations(generations: any[] = []) {
  return generations.map((generation) => ({
    ...generation,
    members: Array.isArray(generation.members)
      ? generation.members.map((member: any) => ({
          ...member,
          img: resolveAssetUrl(member.img || ''),
        }))
      : [],
  }));
}

function normalizeChatParticipant(participant: any): ChatParticipant {
  return {
    id: String(participant?.id || ''),
    name: String(participant?.name || '未知成员'),
    role: String(participant?.role || '成员'),
    avatar: resolveAssetUrl(participant?.avatar || ''),
  };
}

function normalizeChatMessage(message: any): ChatMessage {
  return {
    id: String(message?.id || ''),
    conversationId: String(message?.conversationId || ''),
    sender: normalizeChatParticipant(message?.sender || {}),
    type: 'text',
    content: String(message?.content || ''),
    createdAt: String(message?.createdAt || ''),
  };
}

function normalizeChatConversation(conversation: any): ChatConversation {
  return {
    id: String(conversation?.id || ''),
    familyId: String(conversation?.familyId || ''),
    name: String(conversation?.name || '未命名会话'),
    type: conversation?.type === 'direct' ? 'direct' : 'group',
    updatedAt: String(conversation?.updatedAt || ''),
    participants: Array.isArray(conversation?.participants)
      ? conversation.participants.map((item: any) => normalizeChatParticipant(item))
      : [],
    unreadCount: Number(conversation?.unreadCount || 0),
    lastMessage: conversation?.lastMessage ? normalizeChatMessage(conversation.lastMessage) : null,
  };
}

function resolveWsBaseUrl() {
  const apiBase = resolveApiBaseUrl();
  if (!apiBase) return '';
  return apiBase.replace(/^http/i, 'ws');
}

function buildChatWsUrl(token: string) {
  const wsBase = resolveWsBaseUrl();
  if (wsBase) {
    return `${wsBase}/ws/chat?token=${encodeURIComponent(token)}`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/chat?token=${encodeURIComponent(token)}`;
}

async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(withApiBase(path), { ...options, headers });
  if (!res.ok) {
    let message = '请求失败';
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(task: () => Promise<T>, retries = 2): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await task();
    } catch (error) {
      if (error instanceof Error && error.message.includes('取消')) {
        throw error;
      }
      if (attempt >= retries) {
        throw error;
      }
      attempt += 1;
      await wait(300 * attempt);
    }
  }
}

function toDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片解析失败'));
    img.src = url;
  });
}

async function maybeCompressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size < 350 * 1024) return file;

  const dataUrl = await toDataUrl(file);
  const img = await loadImage(dataUrl);
  const maxSide = 1600;
  const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
  const targetWidth = Math.max(1, Math.round(img.width * ratio));
  const targetHeight = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), 'image/jpeg', 0.82);
  });
  if (!blob) return file;

  const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
  return compressed.size < file.size ? compressed : file;
}

function uploadByXHR<T>(
  path: string,
  body: string,
  token: string,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', withApiBase(path), true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (signal?.aborted) {
      reject(new Error('上传已取消'));
      return;
    }

    const abortHandler = () => {
      xhr.abort();
      reject(new Error('上传已取消'));
    };
    signal?.addEventListener('abort', abortHandler, { once: true });

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(Math.min(100, Math.max(0, percent)));
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve(json as T);
        } else {
          reject(new Error(json?.message || '上传失败'));
        }
      } catch {
        reject(new Error('上传响应解析失败'));
      } finally {
        signal?.removeEventListener('abort', abortHandler);
      }
    };

    xhr.onerror = () => {
      signal?.removeEventListener('abort', abortHandler);
      reject(new Error('网络错误，上传失败'));
    };
    xhr.onabort = () => {
      signal?.removeEventListener('abort', abortHandler);
      reject(new Error('上传已取消'));
    };
    xhr.send(body);
  });
}

export function saveSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function subscribeRealtime(
  token: string,
  onEvent: (event: RealtimeEvent) => void,
  onError?: (error: Event) => void,
) {
  const streamUrl = withApiBase(`/api/stream?token=${encodeURIComponent(token)}`);
  const source = new EventSource(streamUrl);

  const bind = (eventName: RealtimeEventName) => {
    source.addEventListener(eventName, (event) => {
      try {
        const message = event as MessageEvent;
        let data = message.data ? JSON.parse(message.data) : {};
        if (eventName === 'moment-updated' && data?.moment) {
          data = { ...data, moment: normalizeMoment(data.moment) };
        }
        if (eventName === 'notification-updated' && data?.notification) {
          data = { ...data, notification: normalizeNotification(data.notification) };
        }
        onEvent({ type: eventName, data });
      } catch {
        onEvent({ type: eventName, data: {} });
      }
    });
  };

  bind('connected');
  bind('heartbeat');
  bind('moment-updated');
  bind('notification-updated');
  bind('family-tree-updated');

  source.onerror = (event) => {
    onError?.(event);
  };

  return () => source.close();
}

export async function login(phone: string, password: string): Promise<Session> {
  const data = await apiFetch<Session>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
  return {
    ...data,
    user: {
      ...data.user,
      avatar: resolveAssetUrl(data.user?.avatar || ''),
    },
  };
}

export async function getMe(token: string) {
  const data = await apiFetch<{ user: SessionUser }>('/api/auth/me', {}, token);
  return {
    user: {
      ...data.user,
      avatar: resolveAssetUrl(data.user?.avatar || ''),
    },
  };
}

export async function getMoments(token: string) {
  const data = await apiFetch<{ moments: any[] }>('/api/moments', {}, token);
  return {
    moments: (data.moments || []).map((moment) => normalizeMoment(moment)),
  };
}

export async function createMoment(
  token: string,
  payload: {
    content: string;
    memoryDate?: string;
    participants?: string[];
    images?: string[];
    audio?: { url: string; duration: string } | null;
    location?: string;
  },
) {
  const data = await apiFetch<{ moment: any }>('/api/moments', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
  return {
    moment: normalizeMoment(data.moment),
  };
}

export async function uploadMedia(
  token: string,
  file: File,
  type: 'image' | 'audio' | 'video' = 'image',
  options: UploadMediaOptions = {},
) {
  const { onProgress, retries = 2, compressImage = true, signal } = options;
  const prepared = compressImage && type === 'image' ? await maybeCompressImage(file) : file;
  const dataUrl = await toDataUrl(prepared);
  const body = JSON.stringify({
    dataUrl,
    fileName: prepared.name,
    type,
  });

  const result = await withRetry(
    () => uploadByXHR<{ id: string; url: string; type: string }>('/api/media/upload', body, token, onProgress, signal),
    retries,
  );
  return result;
}

export async function getNotifications(token: string) {
  const data = await apiFetch<{ notifications: any[]; unreadCount: number }>('/api/notifications', {}, token);
  return {
    unreadCount: data.unreadCount || 0,
    notifications: (data.notifications || []).map((item) => normalizeNotification(item)),
  };
}

export async function markNotificationRead(token: string, id: string) {
  return apiFetch<{ ok: boolean }>(`/api/notifications/${id}/read`, {
    method: 'POST',
  }, token);
}

export async function markAllNotificationRead(token: string) {
  return apiFetch<{ ok: boolean }>('/api/notifications/read-all', {
    method: 'POST',
  }, token);
}

export async function deleteNotification(token: string, id: string) {
  return apiFetch<{ ok: boolean }>(`/api/notifications/${id}`, {
    method: 'DELETE',
  }, token);
}

export async function clearReadNotifications(token: string) {
  return apiFetch<{ ok: boolean }>('/api/notifications/read', {
    method: 'DELETE',
  }, token);
}

export async function getFamilyTree(token: string) {
  const data = await apiFetch<{ generations: any[] }>('/api/family/tree', {}, token);
  return {
    generations: normalizeGenerations(data.generations || []),
  };
}

export async function createGeneration(
  token: string,
  payload: { title: string; description?: string; position?: 'before' | 'after' },
) {
  const data = await apiFetch<{ generations: any[] }>('/api/family/generations', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
  return {
    generations: normalizeGenerations(data.generations || []),
  };
}

export async function createMember(token: string, payload: any) {
  const data = await apiFetch<{ generations: any[] }>('/api/family/members', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
  return {
    generations: normalizeGenerations(data.generations || []),
  };
}

export async function updateMember(token: string, memberId: string, payload: any) {
  const data = await apiFetch<{ generations: any[] }>(`/api/family/members/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
  return {
    generations: normalizeGenerations(data.generations || []),
  };
}

export function resolveClientUrl(url: string) {
  return resolveAssetUrl(url || '');
}

export async function getChatConversations(token: string) {
  const data = await apiFetch<{ conversations: any[]; totalUnread: number }>('/api/chat/conversations', {}, token);
  return {
    conversations: (data.conversations || []).map((item) => normalizeChatConversation(item)),
    totalUnread: Number(data.totalUnread || 0),
  };
}

export async function getChatMessages(token: string, conversationId: string, options: ChatMessagesQueryOptions = {}) {
  const queryBuilder = new URLSearchParams({ conversationId });
  if (options.after) {
    queryBuilder.set('after', options.after);
  }
  if (typeof options.limit === 'number') {
    queryBuilder.set('limit', String(options.limit));
  }

  const data = await apiFetch<{ messages: any[]; cursor?: string }>(`/api/chat/messages?${queryBuilder.toString()}`, {}, token);
  return {
    messages: (data.messages || []).map((item) => normalizeChatMessage(item)),
    cursor: String(data.cursor || ''),
  };
}

export async function sendChatMessage(token: string, conversationId: string, content: string) {
  const data = await apiFetch<{ message: any }>(
    '/api/chat/messages',
    {
      method: 'POST',
      body: JSON.stringify({ conversationId, content }),
    },
    token,
  );
  return {
    message: normalizeChatMessage(data.message),
  };
}

export async function markChatConversationRead(token: string, conversationId: string) {
  return apiFetch<{ ok: boolean; totalUnread: number }>(
    `/api/chat/conversations/${conversationId}/read`,
    { method: 'POST' },
    token,
  );
}

export function connectChatSocket(token: string, handlers: ChatSocketHandlers) {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let manuallyClosed = false;
  let reconnectAttempt = 0;
  let everConnected = false;

  const clearHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  const clearReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (manuallyClosed) return;
    clearReconnect();
    reconnectAttempt += 1;
    const waitMs = Math.min(8000, 500 * 2 ** Math.min(reconnectAttempt, 4));
    handlers.onStatusChange?.('reconnecting');
    reconnectTimer = setTimeout(() => {
      createSocket();
    }, waitMs);
  };

  const createSocket = () => {
    if (manuallyClosed) return;
    clearReconnect();
    handlers.onStatusChange?.(reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
    socket = new WebSocket(buildChatWsUrl(token));

    socket.onopen = () => {
      const isReconnect = everConnected;
      everConnected = true;
      reconnectAttempt = 0;
      handlers.onStatusChange?.('connected');

      clearHeartbeat();
      heartbeatTimer = setInterval(() => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({ type: 'chat:ping', data: { ts: Date.now() } }));
      }, 20000);

      if (isReconnect) {
        handlers.onReconnected?.();
      }
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data || '{}'));
        if (payload?.type === 'chat:connected') {
          handlers.onConnected?.(payload?.data || {});
          return;
        }
        if (payload?.type === 'chat:message') {
          handlers.onMessage?.({
            conversationId: String(payload?.data?.conversationId || ''),
            message: normalizeChatMessage(payload?.data?.message || {}),
          });
          return;
        }
        if (payload?.type === 'chat:conversation') {
          handlers.onConversation?.(payload?.data || {});
        }
      } catch {
        // ignore malformed socket payload
      }
    };

    socket.onerror = (event) => {
      handlers.onError?.(event);
    };

    socket.onclose = () => {
      clearHeartbeat();
      if (manuallyClosed) {
        handlers.onStatusChange?.('closed');
        return;
      }
      scheduleReconnect();
    };
  };

  createSocket();

  return () => {
    manuallyClosed = true;
    clearReconnect();
    clearHeartbeat();
    handlers.onStatusChange?.('closed');
    try {
      socket?.close();
    } catch {
      // ignore close errors
    }
  };
}
