import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Cloud, Settings, LogOut, ChevronRight, 
  Crown, Sparkles, Database, Users, Gem, 
  CheckCircle2, X, Shield, PenTool, Eye,
  UserCog, Network, CreditCard, Share2, QrCode,
  MessageCircle
} from 'lucide-react';
import { getChatConversations, type SessionUser } from '../../lib/api';

// --- Constants & Types ---

const MEMBERSHIP_TIERS = [
  {
    id: 'free',
    name: '青云版',
    price: '免费',
    desc: '适合初创家谱',
    limits: { nodes: 30, storage: '500MB' },
    features: ['基础谱系记录', '普通画质存储', '仅限3位协作者'],
    bgGradient: 'bg-gradient-to-br from-[#E5E5EA] to-[#D1D1D6]',
    textColor: '#1D1D1F'
  },
  {
    id: 'pro',
    name: '文修版',
    price: '¥98 / 年',
    desc: '适合大多数家庭',
    limits: { nodes: 100, storage: '20GB' },
    features: ['高清影像存储', '老照片AI修复', '智能时间轴生成', '导出电子家谱'],
    bgGradient: 'bg-gradient-to-br from-[#B93A32] to-[#8E2219]',
    textColor: '#F9F9F7'
  },
  {
    id: 'ultra',
    name: '世家版',
    price: '¥298 / 年',
    desc: '尊享家族传承服务',
    limits: { nodes: 'Unlimited', storage: '1TB' },
    features: ['无限谱系节点', '4K 纪录片制作', '纸质家书排版', '1对1 顾问服务'],
    bgGradient: 'bg-gradient-to-br from-[#1D1D1F] to-[#434343]',
    textColor: '#C5A059'
  }
];

// --- Sub-Components ---

const SplitBillModal = ({ tier, onClose }: { tier: any, onClose: () => void }) => {
   const [step, setStep] = useState(1);
   const [contributors, setContributors] = useState([
      { name: '我', amount: 98, locked: true },
      { name: '林建国 (父)', amount: 100, locked: false },
      { name: '林晓 (堂姐)', amount: 100, locked: false },
   ]);

   const total = parseInt(tier.price.replace(/\D/g, ''));
   const perPerson = Math.ceil(total / contributors.length);

   return (
      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         className="fixed inset-0 z-[80] bg-[#F9F9F7] flex flex-col"
      >
         <div className="px-6 pt-14 pb-4 bg-white border-b border-[#EBEBE6] flex items-center justify-between">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-black/5">
               <ChevronRight className="w-6 h-6 rotate-180 text-[#8E8E93]" />
            </button>
            <h2 className="text-[17px] font-bold font-serif text-[#1D1D1F]">子女分摊支付</h2>
            <div className="w-8" />
         </div>

         <div className="flex-1 p-6">
            <div className="bg-white p-6 rounded-[12px] border border-[#EBEBE6] text-center mb-8 shadow-sm">
               <p className="text-[12px] text-[#8E8E93] mb-2">订阅 {tier.name}</p>
               <h3 className="text-[32px] font-bold font-serif text-[#B93A32] mb-1">¥{total}</h3>
               <p className="text-[12px] text-[#1D1D1F]">家族众筹 · 共同承担</p>
            </div>

            <div className="space-y-4 mb-8">
               <h4 className="text-[14px] font-bold text-[#1D1D1F] font-serif">分摊成员</h4>
               {contributors.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white border border-[#EBEBE6] rounded-[8px]">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#1D1D1F] font-bold text-[12px]">
                           {c.name[0]}
                        </div>
                        <span className="text-[14px] font-medium text-[#1D1D1F]">{c.name}</span>
                     </div>
                     <span className="text-[14px] font-bold text-[#1D1D1F]">¥{perPerson}</span>
                  </div>
               ))}
               <button className="w-full py-3 border border-dashed border-[#C7C7CC] text-[#8E8E93] rounded-[8px] text-[13px] font-medium">
                  + 添加更多家人
               </button>
            </div>
         </div>

         <div className="p-6 bg-white border-t border-[#EBEBE6]">
            <button className="w-full py-3 bg-[#07C160] text-white rounded-[4px] font-bold flex items-center justify-center gap-2 mb-3">
               <MessageCircle className="w-5 h-5" /> 发送分摊邀请
            </button>
            <button className="w-full py-3 bg-[#1D1D1F] text-white rounded-[4px] font-bold flex items-center justify-center gap-2">
               <QrCode className="w-5 h-5" /> 生成支付码
            </button>
         </div>
      </motion.div>
   );
};

const UpgradeModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [showSplit, setShowSplit] = useState(false);

  if (showSplit && selectedTier) {
     return <SplitBillModal tier={selectedTier} onClose={() => setShowSplit(false)} />;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-[#F9F9F7] rounded-t-[24px] z-[70] flex flex-col max-h-[90vh]"
          >
             <div className="p-6 pb-2 flex justify-between items-center">
                <div>
                   <h2 className="text-[20px] font-bold font-serif text-[#1D1D1F]">升级会员权益</h2>
                   <p className="text-[12px] text-[#8E8E93] mt-1">解锁更多功能，永久保存家族记忆</p>
                </div>
                <button onClick={onClose} className="p-2 bg-[#E5E5EA] rounded-full">
                   <X className="w-5 h-5 text-[#1D1D1F]" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
                {MEMBERSHIP_TIERS.filter(t => t.id !== 'free').map(tier => (
                   <div key={tier.id} className="relative overflow-hidden rounded-[12px] border border-[#EBEBE6] bg-white p-5 shadow-sm">
                      {tier.id === 'pro' && (
                         <div className="absolute top-0 right-0 bg-[#B93A32] text-white text-[10px] px-3 py-1 rounded-bl-[8px] font-bold">
                            RECOMMENDED
                         </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <h3 className="text-[18px] font-bold font-serif text-[#1D1D1F]">{tier.name}</h3>
                            <p className="text-[12px] text-[#8E8E93]">{tier.desc}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[18px] font-bold text-[#B93A32]">{tier.price.split(' ')[0]}</p>
                            <p className="text-[10px] text-[#8E8E93] line-through">原价 ¥{tier.id === 'pro' ? '198' : '598'}</p>
                         </div>
                      </div>

                      <div className="space-y-2 mb-5">
                         {tier.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-2 text-[13px] text-[#555]">
                               <CheckCircle2 className={`w-4 h-4 ${tier.id === 'ultra' ? 'text-[#C5A059]' : 'text-[#B93A32]'}`} />
                               <span>{feat}</span>
                            </div>
                         ))}
                      </div>

                      <div className="flex gap-2">
                         <button className={`flex-1 py-3 rounded-[4px] text-[13px] font-bold transition-colors ${
                            tier.id === 'ultra' ? 'bg-[#1D1D1F] text-[#C5A059]' : 'bg-[#B93A32] text-white'
                         }`}>
                            立即支付
                         </button>
                         <button 
                            onClick={() => { setSelectedTier(tier); setShowSplit(true); }}
                            className="px-4 py-3 border border-[#EBEBE6] bg-[#F9F9F7] text-[#1D1D1F] rounded-[4px] font-bold text-[13px] flex items-center gap-1"
                         >
                            <Users className="w-4 h-4" /> 子女分摊
                         </button>
                      </div>
                   </div>
                ))}
             </div>
             
             <div className="p-4 bg-white border-t border-[#EBEBE6] text-center pb-8">
                 <p className="text-[10px] text-[#8E8E93]">
                   订阅自动续费，可随时取消。<a href="#" className="underline">服务条款</a>
                </p>
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const UsageBar = ({ label, current, max, unit }: { label: string, current: number, max: number, unit?: string }) => {
  const percent = Math.min((current / max) * 100, 100);
  const isWarning = percent > 80;
  
  return (
    <div className="mb-4">
       <div className="flex justify-between items-end mb-1.5">
          <span className="text-[12px] font-medium text-[#1D1D1F] font-serif">{label}</span>
          <span className="text-[10px] text-[#8E8E93]">
             <span className={`${isWarning ? 'text-[#B93A32] font-bold' : 'text-[#1D1D1F]'}`}>{current}</span> 
             / {max} {unit}
          </span>
       </div>
       <div className="h-1.5 w-full bg-[#E5E5EA] rounded-full overflow-hidden">
          <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${percent}%` }}
             transition={{ duration: 1, ease: "easeOut" }}
             className={`h-full rounded-full ${isWarning ? 'bg-[#B93A32]' : 'bg-[#1D1D1F]'}`}
          />
       </div>
       {isWarning && (
         <p className="text-[10px] text-[#B93A32] mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            即将达到上限，建议升级权益
         </p>
       )}
    </div>
  );
};

const MembershipCard = ({ tier, isCurrent, onClick }: { tier: any, isCurrent: boolean, onClick: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className={`relative w-[280px] h-[160px] shrink-0 rounded-[12px] p-5 flex flex-col justify-between overflow-hidden shadow-lg cursor-pointer transition-transform hover:scale-[1.02] ${tier.bgGradient}`}
    >
       <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
       
       <div className="relative z-10 flex justify-between items-start">
          <div>
             <h3 className={`text-[20px] font-bold font-serif flex items-center gap-2`} style={{ color: tier.textColor }}>
                {tier.name}
                {isCurrent && <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded-[2px] backdrop-blur-sm">当前</span>}
             </h3>
             <p className="text-[11px] opacity-80 mt-1" style={{ color: tier.textColor }}>{tier.desc}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
             {tier.id === 'ultra' ? <Crown className="w-4 h-4" style={{ color: tier.textColor }} /> : <Gem className="w-4 h-4" style={{ color: tier.textColor }} />}
          </div>
       </div>

       <div className="relative z-10">
          <div className="flex items-end gap-1 mb-2">
             <span className="text-[24px] font-bold leading-none font-serif" style={{ color: tier.textColor }}>{tier.price}</span>
          </div>
          <div className="flex gap-3 text-[10px] opacity-80" style={{ color: tier.textColor }}>
             <span>谱系 {tier.limits.nodes === 'Unlimited' ? '无限' : tier.limits.nodes}</span>
             <span className="w-[1px] h-3 bg-current opacity-30 my-auto" />
             <span>存储 {tier.limits.storage}</span>
          </div>
       </div>
    </div>
  );
};

type MenuItemProps = {
  icon: any;
  label: string;
  value?: string;
  badge?: string;
  showArrow?: boolean;
  onClick?: () => void;
  color?: string;
};

const MenuItem = ({ icon: Icon, label, value, badge, showArrow = true, onClick, color }: MenuItemProps) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F9F9F7] active:bg-[#EBEBE6] transition-colors"
  >
    <div className="flex items-center flex-1">
     <div className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center mr-3 text-[#1D1D1F] mt-0.5">
        <Icon className="w-4 h-4" />
     </div>
     <div className="text-left flex-1">
        <span className="text-[14px] font-medium text-[#1D1D1F] font-serif">{label}</span>
        {value && <p className="text-[10px] text-[#8E8E93] mt-0.5">{value}</p>}
     </div>
    </div>
    {badge && (
       <span className="px-2 py-0.5 rounded-full bg-[#B93A32] text-white text-[10px] flex items-center justify-center mr-2">
         {badge}
       </span>
     )}
     {showArrow && <ChevronRight className="w-4 h-4 text-[#C7C7CC]" />}
  </button>
);

import { FamilyTreeView } from '../family/FamilyTreeView';
import { FamilySpaceManagementView } from './FamilySpaceManagementView';
import { NotificationView } from './NotificationView';
import { SettingsView } from './SettingsView';
import { ChatView } from './ChatView';

// --- Main Component ---

interface ProfileViewProps {
  token: string;
  currentUser: SessionUser;
  unreadCount: number;
  onNotificationsChanged?: (count: number) => void;
  onLogout: () => void;
}

export const ProfileView = ({ token, currentUser, unreadCount, onNotificationsChanged, onLogout }: ProfileViewProps) => {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showFamilyTree, setShowFamilyTree] = useState(false);
  const [showSpaceManagement, setShowSpaceManagement] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  
  const user = {
    name: currentUser.name,
    role: currentUser.role,
    avatar: currentUser.avatar,
    currentTier: 'free',
    stats: { nodes: 28, maxNodes: 30, storage: 0.3, maxStorage: 0.5 }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await getChatConversations(token);
        if (!cancelled) {
          setChatUnread(data.totalUnread || 0);
        }
      } catch {
        if (!cancelled) {
          setChatUnread(0);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <>
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      // Removed h-full and overflow-hidden to allow natural scrolling in parent container
      className="flex-1 bg-[#F9F9F7] pb-24"
    >
      {/* Header */}
      <div className="px-6 pt-14 pb-6 bg-[#F9F9F7]">
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <div className="relative w-16 h-16 rounded-full p-1 border border-[#EBEBE6] bg-white">
                  <img src={user.avatar} alt="Me" className="w-full h-full rounded-full object-cover grayscale-[0.1]" />
                  <div className="absolute -bottom-1 -right-1 bg-[#B93A32] text-white text-[9px] px-1.5 py-0.5 rounded-[4px] border border-white flex items-center gap-0.5 shadow-sm">
                     <Shield className="w-2 h-2 fill-white" />
                     主理人
                  </div>
               </div>
               <div>
                  <h2 className="text-[20px] font-bold text-[#1D1D1F] font-serif flex items-center gap-2">
                     {user.name}
                     <span className="text-[10px] font-normal text-[#8E8E93] border border-[#EBEBE6] px-1.5 py-0.5 rounded-[2px]">林氏家族</span>
                  </h2>
                  <p className="text-[12px] text-[#8E8E93] mt-1 font-serif flex items-center gap-1">
                    ID: 8829103 <span className="text-[10px] text-[#C5A059] bg-[#C5A059]/10 px-1 rounded">复制</span>
                  </p>
               </div>
            </div>
            <button 
               onClick={() => setShowSettings(true)}
               className="w-10 h-10 rounded-full border border-[#EBEBE6] flex items-center justify-center text-[#1D1D1F] bg-white"
            >
               <Settings className="w-5 h-5" />
            </button>
         </div>

         {/* Membership Cards Carousel */}
         <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
               <h3 className="text-[16px] font-bold text-[#1D1D1F] font-serif">会员权益</h3>
               <button 
                  onClick={() => setShowUpgrade(true)}
                  className="text-[12px] text-[#C5A059] flex items-center gap-1 font-medium"
               >
                  查看对比 <ChevronRight className="w-3 h-3" />
               </button>
            </div>
            
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
               {MEMBERSHIP_TIERS.map(tier => (
                  <div key={tier.id} className="snap-center">
                     <MembershipCard 
                        tier={tier} 
                        isCurrent={user.currentTier === tier.id} 
                        onClick={() => setShowUpgrade(true)}
                     />
                  </div>
               ))}
            </div>
         </div>

         {/* Usage Stats */}
         <div className="bg-white rounded-[12px] p-5 border border-[#EBEBE6] shadow-sm mb-6">
            <h3 className="text-[14px] font-bold text-[#1D1D1F] mb-4 flex items-center gap-2">
               <Database className="w-4 h-4 text-[#8E8E93]" />
               资源用量
            </h3>
            
            <div 
               onClick={() => setShowFamilyTree(true)}
               className="cursor-pointer hover:opacity-80 transition-opacity"
            >
               <UsageBar 
                  label="家族谱系节点" 
                  current={user.stats.nodes} 
                  max={user.stats.maxNodes} 
                  unit="人"
               />
            </div>
            <div className="h-[1px] bg-[#F5F5F7] my-4" />
            <UsageBar 
               label="云端存储空间" 
               current={user.stats.storage} 
               max={user.stats.maxStorage} 
               unit="GB"
            />
         </div>

         {/* Menu */}
         <div className="bg-white rounded-[12px] border border-[#EBEBE6] shadow-sm overflow-hidden">
            <MenuItem 
               icon={Network} 
               label="林氏谱系图" 
               value="查看完整家族树"
               onClick={() => setShowFamilyTree(true)}
            />
            <MenuItem 
               icon={UserCog} 
               label="家族空间管理"  
               value="核心节点 · 成员权限 · 移交主理"
               onClick={() => setShowSpaceManagement(true)}
            />
            <MenuItem 
               icon={Bell} 
               label="消息通知" 
               badge={unreadCount > 0 ? String(unreadCount) : undefined}
               onClick={() => setShowNotifications(true)}
            />
            <MenuItem
               icon={MessageCircle}
               label="家族消息"
               badge={chatUnread > 0 ? String(chatUnread) : undefined}
               value="会话消息 · 实时通信"
               onClick={() => setShowChat(true)}
            />
            <MenuItem 
               icon={Cloud} 
               label="数据备份" 
               value="上次同步：今天 09:30"
               onClick={() => setShowSettings(true)}
            />
            <MenuItem icon={LogOut} label="退出登录" onClick={onLogout} />
         </div>

         <div className="mt-8 text-center">
             <p className="text-[10px] text-[#C7C7CC] font-serif tracking-widest">Heritage v1.0.3 · Made with ♡ for Family</p>
         </div>
      </div>
    </motion.div>

    <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    <AnimatePresence>
       {showFamilyTree && <FamilyTreeView token={token} onBack={() => setShowFamilyTree(false)} />}
       {showSpaceManagement && <FamilySpaceManagementView onBack={() => setShowSpaceManagement(false)} />}
       {showNotifications && (
         <NotificationView
           token={token}
           onBack={() => setShowNotifications(false)}
           onUnreadChange={onNotificationsChanged}
         />
       )}
       {showChat && (
         <ChatView
           token={token}
           currentUserId={currentUser.id}
           onBack={() => setShowChat(false)}
           onUnreadChange={setChatUnread}
         />
       )}
       {showSettings && <SettingsView onBack={() => setShowSettings(false)} />}
    </AnimatePresence>
    </>
  );
};
