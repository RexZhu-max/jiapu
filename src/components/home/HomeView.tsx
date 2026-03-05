import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, Image as ImageIcon, 
  Search, Bell, ChevronRight,
  Cloud, Settings, Users,
  BookOpen, Calendar, ArrowUpRight,
  Feather, Scroll, Camera, Lock,
  MessageCircle, Heart, PenTool,
  Clock, MapPin
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { MomentDetailView } from './MomentDetailView';

// --- Colors & Styles ---
const THEME = {
  paper: '#F2F0E9',
  ink: '#1A1A1A',
  cinnabar: '#A63628',
  gold: '#A89260',
  subtext: '#828282',
  line: '#E0DED5',
  cardBg: '#FFFFFF'
};

// --- Mock Data ---
const MOCK_MOMENTS = [
  {
    id: '1',
    user: { 
       name: '二伯', 
       relation: '长辈',
       avatar: 'https://images.unsplash.com/photo-1697144532799-c94b0344c1cb?auto=format&fit=crop&q=80&w=100'
    },
    memoryDate: '1978年 · 春',
    content: '今日整理旧物，翻出父亲当年在供销社的工作笔记。字迹依然清晰，记录了那个年代的点点滴滴。这本笔记我打算扫描上传，作为家族的数字资产保存下来。',
    images: [
       'https://images.unsplash.com/photo-1747460445210-c8b62039d5e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwb2xkJTIwZGlhcnklMjBib29rfGVufDF8fHx8MTc2NjU3MDcyM3ww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    participants: ['@父亲', '@林建国'],
    isUnread: true
  },
  {
    id: '2',
    user: { 
       name: '林建国', 
       relation: '父亲',
       avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100'
    },
    memoryDate: '2024年 · 清明前夕',
    content: '关于今年清明祭祖的安排，我有个想法。考虑到老家路况，建议大家统一包车前往。这里有一段我的口述建议，请大家听听。',
    audio: { duration: "48''" },
    participants: ['@全员'],
    isUnread: false
  },
  {
    id: '3',
    user: { 
       name: '林晓', 
       relation: '堂姐',
       avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100'
    },
    memoryDate: '2025年 · 春节',
    content: '还记得去年的年夜饭吗？大家都说这是这些年来人最齐的一次。特别是奶奶，笑得合不拢嘴。我把那天的合影都修好了，大家快来看看。',
    images: [
       'https://images.unsplash.com/photo-1765582870011-ff3cfdb06700?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwZmFtaWx5JTIwZGlubmVyJTIwcmV1bmlvbnxlbnwxfHx8fDE3NjY1NzA3MjN8MA&ixlib=rb-4.1.0&q=80&w=1080',
       'https://images.unsplash.com/photo-1765939930769-eae384e207b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwY2hpbmVzZSUyMGZhbWlseSUyMHBob3RvJTIwYmxhY2slMjBhbmQlMjB3aGl0ZSUyMDE5ODBzfGVufDF8fHx8MTc2NjU3MDcxNnww&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    participants: ['@奶奶', '@大伯', '@二伯'],
    isUnread: true
  }
];

// --- Sub-Components ---

const HeroSection = ({ onAction }: { onAction: (action: string) => void }) => {
  return (
    <div className="relative pt-28 pb-8 px-6 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[80%] h-[400px] bg-gradient-to-b from-[#E8E6DE] to-transparent -z-10 rounded-bl-[100px] opacity-60" />
      <div className="absolute top-20 right-[-20px] text-[200px] font-serif font-bold text-[#E8E6DE] opacity-60 select-none -z-10 leading-none">
        22
      </div>

      <div className="flex justify-between items-end mb-8 relative z-10">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 bg-[#A63628] rounded-full animate-pulse" />
              <span className="text-[12px] font-bold tracking-[0.2em] text-[#A89260] uppercase">Today's Wisdom</span>
           </div>
           <h2 className="text-[32px] font-bold font-serif text-[#1A1A1A] leading-[1.2] mb-3">
              万物静观皆自得<br/>
              四时佳兴与人同
           </h2>
           <div className="flex items-center gap-4 text-[11px] font-medium text-[#828282]">
              <span className="flex items-center gap-1">
                 <Calendar className="w-3.5 h-3.5" /> 乙巳年 · 冬月廿二
              </span>
              <span className="w-px h-3 bg-[#E0DED5]" />
              <span className="flex items-center gap-1">
                 <Cloud className="w-3.5 h-3.5" /> 上海 · 12°C
              </span>
           </div>
        </div>
      </div>

      {/* Featured Card */}
      <div className="relative bg-white rounded-[2px] p-1 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)]">
         <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur px-3 py-1.5 rounded-[2px] border border-[#E0DED5] flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#34C759]" />
            <span className="text-[10px] font-bold text-[#1A1A1A]">家族空间活跃中</span>
         </div>
         
         <div className="relative aspect-[2/1] overflow-hidden group cursor-pointer">
            <ImageWithFallback 
               src="https://images.unsplash.com/photo-1765939930769-eae384e207b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwY2hpbmVzZSUyMGZhbWlseSUyMHBob3RvJTIwYmxhY2slMjBhbmQlMjB3aGl0ZSUyMDE5ODBzfGVufDF8fHx8MTc2NjU3MDcxNnww&ixlib=rb-4.1.0&q=80&w=1080"
               className="w-full h-full object-cover grayscale-[0.2] group-hover:scale-105 transition-transform duration-1000"
               alt="Old family photo"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
            
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-white">
               <div>
                  <p className="text-[10px] opacity-80 mb-1 tracking-wider uppercase">Latest Memory</p>
                  <p className="text-[16px] font-serif font-bold">老宅春节团圆饭 · 1988</p>
               </div>
               <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <ArrowUpRight className="w-4 h-4 text-white" />
               </div>
            </div>
         </div>
         
         <div className="grid grid-cols-4 divide-x divide-[#F2F0E9] py-4">
             <button onClick={() => onAction('record')} className="flex flex-col items-center gap-1 group">
                <Mic className="w-5 h-5 text-[#1A1A1A] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                <span className="text-[10px] text-[#828282]">口述</span>
             </button>
             <button onClick={() => onAction('upload')} className="flex flex-col items-center gap-1 group">
                <Camera className="w-5 h-5 text-[#1A1A1A] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                <span className="text-[10px] text-[#828282]">影像</span>
             </button>
             <button onClick={() => onAction('tree')} className="flex flex-col items-center gap-1 group">
                <Users className="w-5 h-5 text-[#1A1A1A] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                <span className="text-[10px] text-[#828282]">成员</span>
             </button>
             <button onClick={() => onAction('trace')} className="flex flex-col items-center gap-1 group">
                <Search className="w-5 h-5 text-[#1A1A1A] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                <span className="text-[10px] text-[#828282]">寻踪</span>
             </button>
         </div>
      </div>
    </div>
  );
};

const PrivateFeedHeader = () => (
   <div className="px-6 mb-6 mt-2">
      <div className="bg-[#EBE9E2] rounded-[12px] p-4 flex items-center gap-4 border border-[#E0DED5]/50">
         <div className="w-10 h-10 rounded-full bg-[#A89260]/10 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-[#A89260]" />
         </div>
         <div className="flex-1">
            <h3 className="text-[14px] font-bold text-[#1A1A1A] font-serif">朋友圈留给世界，这里留给家人</h3>
            <p className="text-[10px] text-[#828282] mt-0.5">所有动态默认加密，仅家族成员可见</p>
         </div>
      </div>
   </div>
);

const FamilyMomentCard = ({ user, memoryDate, content, images, audio, participants, isUnread, onClick }: any) => (
   <div className="px-6 mb-6" onClick={onClick}>
      {/* Main Card - Traditional Journal Style */}
      <div className="relative bg-white rounded-[2px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border-l-[3px] border-[#A89260] active:scale-[0.99] transition-all cursor-pointer group hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)]">
         {/* Unread Badge */}
         {isUnread && (
            <div className="absolute -top-2 -right-2 z-20">
               <div className="relative">
                  <div className="w-5 h-5 bg-[#A63628] rounded-full flex items-center justify-center animate-pulse shadow-lg">
                     <span className="text-[9px] font-bold text-white">新</span>
                  </div>
               </div>
            </div>
         )}

         {/* Header with Avatar Seal */}
         <div className="flex items-start justify-between mb-4 relative">
            <div className="flex-1">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-11 h-11 rounded-[2px] overflow-hidden border-2 border-[#E0DED5] shadow-sm">
                     <ImageWithFallback src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                        <span className="text-[16px] font-bold text-[#1A1A1A] font-serif">{user.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-[#F9F9F7] rounded-[2px] text-[#828282] border border-[#E0DED5]">
                           {user.relation}
                        </span>
                     </div>
                     <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-[#A89260] font-medium flex items-center gap-1">
                           <Clock className="w-3 h-3" /> {memoryDate}
                        </span>
                        <span className="text-[11px] text-[#C0C0C0] flex items-center gap-1">
                           <Lock className="w-3 h-3" /> 私密
                        </span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Content */}
         <div className="mb-4">
            <p className="text-[15px] text-[#333] leading-[1.8] font-serif text-justify">
               {content}
            </p>
         </div>

         {/* Images */}
         {images && (
            <div className={`grid gap-2 mb-4 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
               {images.map((img: string, i: number) => (
                  <div key={i} className={`rounded-[2px] overflow-hidden relative ${images.length === 1 ? 'aspect-[16/9]' : 'aspect-square'}`}>
                     <ImageWithFallback src={img} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Memory" />
                     <div className="absolute inset-0 ring-1 ring-black/5 rounded-[2px]" />
                  </div>
               ))}
            </div>
         )}

         {/* Audio Note */}
         {audio && (
            <div className="flex items-center gap-3 bg-[#F9F9F7] p-3 rounded-[2px] border border-[#E0DED5] w-full mb-4 hover:bg-[#F2F0E9] transition-colors">
               <div className="w-8 h-8 bg-[#1A1A1A] rounded-full flex items-center justify-center text-white shrink-0">
                  <Mic className="w-4 h-4" />
               </div>
               <div className="flex-1">
                  <div className="flex justify-between mb-1">
                     <span className="text-[11px] font-bold text-[#1A1A1A]">长辈语音备注</span>
                     <span className="text-[10px] text-[#828282]">{audio.duration}</span>
                  </div>
                  <div className="h-1 w-full bg-[#E0DED5] rounded-full overflow-hidden">
                     <div className="h-full w-1/3 bg-[#A63628]" />
                  </div>
               </div>
            </div>
         )}

         {/* Tags & Participants */}
         {participants && (
            <div className="flex flex-wrap gap-2 mb-4">
               {participants.map((p: string, i: number) => (
                  <span key={i} className="text-[11px] text-[#828282] bg-[#F9F9F7] px-2 py-1 rounded-[2px] flex items-center gap-1 border border-[#E0DED5]">
                     <Users className="w-3 h-3 opacity-50" /> {p}
                  </span>
               ))}
            </div>
         )}

         {/* Actions Bar */}
         <div className="flex items-center justify-between pt-3 border-t border-[#F2F0E9]">
            <div className="flex items-center gap-6">
               <button className="flex items-center gap-1.5 text-[12px] text-[#828282] hover:text-[#A63628] transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>温情</span>
               </button>
               <button className="flex items-center gap-1.5 text-[12px] text-[#828282] hover:text-[#1A1A1A] transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span>评论</span>
               </button>
            </div>
            <button 
               onClick={(e) => { e.stopPropagation(); onClick(); }}
               className="flex items-center gap-1.5 text-[11px] text-[#A89260] font-medium bg-[#A89260]/5 px-3 py-1.5 rounded-[2px] hover:bg-[#A89260]/10 transition-colors border border-[#A89260]/20"
            >
               <PenTool className="w-3 h-3" />
               补充回忆
            </button>
         </div>

         {/* Decorative Element - Traditional Seal Corner */}
         <div className="absolute bottom-3 right-3 w-6 h-6 opacity-5 pointer-events-none">
            <div className="w-full h-full border-2 border-[#A63628] rounded-[2px] rotate-12" />
         </div>
      </div>
   </div>
);

const AppHeader = () => (
   <div className="fixed top-0 left-0 right-0 z-50 bg-[#F2F0E9]/80 backdrop-blur-md border-b border-[#E0DED5]/50 h-14 px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-2">
         <div className="w-6 h-6 bg-[#1A1A1A] text-[#F2F0E9] flex items-center justify-center font-serif font-bold text-[12px] rounded-[4px]">
            林
         </div>
         <span className="text-[14px] font-bold text-[#1A1A1A] tracking-wider font-serif">
            林氏春秋
         </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
         <button className="relative">
            <Bell className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#A63628] rounded-full" />
         </button>
      </div>
   </div>
);

export const HomeView = ({
  onNavigate,
  moments,
}: {
  onNavigate: (route: string) => void;
  moments?: any[];
}) => {
  const [selectedMomentIndex, setSelectedMomentIndex] = useState<number | null>(null);
  const sourceMoments = moments && moments.length > 0 ? moments : MOCK_MOMENTS;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-full bg-[#F2F0E9] pb-24 font-sans selection:bg-[#A63628] selection:text-white"
    >
      <AppHeader />
      
      <HeroSection onAction={onNavigate} />

      <PrivateFeedHeader />
      
      <div className="space-y-2">
         {sourceMoments.map((moment, index) => (
            <FamilyMomentCard 
               key={moment.id}
               {...moment}
               onClick={() => setSelectedMomentIndex(index)}
            />
         ))}
      </div>

      <div className="px-6 py-8 flex flex-col items-center justify-center text-[#828282] opacity-50">
         <div className="w-1 h-8 bg-[#E0DED5] mb-4" />
         <span className="text-[10px] tracking-[0.3em] font-serif uppercase">End of Family History</span>
      </div>

      <AnimatePresence>
        {selectedMomentIndex !== null && (
          <MomentDetailView 
             moments={sourceMoments}
             initialIndex={selectedMomentIndex}
             onClose={() => setSelectedMomentIndex(null)}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
};
