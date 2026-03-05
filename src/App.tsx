import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, User, Film, Sparkles, Plus, Mic, Image as ImageIcon, UserPlus, Calendar } from 'lucide-react';

import { HomeView } from './components/home/HomeView';
import { ProfileView } from './components/profile/ProfileView';
import { FamilyTreeView } from './components/family/FamilyTreeView';
import { CinemaView } from './components/discovery/CinemaView';
import { CoCreationView } from './components/cocreation/CoCreationView';
import { TraceView } from './components/discovery/TraceView';

import { CreateMemoryView } from './components/actions/CreateMemoryView';
import { VoiceRecorderView } from './components/actions/VoiceRecorderView';
import { InviteMemberView } from './components/actions/InviteMemberView';
import { CreateEventView } from './components/actions/CreateEventView';
import { LoginView } from './components/auth/LoginView';
import {
  clearSession,
  getMoments,
  getNotifications,
  loadSession,
  subscribeRealtime,
  type Session,
} from './lib/api';
import { bootstrapPushNotifications } from './lib/native/capabilities';
import { trackEvent } from './lib/telemetry';

const ActionSheet = ({ isOpen, onClose, onSelect }: { isOpen: boolean; onClose: () => void; onSelect: (action: string) => void }) => {
  const actions = [
    { id: 'memory', label: '发布动态', icon: ImageIcon, desc: '上传照片/视频' },
    { id: 'voice', label: '录制口述', icon: Mic, desc: '采访长辈语音' },
    { id: 'invite', label: '邀请亲友', icon: UserPlus, desc: '共修家谱' },
    { id: 'event', label: '新建纪念日', icon: Calendar, desc: '农历生日/忌日' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-[100px] left-6 right-6 z-[90]"
          >
            <div className="grid grid-cols-2 gap-3 mb-4">
              {actions.map((action, i) => (
                <motion.button
                  key={action.id}
                  onClick={() => onSelect(action.id)}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#F9F9F7] p-4 rounded-[16px] flex flex-col items-center gap-2 active:scale-95 transition-transform shadow-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1D1D1F] text-[#F9F9F7] flex items-center justify-center mb-1">
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[14px] font-bold text-[#1D1D1F] font-serif">{action.label}</span>
                  <span className="text-[10px] text-[#8E8E93]">{action.desc}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const TabBar = ({ activeTab, onTabChange, onAdd, isAddOpen }: { activeTab: string; onTabChange: (t: string) => void; onAdd: () => void; isAddOpen: boolean }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-[84px] z-40 pb-safe">
      <div className="absolute inset-0 bg-[#F9F9F7]/95 backdrop-blur-xl border-t border-[#EBEBE6]" />
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[90px] h-[90px] -mt-[45px] pointer-events-none">
        <div className="w-full h-full rounded-full bg-transparent" />
      </div>
      <div className="relative flex items-start justify-around pt-4">
        <TabItem icon={Home} label="首页" active={activeTab === 'home'} onClick={() => onTabChange('home')} />
        <TabItem icon={Film} label="大观" active={activeTab === 'cinema'} onClick={() => onTabChange('cinema')} />

        <div className="relative -top-8">
          <button
            onClick={onAdd}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              isAddOpen
                ? 'bg-[#B93A32] rotate-45 shadow-[0_8px_24px_rgba(185,58,50,0.35)]'
                : 'bg-[#1D1D1F] shadow-[0_4px_16px_rgba(0,0,0,0.15)]'
            }`}
          >
            <Plus className="w-7 h-7 text-[#F9F9F7]" strokeWidth={2.5} />
          </button>
        </div>

        <TabItem icon={Sparkles} label="共创" active={activeTab === 'cocreate'} onClick={() => onTabChange('cocreate')} />
        <TabItem icon={User} label="我的" active={activeTab === 'profile'} onClick={() => onTabChange('profile')} />
      </div>
    </div>
  );
};

const TabItem = ({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick?: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 w-16 transition-colors ${active ? 'text-[#1D1D1F]' : 'text-[#8E8E93]'}`}>
    <Icon className="w-6 h-6" strokeWidth={active ? 2 : 1.5} />
    <span className="text-[10px] font-medium tracking-widest font-serif">{label}</span>
    {active && <motion.div layoutId="tab-indicator" className="w-1 h-1 rounded-full bg-[#B93A32] mt-1" />}
  </button>
);

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [activeTab, setActiveTab] = useState('home');
  const [showFamilyTree, setShowFamilyTree] = useState(false);
  const [showTraceView, setShowTraceView] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [moments, setMoments] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const token = session?.token || '';

  const refreshMoments = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getMoments(token);
      setMoments(data.moments || []);
    } catch (error) {
      console.error(error);
    }
  }, [token]);

  const refreshUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getNotifications(token);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error(error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    refreshMoments();
    refreshUnreadCount();
  }, [token, refreshMoments, refreshUnreadCount]);

  useEffect(() => {
    if (!token) return;
    bootstrapPushNotifications();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const unsubscribe = subscribeRealtime(
      token,
      (event) => {
        if (event.type === 'moment-updated') {
          const incoming = event.data?.moment;
          if (incoming?.id) {
            setMoments((prev) => {
              const next = [incoming, ...prev.filter((item) => item.id !== incoming.id)];
              return next;
            });
          } else {
            refreshMoments();
          }
          return;
        }
        if (event.type === 'notification-updated') {
          if (typeof event.data?.unreadCount === 'number') {
            setUnreadCount(event.data.unreadCount);
          } else {
            refreshUnreadCount();
          }
        }
      },
      () => {
        // SSE 会自动重连，这里保持静默避免噪音
      },
    );
    return unsubscribe;
  }, [token, refreshMoments, refreshUnreadCount]);

  if (!session) {
    return <LoginView onSuccess={(nextSession) => setSession(nextSession)} />;
  }

  const handleHomeNavigate = (route: string) => {
    if (route === 'tree') {
      setShowFamilyTree(true);
    } else if (route === 'trace' || route === 'search') {
      setShowTraceView(true);
    } else if (['record', 'upload', 'invite'].includes(route)) {
      if (route === 'record') setActiveAction('voice');
      if (route === 'upload') setActiveAction('memory');
      if (route === 'invite') setActiveAction('invite');
    }
  };

  const handleActionSelect = (actionId: string) => {
    setShowAddMenu(false);
    setTimeout(() => setActiveAction(actionId), 200);
  };

  const handlePublished = async () => {
    await Promise.all([refreshMoments(), refreshUnreadCount()]);
    trackEvent('moment.publish.completed');
  };

  const handleLogout = () => {
    trackEvent('session.logout');
    clearSession();
    setSession(null);
    setMoments([]);
    setUnreadCount(0);
    setActiveTab('home');
  };

  return (
    <div className="bg-[#F9F9F7] h-screen w-full overflow-hidden text-[#1D1D1F] font-sans antialiased selection:bg-[#B93A32] selection:text-white">
      <div className="h-full overflow-y-auto no-scrollbar">
        {activeTab === 'home' && <HomeView onNavigate={handleHomeNavigate} moments={moments} />}
        {activeTab === 'cinema' && <CinemaView />}
        {activeTab === 'cocreate' && <CoCreationView />}
        {activeTab === 'profile' && (
          <ProfileView
            token={token}
            currentUser={session.user}
            unreadCount={unreadCount}
            onNotificationsChanged={setUnreadCount}
            onLogout={handleLogout}
          />
        )}
      </div>

      <AnimatePresence>
        {showFamilyTree && <FamilyTreeView token={token} onBack={() => setShowFamilyTree(false)} />}
        {showTraceView && <TraceView onBack={() => setShowTraceView(false)} />}
        {activeAction === 'memory' && (
          <CreateMemoryView
            token={token}
            onClose={() => setActiveAction(null)}
            onPublished={async () => {
              await handlePublished();
              setActiveAction(null);
            }}
          />
        )}
        {activeAction === 'voice' && (
          <VoiceRecorderView
            token={token}
            onClose={() => setActiveAction(null)}
            onPublished={async () => {
              await handlePublished();
              setActiveAction(null);
            }}
          />
        )}
        {activeAction === 'invite' && <InviteMemberView onClose={() => setActiveAction(null)} />}
        {activeAction === 'event' && <CreateEventView onClose={() => setActiveAction(null)} />}
      </AnimatePresence>

      <ActionSheet isOpen={showAddMenu} onClose={() => setShowAddMenu(false)} onSelect={handleActionSelect} />

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} onAdd={() => setShowAddMenu(!showAddMenu)} isAddOpen={showAddMenu} />
    </div>
  );
}
