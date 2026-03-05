import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, ArrowRight, MessageSquare, Clock, 
  Target, Sparkles, AlertCircle, Camera, Mic,
  CheckCircle2, ChevronRight, PenTool, Database,
  TrendingUp, Calendar, Trophy
} from 'lucide-react';
import { SupplementInfoView } from './SupplementInfoView';
import { UploadPhotoView } from './UploadPhotoView';
import { EventPlanView } from './EventPlanView';
import { ReplyRequestView } from './ReplyRequestView';

// --- Logic & Types ---

// 1. 家族愿景/工程逻辑 (Family Project Logic)
// 逻辑说明：不仅仅是一个进度条，而是基于维度的"工程化"目标管理。
// 进度 = (当前已完善节点 / 目标节点) * 权重 + (当前影像 / 目标影像) * 权重 ...
interface ProjectStats {
  members: { current: number; target: number }; // 成员完善度
  photos: { current: number; target: number };  // 影像覆盖率
  stories: { current: number; target: number }; // 口述采集量
}

const PROJECT_DATA: ProjectStats = {
  members: { current: 42, target: 50 },  // 还需要完善8人的基础信息
  photos: { current: 128, target: 200 }, // 2025年目标是收集200张老照片
  stories: { current: 5, target: 20 },   // 目标采集20个口述故事
};

// 2. 智能任务逻辑 (Smart Task Logic)
// 逻辑说明：任务不是随机生成的，而是基于数据缺失(Gap Analysis)和时间节点(Milestones)自动生成的。
type TaskType = 'gap_info' | 'gap_photo' | 'milestone' | 'request';
type TaskPriority = 'high' | 'medium' | 'low';

interface SmartTask {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  title: string;
  reason: string; // 生成原因 (The "Why")
  reward: number; // 贡献值奖励
  actionLabel: string;
}

const SMART_TASKS: SmartTask[] = [
  {
    id: 't1',
    type: 'gap_info',
    priority: 'high',
    title: '补充祖父生卒年份',
    reason: '系统检测：核心直系长辈信息缺失，影响家谱连贯性',
    reward: 50,
    actionLabel: '去补充'
  },
  {
    id: 't2',
    type: 'gap_photo',
    priority: 'medium',
    title: '上传1990年全家福',
    reason: '时间轴空缺：1990-1995年间缺少影像记录',
    reward: 30,
    actionLabel: '上传照片'
  },
  {
    id: 't3',
    type: 'milestone',
    priority: 'medium',
    title: '筹备奶奶80大寿',
    reason: '日历提醒：农历十月十五（还有12天）',
    reward: 100,
    actionLabel: '查看策划'
  },
  {
    id: 't4',
    type: 'request',
    priority: 'low',
    title: '二伯请求协助',
    reason: '成员求助：询问老宅拆迁前的具体门牌号',
    reward: 20,
    actionLabel: '回复'
  }
];

// --- Sub-Components ---

const ProjectDashboard = () => {
  // Calculate total progress
  const memProgress = (PROJECT_DATA.members.current / PROJECT_DATA.members.target) * 100;
  const photoProgress = (PROJECT_DATA.photos.current / PROJECT_DATA.photos.target) * 100;
  const storyProgress = (PROJECT_DATA.stories.current / PROJECT_DATA.stories.target) * 100;
  
  const totalProgress = Math.round((memProgress + photoProgress + storyProgress) / 3);

  return (
    <div className="bg-[#1D1D1F] rounded-[20px] p-6 text-[#F9F9F7] relative overflow-hidden mb-8 shadow-xl">
       {/* Background Decor */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#C5A059]/20 to-transparent rounded-full blur-[60px] pointer-events-none -mr-16 -mt-16" />
       
       <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
             <div>
                <div className="flex items-center gap-2 mb-2">
                   <span className="px-2 py-0.5 rounded-[4px] bg-[#C5A059] text-[#1D1D1F] text-[10px] font-bold tracking-wider">
                      2025年度计划
                   </span>
                   <span className="text-[10px] text-white/50 border border-white/20 px-2 py-0.5 rounded-[4px]">
                      剩余 324 天
                   </span>
                </div>
                <h2 className="text-[20px] font-bold font-serif leading-tight">
                   百年家史 · 数字化工程
                </h2>
                <p className="text-[12px] text-white/60 mt-1">
                   数字化重建家族记忆，传承至云端
                </p>
             </div>
             <div className="text-right">
                <span className="text-[32px] font-bold font-serif text-[#C5A059] leading-none">{totalProgress}%</span>
                <p className="text-[10px] text-white/40 mt-1">总体进度</p>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="bg-white/5 rounded-[12px] p-3 border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-2 text-[#C5A059]">
                   <Database className="w-3.5 h-3.5" />
                   <span className="text-[11px] font-bold">谱系</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1.5">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${memProgress}%` }} className="h-full bg-[#C5A059]" />
                </div>
                <span className="text-[10px] text-white/60">{PROJECT_DATA.members.current}/{PROJECT_DATA.members.target} 人</span>
             </div>

             <div className="bg-white/5 rounded-[12px] p-3 border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-2 text-[#C5A059]">
                   <Camera className="w-3.5 h-3.5" />
                   <span className="text-[11px] font-bold">影像</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1.5">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${photoProgress}%` }} className="h-full bg-[#C5A059]" />
                </div>
                <span className="text-[10px] text-white/60">{PROJECT_DATA.photos.current}/{PROJECT_DATA.photos.target} 张</span>
             </div>

             <div className="bg-white/5 rounded-[12px] p-3 border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-2 text-[#C5A059]">
                   <Mic className="w-3.5 h-3.5" />
                   <span className="text-[11px] font-bold">口述</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1.5">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${storyProgress}%` }} className="h-full bg-[#C5A059]" />
                </div>
                <span className="text-[10px] text-white/60">{PROJECT_DATA.stories.current}/{PROJECT_DATA.stories.target} 条</span>
             </div>
          </div>
       </div>
    </div>
  );
};

const SmartTaskCard = ({ task, onClick }: { task: SmartTask, onClick: (task: SmartTask) => void }) => {
  const isHighPriority = task.priority === 'high';
  
  return (
    <div className={`group relative p-4 rounded-[12px] border transition-all active:scale-[0.98] ${
       isHighPriority 
       ? 'bg-white border-[#B93A32]/30 shadow-[0_4px_12px_rgba(185,58,50,0.05)]' 
       : 'bg-white border-[#EBEBE6] shadow-sm'
    }`}>
       {isHighPriority && (
          <div className="absolute top-0 right-0 px-2 py-1 bg-[#B93A32] text-white text-[9px] font-bold rounded-bl-[8px] rounded-tr-[11px]">
             急需完善
          </div>
       )}

       <div className="flex items-start gap-3 mb-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
             task.type === 'gap_info' ? 'bg-[#FFF0F0] text-[#B93A32]' :
             task.type === 'gap_photo' ? 'bg-[#FDFBF7] text-[#C5A059]' :
             'bg-[#F5F5F7] text-[#1D1D1F]'
          }`}>
             {task.type === 'gap_info' && <PenTool className="w-4 h-4" />}
             {task.type === 'gap_photo' && <Camera className="w-4 h-4" />}
             {task.type === 'milestone' && <Calendar className="w-4 h-4" />}
             {task.type === 'request' && <MessageSquare className="w-4 h-4" />}
          </div>
          <div className="flex-1">
             <h3 className="text-[15px] font-bold text-[#1D1D1F] font-serif leading-tight mb-1">
                {task.title}
             </h3>
             <p className="text-[11px] text-[#8E8E93] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {task.reason}
             </p>
          </div>
       </div>

       <div className="flex items-center justify-between border-t border-[#F5F5F7] pt-3">
          <div className="flex items-center gap-1.5">
             <Trophy className="w-3.5 h-3.5 text-[#C5A059]" />
             <span className="text-[11px] font-medium text-[#C5A059]">+{task.reward} 贡献值</span>
          </div>
          <button 
             onClick={() => onClick(task)}
             className={`px-3 py-1.5 rounded-[4px] text-[11px] font-bold flex items-center gap-1 transition-colors ${
             isHighPriority 
             ? 'bg-[#B93A32] text-white hover:bg-[#A02820]' 
             : 'bg-[#1D1D1F] text-white hover:bg-[#333]'
          }`}>
             {task.actionLabel} <ChevronRight className="w-3 h-3" />
          </button>
       </div>
    </div>
  );
};

const ActivityLog = ({ date, title, desc, user }: any) => (
   <div className="relative pl-6 pb-8 last:pb-0 border-l border-[#EBEBE6]">
      <div className="absolute left-[-5px] top-[6px] w-[9px] h-[9px] rounded-full bg-[#1D1D1F] border-[2px] border-[#F9F9F7]" />
      <div className="flex items-start justify-between mb-1">
         <span className="text-[13px] font-bold text-[#1D1D1F]">{title}</span>
         <span className="text-[10px] text-[#8E8E93] font-mono">{date}</span>
      </div>
      <p className="text-[12px] text-[#555] mb-2">{desc}</p>
      <div className="flex items-center gap-1.5 bg-white border border-[#EBEBE6] rounded-full px-2 py-1 w-fit">
         <img src={user.avatar} className="w-4 h-4 rounded-full object-cover" />
         <span className="text-[10px] text-[#1D1D1F]">{user.name}</span>
      </div>
   </div>
);

// --- Main View ---

export const CoCreationView = () => {
  const [activeTab, setActiveTab] = useState<'todo' | 'log'>('todo');
  const [selectedTask, setSelectedTask] = useState<SmartTask | null>(null);

  const handleTaskClick = (task: SmartTask) => {
    setSelectedTask(task);
  };

  return (
    <div className="bg-[#F9F9F7] min-h-full flex flex-col pb-24 font-sans">
       {/* Header */}
       <div className="px-6 pt-14 pb-4 sticky top-0 bg-[#F9F9F7]/95 backdrop-blur-sm z-30">
          <div className="flex justify-between items-center mb-4">
             <div>
                <h1 className="text-[24px] font-bold text-[#1D1D1F] font-serif">家族共创</h1>
                <p className="text-[12px] text-[#8E8E93] mt-1 tracking-wide">Family Co-creation</p>
             </div>
             <button className="relative">
                <div className="w-10 h-10 rounded-full bg-white border border-[#EBEBE6] flex items-center justify-center text-[#1D1D1F] shadow-sm">
                   <Target className="w-5 h-5" />
                </div>
                <div className="absolute top-0 right-0 w-3 h-3 bg-[#B93A32] rounded-full border-2 border-[#F9F9F7]" />
             </button>
          </div>
       </div>

       <div className="px-6 flex-1 overflow-y-auto">
          {/* 1. Project Dashboard (Family Goal Logic) */}
          <ProjectDashboard />

          {/* 2. Tasks & Activities */}
          <div className="mb-6">
             <div className="flex items-center gap-6 mb-4 border-b border-[#EBEBE6]">
                <button 
                   onClick={() => setActiveTab('todo')}
                   className={`pb-2 text-[14px] font-bold transition-colors relative ${activeTab === 'todo' ? 'text-[#1D1D1F]' : 'text-[#8E8E93]'}`}
                >
                   智能任务
                   {activeTab === 'todo' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B93A32]" />}
                </button>
                <button 
                   onClick={() => setActiveTab('log')}
                   className={`pb-2 text-[14px] font-bold transition-colors relative ${activeTab === 'log' ? 'text-[#1D1D1F]' : 'text-[#8E8E93]'}`}
                >
                   修谱日志
                   {activeTab === 'log' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B93A32]" />}
                </button>
             </div>

             <AnimatePresence mode="wait">
                {activeTab === 'todo' ? (
                   <motion.div 
                      key="todo"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                   >
                      <div className="flex items-center justify-between px-1">
                         <span className="text-[12px] text-[#8E8E93]">发现 {SMART_TASKS.length} 个待完善项</span>
                         <button className="text-[12px] text-[#C5A059] font-medium flex items-center gap-1">
                            全部领取 <ArrowRight className="w-3 h-3" />
                         </button>
                      </div>
                      {SMART_TASKS.map(task => (
                         <SmartTaskCard key={task.id} task={task} onClick={handleTaskClick} />
                      ))}
                   </motion.div>
                ) : (
                   <motion.div 
                      key="log"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white rounded-[16px] p-6 border border-[#EBEBE6]"
                   >
                      <ActivityLog 
                         date="10分钟前"
                         title="完善了核心信息"
                         desc="补充了[祖父]的出生地信息，并通过了系统校验。"
                         user={{ name: '我', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100' }}
                      />
                      <ActivityLog 
                         date="今天 09:30"
                         title="上传了珍贵影像"
                         desc="上传了3张1980年代的老照片，系统已自动关联到[二伯]的时间轴。"
                         user={{ name: '林晓', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100' }}
                      />
                      <ActivityLog 
                         date="昨天 20:15"
                         title="发起了口述访谈"
                         desc="创建了新的访谈任务“关于老宅的回忆”，邀请了3位成员参与。"
                         user={{ name: '林建国', avatar: 'https://images.unsplash.com/photo-1697144532799-c94b0344c1cb?auto=format&fit=crop&q=80&w=100' }}
                      />
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
       </div>

       {/* Task Detail Overlays */}
       <AnimatePresence>
          {selectedTask?.type === 'gap_info' && (
             <SupplementInfoView 
                onClose={() => setSelectedTask(null)} 
                taskTitle={selectedTask.title}
             />
          )}
          {selectedTask?.type === 'gap_photo' && (
             <UploadPhotoView 
                onClose={() => setSelectedTask(null)} 
                taskTitle={selectedTask.title}
             />
          )}
          {selectedTask?.type === 'milestone' && (
             <EventPlanView 
                onClose={() => setSelectedTask(null)} 
                taskTitle={selectedTask.title}
             />
          )}
          {selectedTask?.type === 'request' && (
             <ReplyRequestView 
                onClose={() => setSelectedTask(null)} 
                taskTitle={selectedTask.title}
             />
          )}
       </AnimatePresence>
    </div>
  );
};