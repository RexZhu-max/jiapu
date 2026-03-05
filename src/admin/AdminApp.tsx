import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, ShieldCheck, Users, FileText, Bell, BarChart3, LogOut } from 'lucide-react';
import {
  adminLogin,
  clearAdminSession,
  createAdminNotice,
  getAdminFamilies,
  getAdminLogs,
  getAdminMoments,
  getAdminNotices,
  getAdminOverview,
  getAdminUsers,
  loadAdminSession,
  saveAdminSession,
  setAdminUserStatus,
  reviewAdminMoment,
  type AdminOverviewStats,
  type AdminSession,
} from '../lib/adminApi';

type AdminTab = 'dashboard' | 'users' | 'moments' | 'notices' | 'logs';
type Permission =
  | 'admin.overview'
  | 'admin.users.read'
  | 'admin.users.manage'
  | 'admin.families.read'
  | 'admin.moments.read'
  | 'admin.moments.review'
  | 'admin.notices.read'
  | 'admin.notices.manage'
  | 'admin.logs.read';

const ROLE_LABEL: Record<string, string> = {
  super_admin: '超管',
  operator: '运营',
  reviewer: '审核',
};

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    'admin.overview',
    'admin.users.read',
    'admin.users.manage',
    'admin.families.read',
    'admin.moments.read',
    'admin.moments.review',
    'admin.notices.read',
    'admin.notices.manage',
    'admin.logs.read',
  ],
  operator: [
    'admin.overview',
    'admin.users.read',
    'admin.families.read',
    'admin.moments.read',
    'admin.notices.read',
    'admin.notices.manage',
  ],
  reviewer: ['admin.overview', 'admin.families.read', 'admin.moments.read', 'admin.moments.review', 'admin.notices.read'],
};

const REVIEW_TEMPLATES = [
  '经审核不符合社区规范，已下架。',
  '内容存在敏感信息，请修改后重新发布。',
  '内容与家族主题无关，暂不通过。',
  '图片质量过低或信息缺失，请补充后再发。',
];

const defaultStats: AdminOverviewStats = {
  totalUsers: 0,
  bannedUsers: 0,
  totalFamilies: 0,
  totalMoments: 0,
  pendingMoments: 0,
  rejectedMoments: 0,
  totalNotifications: 0,
  todayPosts: 0,
};

function StatCard({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4">
      <p className="text-[12px] text-[#6B7280]">{title}</p>
      <p className="mt-2 text-[28px] font-bold text-[#111827]">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-[#9CA3AF]">{hint}</p> : null}
    </div>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: (session: AdminSession) => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const session = await adminLogin(username.trim(), password.trim());
      saveAdminSession(session);
      onSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-[420px] rounded-[16px] border border-[#E5E7EB] bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#111827] text-white flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#111827]">管理后台</h1>
            <p className="text-[12px] text-[#6B7280]">林氏春秋 Admin Console</p>
          </div>
        </div>

        <label className="block text-[12px] text-[#6B7280] mb-2">管理员账号</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full h-11 rounded-[10px] border border-[#D1D5DB] px-3 outline-none focus:border-[#111827]"
        />

        <label className="block text-[12px] text-[#6B7280] mt-4 mb-2">密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-11 rounded-[10px] border border-[#D1D5DB] px-3 outline-none focus:border-[#111827]"
        />

        <div className="mt-3 text-[11px] text-[#6B7280] leading-relaxed">
          <p>超管：admin / admin123</p>
          <p>运营：operator / operator123</p>
          <p>审核：reviewer / reviewer123</p>
        </div>

        {error ? <p className="mt-3 text-[12px] text-[#B91C1C]">{error}</p> : null}

        <button
          disabled={loading}
          className="mt-5 w-full h-11 rounded-[10px] bg-[#111827] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? '登录中...' : '登录后台'}
        </button>
      </form>
    </div>
  );
}

export default function AdminApp() {
  const [session, setSession] = useState<AdminSession | null>(() => loadAdminSession());
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [stats, setStats] = useState<AdminOverviewStats>(defaultStats);
  const [users, setUsers] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [moments, setMoments] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [momentStatus, setMomentStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const [reviewTemplate, setReviewTemplate] = useState(REVIEW_TEMPLATES[0]);
  const [reviewCustomRemark, setReviewCustomRemark] = useState('');

  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePublishAt, setNoticePublishAt] = useState('');
  const [savingNotice, setSavingNotice] = useState(false);

  const token = session?.token || '';
  const role = session?.admin.role || 'reviewer';

  const permissionSet = useMemo(() => new Set(ROLE_PERMISSIONS[role] || []), [role]);
  const can = useCallback((permission: Permission) => permissionSet.has(permission), [permissionSet]);

  const availableTabs = useMemo(() => {
    const result: AdminTab[] = [];
    if (can('admin.overview')) result.push('dashboard');
    if (can('admin.users.read')) result.push('users');
    if (can('admin.moments.read')) result.push('moments');
    if (can('admin.notices.read')) result.push('notices');
    if (can('admin.logs.read')) result.push('logs');
    return result;
  }, [can]);

  useEffect(() => {
    if (availableTabs.length === 0) return;
    if (!availableTabs.includes(tab)) {
      setTab(availableTabs[0]);
    }
  }, [availableTabs, tab]);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [overview, userData, familyData, momentData, noticeData, logData] = await Promise.all([
        can('admin.overview') ? getAdminOverview(token) : Promise.resolve({ stats: defaultStats }),
        can('admin.users.read') ? getAdminUsers(token) : Promise.resolve({ users: [] }),
        can('admin.families.read') ? getAdminFamilies(token) : Promise.resolve({ families: [] }),
        can('admin.moments.read') ? getAdminMoments(token, momentStatus) : Promise.resolve({ moments: [] }),
        can('admin.notices.read') ? getAdminNotices(token) : Promise.resolve({ notices: [] }),
        can('admin.logs.read') ? getAdminLogs(token) : Promise.resolve({ logs: [] }),
      ]);

      setStats(overview.stats || defaultStats);
      setUsers(userData.users || []);
      setFamilies(familyData.families || []);
      setMoments(momentData.moments || []);
      setNotices(noticeData.notices || []);
      setLogs(logData.logs || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载失败';
      setError(message);
      if (message.includes('登录')) {
        clearAdminSession();
        setSession(null);
      }
    } finally {
      setLoading(false);
    }
  }, [can, momentStatus, token]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleLogout = () => {
    clearAdminSession();
    setSession(null);
  };

  const handleToggleUser = async (userId: string, isBanned: boolean) => {
    if (!token || !can('admin.users.manage')) return;
    await setAdminUserStatus(token, userId, !isBanned);
    reload();
  };

  const handleReviewMoment = async (momentId: string, status: 'approved' | 'rejected') => {
    if (!token || !can('admin.moments.review')) return;
    const rejectRemark = reviewCustomRemark.trim() || reviewTemplate;
    const reviewRemark = status === 'rejected' ? rejectRemark : '审核通过';
    await reviewAdminMoment(token, momentId, { status, reviewRemark });
    reload();
  };

  const handleCreateNotice = async () => {
    if (!token || !can('admin.notices.manage') || !noticeTitle.trim() || !noticeContent.trim()) return;
    setSavingNotice(true);
    try {
      await createAdminNotice(token, noticeTitle.trim(), noticeContent.trim(), noticePublishAt.trim());
      setNoticeTitle('');
      setNoticeContent('');
      setNoticePublishAt('');
      reload();
    } finally {
      setSavingNotice(false);
    }
  };

  const tabButton = (key: AdminTab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setTab(key)}
      className={`px-3 h-9 rounded-[8px] text-[13px] font-medium flex items-center gap-1.5 ${
        tab === key ? 'bg-[#111827] text-white' : 'bg-white text-[#374151] border border-[#E5E7EB]'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const pendingCount = useMemo(() => moments.filter((item) => item.moderationStatus === 'pending').length, [moments]);

  if (!session) {
    return <AdminLogin onSuccess={setSession} />;
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111827]">
      <header className="h-14 px-6 border-b border-[#E5E7EB] bg-white flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold">林氏春秋 · 管理后台</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#6B7280]">{session.admin.name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#3730A3]">{ROLE_LABEL[session.admin.role] || session.admin.role}</span>
          <button onClick={handleLogout} className="h-8 px-3 rounded-[8px] border border-[#E5E7EB] text-[12px] flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" />
            退出
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {availableTabs.includes('dashboard') ? tabButton('dashboard', '总览', <BarChart3 className="w-4 h-4" />) : null}
          {availableTabs.includes('users') ? tabButton('users', '用户', <Users className="w-4 h-4" />) : null}
          {availableTabs.includes('moments')
            ? tabButton('moments', `审核${pendingCount > 0 ? `(${pendingCount})` : ''}`, <FileText className="w-4 h-4" />)
            : null}
          {availableTabs.includes('notices') ? tabButton('notices', '公告', <Bell className="w-4 h-4" />) : null}
          {availableTabs.includes('logs') ? tabButton('logs', '审计日志', <ShieldCheck className="w-4 h-4" />) : null}

          <button onClick={reload} className="ml-auto h-9 px-3 rounded-[8px] bg-white border border-[#E5E7EB] text-[12px]">
            刷新
          </button>
        </div>

        {error ? <p className="mb-3 text-[12px] text-[#B91C1C]">{error}</p> : null}
        {loading ? (
          <div className="mb-3 text-[12px] text-[#6B7280] flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            数据加载中...
          </div>
        ) : null}

        {tab === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <StatCard title="总用户" value={stats.totalUsers} hint={`封禁 ${stats.bannedUsers}`} />
              <StatCard title="家族空间" value={stats.totalFamilies} hint={`今日发帖 ${stats.todayPosts}`} />
              <StatCard title="动态总量" value={stats.totalMoments} hint={`待审核 ${stats.pendingMoments}`} />
              <StatCard title="通知总量" value={stats.totalNotifications} hint={`已拒绝 ${stats.rejectedMoments}`} />
            </div>

            <div className="mt-4 rounded-[12px] border border-[#E5E7EB] bg-white p-4">
              <h3 className="text-[14px] font-bold mb-3">家族空间概览</h3>
              <div className="overflow-auto">
                <table className="min-w-full text-[12px]">
                  <thead>
                    <tr className="text-left text-[#6B7280] border-b border-[#F3F4F6]">
                      <th className="py-2 pr-3">家族</th>
                      <th className="py-2 pr-3">用户数</th>
                      <th className="py-2 pr-3">成员数</th>
                      <th className="py-2 pr-3">动态数</th>
                      <th className="py-2 pr-3">未读通知</th>
                    </tr>
                  </thead>
                  <tbody>
                    {families.map((item) => (
                      <tr key={item.id} className="border-b border-[#F9FAFB]">
                        <td className="py-2 pr-3">{item.name}</td>
                        <td className="py-2 pr-3">{item.userCount}</td>
                        <td className="py-2 pr-3">{item.memberCount}</td>
                        <td className="py-2 pr-3">{item.momentCount}</td>
                        <td className="py-2 pr-3">{item.unreadNotifications}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}

        {tab === 'users' ? (
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 overflow-auto">
            <table className="min-w-full text-[12px]">
              <thead>
                <tr className="text-left text-[#6B7280] border-b border-[#F3F4F6]">
                  <th className="py-2 pr-3">用户</th>
                  <th className="py-2 pr-3">手机号</th>
                  <th className="py-2 pr-3">家族</th>
                  <th className="py-2 pr-3">动态</th>
                  <th className="py-2 pr-3">状态</th>
                  <th className="py-2 pr-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="border-b border-[#F9FAFB]">
                    <td className="py-2 pr-3">{item.name}</td>
                    <td className="py-2 pr-3">{item.phone}</td>
                    <td className="py-2 pr-3">{item.familyName}</td>
                    <td className="py-2 pr-3">{item.postCount}</td>
                    <td className="py-2 pr-3">{item.isBanned ? '已封禁' : '正常'}</td>
                    <td className="py-2 pr-3">
                      {can('admin.users.manage') ? (
                        <button
                          onClick={() => handleToggleUser(item.id, item.isBanned)}
                          className={`h-7 px-2 rounded-[6px] text-white ${item.isBanned ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
                        >
                          {item.isBanned ? '解封' : '封禁'}
                        </button>
                      ) : (
                        <span className="text-[#9CA3AF]">无权限</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === 'moments' ? (
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setMomentStatus(item)}
                  className={`h-8 px-3 rounded-[8px] text-[12px] ${momentStatus === item ? 'bg-[#111827] text-white' : 'bg-[#F9FAFB]'}`}
                >
                  {item === 'all' ? '全部' : item === 'pending' ? '待审核' : item === 'approved' ? '已通过' : '已拒绝'}
                </button>
              ))}
            </div>

            {can('admin.moments.review') ? (
              <div className="mb-3 p-3 rounded-[10px] border border-[#F3F4F6] bg-[#FAFAFA]">
                <p className="text-[12px] text-[#6B7280] mb-2">审核备注模板</p>
                <select
                  value={reviewTemplate}
                  onChange={(e) => setReviewTemplate(e.target.value)}
                  className="w-full h-9 px-2 rounded-[8px] border border-[#D1D5DB] text-[12px]"
                >
                  {REVIEW_TEMPLATES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <input
                  value={reviewCustomRemark}
                  onChange={(e) => setReviewCustomRemark(e.target.value)}
                  placeholder="自定义备注（可选，优先于模板）"
                  className="mt-2 w-full h-9 px-2 rounded-[8px] border border-[#D1D5DB] text-[12px]"
                />
              </div>
            ) : null}

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {moments.map((item) => (
                <div key={item.id} className="border border-[#F3F4F6] rounded-[10px] p-3">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold truncate">{item.userName} · {item.familyName}</p>
                      <p className="text-[12px] text-[#6B7280] mt-1 line-clamp-2">{item.content || '（无文字内容）'}</p>
                      <p className="text-[11px] text-[#9CA3AF] mt-1">{item.createdAt} · 图片 {item.imageCount} · 审核状态 {item.moderationStatus}</p>
                      {item.reviewRemark ? <p className="text-[11px] text-[#6B7280] mt-1">备注：{item.reviewRemark}</p> : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {can('admin.moments.review') ? (
                        <>
                          <button onClick={() => handleReviewMoment(item.id, 'approved')} className="h-8 px-2 rounded-[6px] bg-[#10B981] text-white text-[12px]">通过</button>
                          <button onClick={() => handleReviewMoment(item.id, 'rejected')} className="h-8 px-2 rounded-[6px] bg-[#EF4444] text-white text-[12px]">拒绝</button>
                        </>
                      ) : (
                        <span className="text-[12px] text-[#9CA3AF]">仅查看</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {moments.length === 0 ? <p className="text-[12px] text-[#9CA3AF]">暂无数据</p> : null}
            </div>
          </div>
        ) : null}

        {tab === 'notices' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4">
              <h3 className="text-[14px] font-bold mb-3">发布系统公告</h3>
              {can('admin.notices.manage') ? (
                <>
                  <input
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="公告标题"
                    className="w-full h-10 px-3 rounded-[8px] border border-[#D1D5DB] mb-2"
                  />
                  <textarea
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    placeholder="公告内容"
                    className="w-full h-28 px-3 py-2 rounded-[8px] border border-[#D1D5DB]"
                  />
                  <label className="block mt-2 text-[12px] text-[#6B7280]">定时发布时间（留空=立即发布）</label>
                  <input
                    type="datetime-local"
                    value={noticePublishAt}
                    onChange={(e) => setNoticePublishAt(e.target.value)}
                    className="w-full h-10 px-3 rounded-[8px] border border-[#D1D5DB] mt-1"
                  />
                  <button
                    onClick={handleCreateNotice}
                    disabled={savingNotice || !noticeTitle.trim() || !noticeContent.trim()}
                    className="mt-3 h-10 px-4 rounded-[8px] bg-[#111827] text-white disabled:opacity-50"
                  >
                    {savingNotice ? '提交中...' : noticePublishAt ? '定时发布' : '立即发布'}
                  </button>
                </>
              ) : (
                <p className="text-[12px] text-[#9CA3AF]">当前角色仅可查看公告，无发布权限。</p>
              )}
            </div>

            <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4">
              <h3 className="text-[14px] font-bold mb-3">公告记录</h3>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {notices.map((item) => (
                  <div key={item.id} className="border border-[#F3F4F6] rounded-[8px] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold truncate">{item.title}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.status === 'scheduled' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#DCFCE7] text-[#166534]'}`}>
                        {item.status === 'scheduled' ? '待发布' : '已发布'}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#6B7280] mt-1 line-clamp-2">{item.content}</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-1">发布计划：{item.publishAt || '-'} · 创建：{item.createdBy}</p>
                  </div>
                ))}
                {notices.length === 0 ? <p className="text-[12px] text-[#9CA3AF]">暂无公告</p> : null}
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'logs' ? (
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 overflow-auto">
            <table className="min-w-full text-[12px]">
              <thead>
                <tr className="text-left text-[#6B7280] border-b border-[#F3F4F6]">
                  <th className="py-2 pr-3">时间</th>
                  <th className="py-2 pr-3">管理员</th>
                  <th className="py-2 pr-3">动作</th>
                  <th className="py-2 pr-3">对象</th>
                  <th className="py-2 pr-3">详情</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item.id} className="border-b border-[#F9FAFB]">
                    <td className="py-2 pr-3">{item.createdAt}</td>
                    <td className="py-2 pr-3">{item.adminName}</td>
                    <td className="py-2 pr-3">{item.action}</td>
                    <td className="py-2 pr-3">{item.targetType}:{item.targetId}</td>
                    <td className="py-2 pr-3">{item.detail || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </main>
    </div>
  );
}
