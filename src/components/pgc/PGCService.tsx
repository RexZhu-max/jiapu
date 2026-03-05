import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, Film, Video, Calendar, FileText, 
  MessageSquare, Play, Users, Share2, Star, 
  CheckCircle2, Clock, MapPin, Camera
} from 'lucide-react';

// --- Types ---

export type PGCViewMode = 'intro' | 'project' | 'cinema';

interface PGCProps {
  onBack: () => void;
  initialView?: PGCViewMode;
}

// --- Constants ---

const PACKAGES = [
  {
    id: 'light',
    title: '轻量 · 拾忆',
    subtitle: '线上访谈 + 精剪成片',
    price: '¥2,980',
    features: ['专业编辑线上访谈 (2小时)', '精选老照片修复 (20张)', '15分钟精剪纪录短片', '云端永久存储'],
    color: '#4A7C59', // Jade
    bgImage: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'standard',
    title: '光影 · 传世',
    subtitle: '上门拍摄 + 纪录片级制作',
    price: '¥9,800',
    features: ['导演组上门拍摄 (半天)', '4K电影级设备录制', '30分钟人物传记纪录片', '定制精装蓝光光碟'],
    color: '#C5A059', // Gold
    bgImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600',
    popular: true
  },
  {
    id: 'epic',
    title: '史诗 · 家族书',
    subtitle: '多机位拍摄 + 传记书出版',
    price: '¥29,800',
    features: ['双机位多场景拍摄 (全天)', '家族口述史书稿撰写', '60分钟家族大电影', '私有云NAS交付 + 院线级展映'],
    color: '#B93A32', // Cinnabar
    bgImage: 'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?auto=format&fit=crop&q=80&w=600'
  }
];

// --- Components ---

export const PGCServiceView = ({ onBack, initialView = 'intro' }: PGCProps) => {
  const [view, setView] = React.useState<PGCViewMode>(initialView);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-[#F9F9F7] flex flex-col"
    >
      {view === 'intro' && <PGCIntro onBack={onBack} onEnterProject={() => setView('project')} />}
      {view === 'project' && <PGCProject onBack={() => setView('intro')} onPlay={() => setView('cinema')} />}
      {view === 'cinema' && <PGCCinema onBack={() => setView('project')} />}
    </motion.div>
  );
};

const PGCIntro = ({ onBack, onEnterProject }: { onBack: () => void, onEnterProject: () => void }) => {
  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 pt-14 pb-4">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/30 transition-colors">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <button onClick={onEnterProject} className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[12px] font-medium text-white flex items-center gap-2">
          <span>我的项目</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Hero Background */}
      <div className="h-[45vh] relative">
        <img 
          src="https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&q=80&w=800" 
          alt="Filming" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#F9F9F7]" />
        <div className="absolute bottom-8 left-6 right-6">
          <div className="inline-block px-2 py-1 bg-[#B93A32] text-white text-[10px] font-bold tracking-widest mb-3 rounded-[2px]">
            OFFICIAL PGC
          </div>
          <h1 className="text-[28px] font-bold text-[#1D1D1F] font-serif leading-tight mb-2">
            为家族，<br/>拍一部纪录片。
          </h1>
          <p className="text-[14px] text-[#3A3A3C] font-serif opacity-80">
            林氏春秋 · 官方口述史服务
          </p>
        </div>
      </div>

      {/* Packages Scroll */}
      <div className="flex-1 overflow-y-auto bg-[#F9F9F7] px-6 pb-24 -mt-4 relative z-10 rounded-t-[24px]">
        <div className="py-8 space-y-8">
          {PACKAGES.map((pkg) => (
            <div key={pkg.id} className="relative group cursor-pointer">
              <div className="bg-white rounded-[12px] overflow-hidden shadow-sm border border-[#EBEBE6]">
                <div className="h-32 relative">
                  <img src={pkg.bgImage} alt={pkg.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-center">
                    <h3 className="text-[20px] font-bold text-white font-serif">{pkg.title}</h3>
                    <p className="text-[12px] text-white/80">{pkg.subtitle}</p>
                  </div>
                  {pkg.popular && (
                    <div className="absolute top-4 right-4 bg-[#C5A059] text-white text-[10px] font-bold px-2 py-1 rounded-[2px]">
                      最受欢迎
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-3 text-[13px] text-[#555]">
                        <CheckCircle2 className="w-4 h-4 text-[#1D1D1F] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#EBEBE6]">
                    <div>
                      <span className="text-[18px] font-bold text-[#B93A32] font-serif">{pkg.price}</span>
                      <span className="text-[10px] text-[#8E8E93] ml-1">起</span>
                    </div>
                    <button className="px-5 py-2 bg-[#1D1D1F] text-white text-[13px] font-medium rounded-[4px]">
                      预约咨询
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="p-6 bg-[#EBEBE6]/30 rounded-[8px] text-center">
             <p className="text-[12px] text-[#8E8E93] mb-2">不知道如何选择？</p>
             <button className="text-[13px] text-[#1D1D1F] font-bold underline decoration-1 underline-offset-4">
               联系制作顾问
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PGCProject = ({ onBack, onPlay }: { onBack: () => void, onPlay: () => void }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#F9F9F7]">
      {/* Header */}
      <div className="bg-white border-b border-[#EBEBE6] px-6 pt-14 pb-4 flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-black/5 text-[#8E8E93]">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
        <div className="text-center">
          <h2 className="text-[16px] font-bold text-[#1D1D1F] font-serif">林氏家族·光影传世</h2>
          <p className="text-[10px] text-[#C5A059] flex items-center justify-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            项目进行中
          </p>
        </div>
        <button className="p-2 -mr-2 text-[#1D1D1F]">
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {/* Progress Tracker */}
        <div className="bg-white p-6 rounded-[8px] border border-[#EBEBE6] shadow-sm mb-6">
          <h3 className="text-[14px] font-bold text-[#1D1D1F] mb-6 font-serif">制作进度</h3>
          <div className="relative flex justify-between px-2">
            <div className="absolute top-2.5 left-0 right-0 h-0.5 bg-[#EBEBE6] -z-10" />
            {[
              { label: '提纲', status: 'done', icon: FileText },
              { label: '拍摄', status: 'done', icon: Camera },
              { label: '剪辑', status: 'current', icon: Film },
              { label: '成片', status: 'wait', icon: Play },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-2 bg-white px-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-[2px] ${
                  step.status === 'done' ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white' :
                  step.status === 'current' ? 'bg-white border-[#B93A32] text-[#B93A32]' :
                  'bg-white border-[#EBEBE6] text-[#EBEBE6]'
                }`}>
                  {step.status === 'done' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                   <step.icon className="w-3 h-3" />}
                </div>
                <span className={`text-[10px] ${step.status === 'wait' ? 'text-[#C7C7CC]' : 'text-[#1D1D1F] font-medium'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-[#F9F9F7] rounded-[4px] border border-[#EBEBE6]">
            <div className="flex items-start gap-3">
               <Clock className="w-4 h-4 text-[#B93A32] mt-0.5" />
               <div>
                 <h4 className="text-[13px] font-bold text-[#1D1D1F]">距初剪交付还有 3 天</h4>
                 <p className="text-[11px] text-[#8E8E93] mt-1">剪辑师正在处理“第二章节：求学之路”的色彩校正。</p>
               </div>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <h3 className="text-[14px] font-bold text-[#1D1D1F] font-serif mb-4 pl-2 border-l-2 border-[#1D1D1F]">协同空间</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
           <button className="p-4 bg-white border border-[#EBEBE6] rounded-[8px] text-left hover:border-[#1D1D1F] transition-colors">
              <Calendar className="w-6 h-6 text-[#1D1D1F] mb-3" />
              <div className="text-[14px] font-bold text-[#1D1D1F]">访谈预约</div>
              <div className="text-[10px] text-[#8E8E93] mt-1">下一次：12月24日</div>
           </button>
           <button className="p-4 bg-white border border-[#EBEBE6] rounded-[8px] text-left hover:border-[#1D1D1F] transition-colors">
              <FileText className="w-6 h-6 text-[#1D1D1F] mb-3" />
              <div className="text-[14px] font-bold text-[#1D1D1F]">提纲共创</div>
              <div className="text-[10px] text-[#8E8E93] mt-1">v2.0 已确认</div>
           </button>
           <button className="p-4 bg-white border border-[#EBEBE6] rounded-[8px] text-left hover:border-[#1D1D1F] transition-colors">
              <Video className="w-6 h-6 text-[#1D1D1F] mb-3" />
              <div className="text-[14px] font-bold text-[#1D1D1F]">素材上传</div>
              <div className="text-[10px] text-[#8E8E93] mt-1">共 128 个文件</div>
           </button>
           <button className="p-4 bg-white border border-[#EBEBE6] rounded-[8px] text-left hover:border-[#1D1D1F] transition-colors">
              <MapPin className="w-6 h-6 text-[#1D1D1F] mb-3" />
              <div className="text-[14px] font-bold text-[#1D1D1F]">拍摄地点</div>
              <div className="text-[10px] text-[#8E8E93] mt-1">老宅 / 学校 / 公园</div>
           </button>
        </div>

        {/* Preview Section */}
        <h3 className="text-[14px] font-bold text-[#1D1D1F] font-serif mb-4 pl-2 border-l-2 border-[#1D1D1F]">样片预览</h3>
        <div 
          onClick={onPlay}
          className="relative w-full aspect-video bg-black rounded-[8px] overflow-hidden group cursor-pointer shadow-md"
        >
          <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
               <Play className="w-5 h-5 fill-current ml-1" />
             </div>
          </div>
          <div className="absolute bottom-3 left-3">
             <span className="text-white text-[12px] font-medium font-serif">预告片：林氏家风</span>
             <span className="ml-2 px-1.5 py-0.5 bg-[#B93A32] text-white text-[9px] rounded-[2px]">NEW</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PGCCinema = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#000] text-white">
      {/* Immersive Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 pt-14 pb-4 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/80">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
        <div className="flex gap-4">
           <button className="p-2 hover:bg-white/10 rounded-full text-white/80"><Share2 className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Player Area */}
      <div className="w-full aspect-video bg-[#111] mt-[100px] relative">
         <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-60" />
         <div className="absolute inset-0 flex items-center justify-center">
             <Play className="w-16 h-16 text-white/80 fill-white/20" />
         </div>
         {/* Progress Bar Mock */}
         <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div className="w-1/3 h-full bg-[#B93A32]" />
         </div>
      </div>

      {/* Info & Chapters */}
      <div className="flex-1 overflow-y-auto bg-[#1D1D1F] rounded-t-[24px] -mt-4 relative z-10 p-6">
         <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[20px] font-bold text-[#F9F9F7] font-serif">林氏家风 · 传世纪录片</h2>
              <p className="text-[12px] text-[#8E8E93] mt-1">导演：张艺 · 2024</p>
            </div>
            <button className="px-3 py-1 bg-[#F9F9F7]/10 border border-[#F9F9F7]/20 rounded-full text-[10px] text-[#F9F9F7]">
               生成短视频
            </button>
         </div>

         <div className="space-y-6">
            {/* Associated People */}
            <div>
               <h3 className="text-[12px] font-bold text-[#8E8E93] mb-3 uppercase tracking-widest">出镜人物</h3>
               <div className="flex gap-3 overflow-x-auto pb-2">
                  {[
                    { name: '林国强', role: '祖父' },
                    { name: '林建国', role: '父亲' },
                    { name: '林志', role: '我' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-2 bg-[#2C2C2E] px-3 py-1.5 rounded-full shrink-0">
                       <div className="w-6 h-6 rounded-full bg-[#3A3A3C] flex items-center justify-center text-[10px] text-white">
                         {p.name[0]}
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[11px] text-[#F9F9F7]">{p.name}</span>
                          <span className="text-[9px] text-[#8E8E93]">{p.role}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Chapters */}
            <div>
               <h3 className="text-[12px] font-bold text-[#8E8E93] mb-3 uppercase tracking-widest">章节选段</h3>
               <div className="space-y-3">
                  {[
                    { time: '02:15', title: '老宅的四季', active: true },
                    { time: '08:40', title: '远行与归乡', active: false },
                    { time: '15:20', title: '家训传承', active: false },
                    { time: '22:05', title: '给未来的信', active: false },
                  ].map((c, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-[4px] ${c.active ? 'bg-[#3A3A3C]' : 'bg-transparent border border-[#3A3A3C]'}`}>
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.active ? 'bg-[#B93A32] text-white' : 'bg-[#2C2C2E] text-[#8E8E93]'}`}>
                             <Play className="w-3 h-3 fill-current" />
                          </div>
                          <div>
                             <p className={`text-[13px] ${c.active ? 'text-white font-bold' : 'text-[#8E8E93]'}`}>{c.title}</p>
                             <p className="text-[10px] text-[#555]">{c.time}</p>
                          </div>
                       </div>
                       {c.active && <div className="w-1.5 h-1.5 rounded-full bg-[#B93A32]" />}
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
