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

const SESSION_KEY = 'heritage.session';

async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, { ...options, headers });
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
    xhr.open('POST', path, true);
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
  const streamUrl = `/api/stream?token=${encodeURIComponent(token)}`;
  const source = new EventSource(streamUrl);

  const bind = (eventName: RealtimeEventName) => {
    source.addEventListener(eventName, (event) => {
      try {
        const message = event as MessageEvent;
        const data = message.data ? JSON.parse(message.data) : {};
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
  return apiFetch<Session>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
}

export async function getMe(token: string) {
  return apiFetch<{ user: SessionUser }>('/api/auth/me', {}, token);
}

export async function getMoments(token: string) {
  return apiFetch<{ moments: any[] }>('/api/moments', {}, token);
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
  return apiFetch<{ moment: any }>('/api/moments', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
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

  return withRetry(
    () => uploadByXHR<{ id: string; url: string; type: string }>('/api/media/upload', body, token, onProgress, signal),
    retries,
  );
}

export async function getNotifications(token: string) {
  return apiFetch<{ notifications: any[]; unreadCount: number }>('/api/notifications', {}, token);
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
  return apiFetch<{ generations: any[] }>('/api/family/tree', {}, token);
}

export async function createGeneration(
  token: string,
  payload: { title: string; description?: string; position?: 'before' | 'after' },
) {
  return apiFetch<{ generations: any[] }>('/api/family/generations', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function createMember(token: string, payload: any) {
  return apiFetch<{ generations: any[] }>('/api/family/members', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function updateMember(token: string, memberId: string, payload: any) {
  return apiFetch<{ generations: any[] }>(`/api/family/members/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}
