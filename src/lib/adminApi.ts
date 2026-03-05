import { withApiBase } from './native/capabilities';

const ADMIN_SESSION_KEY = 'heritage.admin.session';

export type AdminUser = {
  id: string;
  username: string;
  name: string;
  role: string;
};

export type AdminSession = {
  token: string;
  admin: AdminUser;
};

export type AdminOverviewStats = {
  totalUsers: number;
  bannedUsers: number;
  totalFamilies: number;
  totalMoments: number;
  pendingMoments: number;
  rejectedMoments: number;
  totalNotifications: number;
  todayPosts: number;
};

async function adminFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(withApiBase(path), {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = '请求失败';
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      // ignore json parse failures
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export function loadAdminSession() {
  const raw = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
}

export function saveAdminSession(session: AdminSession) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export async function adminLogin(username: string, password: string) {
  return adminFetch<AdminSession>('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function getAdminOverview(token: string) {
  return adminFetch<{ stats: AdminOverviewStats }>('/api/admin/overview', {}, token);
}

export async function getAdminUsers(token: string) {
  return adminFetch<{ users: any[] }>('/api/admin/users', {}, token);
}

export async function setAdminUserStatus(token: string, userId: string, isBanned: boolean) {
  return adminFetch<{ ok: boolean; userId: string; isBanned: boolean }>(`/api/admin/users/${userId}/status`, {
    method: 'POST',
    body: JSON.stringify({ isBanned }),
  }, token);
}

export async function getAdminFamilies(token: string) {
  return adminFetch<{ families: any[] }>('/api/admin/families', {}, token);
}

export async function getAdminMoments(token: string, status: 'all' | 'pending' | 'approved' | 'rejected' = 'all') {
  const query = new URLSearchParams({ status }).toString();
  return adminFetch<{ moments: any[] }>(`/api/admin/moments?${query}`, {}, token);
}

export async function reviewAdminMoment(
  token: string,
  momentId: string,
  payload: { status: 'approved' | 'rejected' | 'pending'; reviewRemark?: string },
) {
  return adminFetch<{ ok: boolean; momentId: string; status: string }>(`/api/admin/moments/${momentId}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function getAdminNotices(token: string) {
  return adminFetch<{ notices: any[] }>('/api/admin/notices', {}, token);
}

export async function createAdminNotice(token: string, title: string, content: string) {
  return adminFetch<{ notice: any }>('/api/admin/notices', {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  }, token);
}

export async function getAdminLogs(token: string) {
  return adminFetch<{ logs: any[] }>('/api/admin/logs', {}, token);
}
